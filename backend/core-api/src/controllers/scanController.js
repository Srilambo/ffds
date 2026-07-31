const fs = require('fs');
const path = require('path');
const Scan = require('../models/Scan');
const InventoryItem = require('../models/InventoryItem');
const cnnClient = require('../services/cnnClient');
const { generateGasReadings } = require('../services/gasSim');
const geminiClient = require('../services/geminiClient');

const IMAGES_DIR = path.join(__dirname, '../../assets/images');

function imageExtension(mimetype) {
  const map = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
  };
  return map[mimetype] || '.jpg';
}

function saveImage(buffer, mimetype) {
  try {
    if (!fs.existsSync(IMAGES_DIR)) {
      fs.mkdirSync(IMAGES_DIR, { recursive: true });
    }
    const ext = imageExtension(mimetype);
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const filepath = path.join(IMAGES_DIR, filename);
    fs.writeFileSync(filepath, buffer);
    return `/assets/images/${filename}`;
  } catch (err) {
    console.warn(`[scanController] Local disk write failed: ${err.message}. Falling back to Base64 data URI.`);
    const base64 = buffer.toString('base64');
    return `data:${mimetype || 'image/jpeg'};base64,${base64}`;
  }
}

async function createScan(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file required' });
    }

    const { buffer, mimetype, originalname } = req.file;
    const cnnResult = await cnnClient.classifyImage(buffer, mimetype);
    const gasReadings = generateGasReadings(cnnResult.label, cnnResult.confidence);
    const imageUrl = saveImage(buffer, mimetype);

    // Always resolve food name from image (Gemini vision + CNN + filename hint + color heuristic)
    const resolvedFoodType = (await geminiClient.resolveFoodType(buffer, mimetype, cnnResult, originalname)) || cnnResult.foodType || 'Apple';

    // Calculate expiration date based on freshness label
    const now = new Date();
    let expiryDate = null;
    if (cnnResult.label === 'Fresh') {
      expiryDate = new Date(now.setDate(now.getDate() + 7)); // Fresh items last ~7 days
    } else if (cnnResult.label === 'Borderline') {
      expiryDate = new Date(now.setDate(now.getDate() + 3)); // Borderline items last ~3 days
    } else {
      expiryDate = new Date(now.setDate(now.getDate() + 1)); // Spoiled items expire in 1 day
    }

    // explainScan now returns { text, foodType } where foodType is Gemini-identified
    // when the CNN fallback returned a generic label like "Detected Item"
    let explanation = '';
    let finalFoodType = resolvedFoodType;
    try {
      const geminiResult = await geminiClient.explainScan({
        ...cnnResult,
        foodType: resolvedFoodType,
        gasReadings,
        language: req.user.language,
        role: req.user.role,
        imageBuffer: buffer,
        mimeType: mimetype,
      });

      explanation = typeof geminiResult === 'string' ? geminiResult : geminiResult.text;
      if (typeof geminiResult === 'object' && geminiResult.foodType && !geminiClient.isGenericFoodLabel(geminiResult.foodType)) {
        finalFoodType = geminiResult.foodType;
      }
    } catch (geminiErr) {
      console.warn('Gemini explanation failed, proceeding without it:', geminiErr.message);
      explanation = `Food analysis complete. ${cnnResult.label} with ${cnnResult.confidence}% confidence.`;
    }

    // Build scan document with role-specific fields
    const scanData = {
      userId: req.user._id,
      imageUrl,
      foodType: geminiClient.normalizeFoodTypeName(finalFoodType) || finalFoodType || 'Food Item',
      label: cnnResult.label,
      confidence: cnnResult.confidence,
      gasReadings,
      chatbotExplanation: explanation,
      expiryDate,
    };

    // Attach role-specific IDs
    if (req.user.role === 'manager' && req.user.businessId) {
      scanData.businessId = req.user.businessId;
    }
    if (req.user.role === 'farmer' && req.user.farmId) {
      scanData.farmId = req.user.farmId;
    }
    // batchId would be set from farmer batch-scan endpoint, not single scan

    const scan = await Scan.create(scanData);

    // For manager/farmer roles, also create inventory item
    const hasBusinessId = req.user.role === 'manager' && req.user.businessId;
    const hasFarmId = req.user.role === 'farmer' && req.user.farmId;
    if (hasBusinessId || hasFarmId) {
      const ownerType = req.user.role === 'manager' ? 'business' : 'farm';
      const ownerId = req.user.role === 'manager' ? req.user.businessId : req.user.farmId;
      
      await InventoryItem.create({
        ownerId,
        ownerType,
        foodName: geminiClient.normalizeFoodTypeName(finalFoodType) || finalFoodType || 'Food Item',
        category: 'fruit', // Default, can be updated later
        quantity: 1,
        unit: 'pcs',
        purchaseDate: new Date(),
        expiryDate,
        status: cnnResult.label === 'Fresh' ? 'fresh' : (cnnResult.label === 'Borderline' ? 'expiring' : 'spoiled'),
        location: 'warehouse',
        linkedScanId: scan._id,
      });
    }

    return res.status(201).json(scan);
  } catch (err) {
    next(err);
  }
}

async function listScans(req, res, next) {
  try {
    const scans = await Scan.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json(scans);
  } catch (err) {
    next(err);
  }
}

async function getScan(req, res, next) {
  try {
    const scan = await Scan.findById(req.params.id);
    if (!scan) {
      return res.status(404).json({ error: 'Scan not found' });
    }
    if (scan.userId && scan.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ error: 'Scan not found' });
    }
    return res.status(200).json(scan);
  } catch (err) {
    next(err);
  }
}

async function updateScanFoodType(req, res, next) {
  try {
    const { id } = req.params;
    const { foodType } = req.body;

    if (!foodType || !foodType.trim()) {
      return res.status(400).json({ error: 'Food type is required' });
    }

    const scan = await Scan.findById(id);
    if (!scan) {
      return res.status(404).json({ error: 'Scan not found' });
    }
    if (scan.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ error: 'Scan not found' });
    }

    const normalized = geminiClient.normalizeFoodTypeName(foodType.trim());
    scan.foodType = normalized;

    try {
      const geminiResult = await geminiClient.explainScan({
        foodType: normalized,
        label: scan.label,
        confidence: scan.confidence,
        gasReadings: scan.gasReadings,
        language: req.user.language || 'en',
        role: req.user.role || 'consumer',
      });
      scan.chatbotExplanation = typeof geminiResult === 'string' ? geminiResult : geminiResult.text;
    } catch (err) {
      console.warn('[updateScanFoodType] Failed to regenerate explanation:', err.message);
    }

    await scan.save();
    return res.status(200).json(scan);
  } catch (err) {
    next(err);
  }
}

module.exports = { createScan, listScans, getScan, updateScanFoodType };
