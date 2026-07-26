const mongoose = require('mongoose');
const Scan = require('../models/Scan');
const Batch = require('../models/Batch');
const InventoryItem = require('../models/InventoryItem');
const WasteLog = require('../models/WasteLog');
const cnnClient = require('../services/cnnClient');
const { generateGasReadings } = require('../services/gasSim');
const geminiClient = require('../services/geminiClient');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, '../../uploads');
const REPORTS_DIR = path.join(__dirname, '../../uploads/reports');

function saveImage(buffer, mimetype) {
  try {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
    const ext = mimetype === 'image/png' ? '.png' : '.jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    fs.writeFileSync(filepath, buffer);
    return `/uploads/${filename}`;
  } catch (err) {
    console.warn(`[farmerController] Local disk write failed: ${err.message}. Falling back to Base64 data URI.`);
    const base64 = buffer.toString('base64');
    return `data:${mimetype || 'image/jpeg'};base64,${base64}`;
  }
}

async function getDashboard(req, res, next) {
  try {
    const farmId = req.user.farmId || req.user.businessId || req.user.teamId || req.user._id;

    const batches = await Batch.find({ $or: [{ farmerId: farmId }, { farmerId: req.user._id }] }).sort({ createdAt: -1 });
    const scans = await Scan.find({ $or: [{ farmId }, { userId: req.user._id }] }).sort({ createdAt: -1 });
    
    // Calculate average quality score
    const avgQualityScore = batches.length > 0
      ? batches.reduce((sum, b) => sum + (b.qualityScore || 0), 0) / batches.length
      : 0;

    // Get sell/hold recommendation for latest batch
    let recommendation = 'No batches yet';
    if (batches.length > 0) {
      const latest = batches[0];
      if (latest.qualityScore >= 80) recommendation = 'Sell now';
      else if (latest.qualityScore >= 50) recommendation = 'Sell soon';
      else recommendation = 'Hold / discount';
    }

    // Recent batches (last 5)
    const recentBatches = batches.slice(0, 5).map((b) => ({
      _id: b._id,
      batchName: b.batchName,
      foodType: b.foodType,
      totalItems: b.totalItems,
      freshCount: b.freshCount,
      borderlineCount: b.borderlineCount,
      spoiledCount: b.spoiledCount,
      qualityScore: b.qualityScore,
      estimatedValue: b.estimatedValue,
      createdAt: b.createdAt,
    }));

    return res.status(200).json({
      recentBatches,
      avgQualityScore: Math.round(avgQualityScore * 10) / 10,
      recommendation,
      totalBatches: batches.length,
      totalScans: scans.length,
    });
  } catch (err) {
    next(err);
  }
}

async function batchScan(req, res, next) {
  try {
    const farmId = req.user.farmId || req.user.businessId || req.user.teamId || req.user._id;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'At least one image required' });
    }

    const { batchName, foodType, estimatedValue, currency = 'USD' } = req.body;
    if (!batchName || !foodType) {
      return res.status(400).json({ error: 'batchName and foodType are required' });
    }

    const images = req.files;
    const results = [];
    let freshCount = 0, borderlineCount = 0, spoiledCount = 0;

    for (const file of images) {
      const { buffer, mimetype } = file;
      
      // Run through CNN
      const cnnResult = await cnnClient.classifyImage(buffer, mimetype);
      const gasReadings = generateGasReadings(cnnResult.label, cnnResult.confidence);
      const imageUrl = saveImage(buffer, mimetype);

      // Resolve food type — pass full cnnResult object so isMock flag is preserved
      const resolvedFoodType = await geminiClient.resolveFoodType(buffer, mimetype, cnnResult);

      // Get explanation
      let explanation = '';
      let finalFoodType = resolvedFoodType;
      try {
        const geminiResult = await geminiClient.explainScan({
          ...cnnResult,
          foodType: resolvedFoodType,
          gasReadings,
          language: req.user.language,
          role: 'farmer',
          imageBuffer: buffer,
          mimeType: mimetype,
        });
        explanation = typeof geminiResult === 'string' ? geminiResult : geminiResult.text;
        if (typeof geminiResult === 'object' && geminiResult.foodType && !geminiClient.isGenericFoodLabel(geminiResult.foodType)) {
          finalFoodType = geminiResult.foodType;
        }
      } catch (e) {
        explanation = `Analysis: ${cnnResult.label} (${cnnResult.confidence}%)`;
      }

      // Count categories
      if (cnnResult.label === 'Fresh') freshCount++;
      else if (cnnResult.label === 'Borderline') borderlineCount++;
      else spoiledCount++;

      // Save individual scan
      const scan = await Scan.create({
        userId: req.user._id,
        farmId,
        imageUrl,
        foodType: geminiClient.normalizeFoodTypeName(finalFoodType || foodType),
        label: cnnResult.label,
        confidence: cnnResult.confidence,
        gasReadings,
        chatbotExplanation: explanation,
      });

      results.push({
        scanId: scan._id,
        imageUrl: scan.imageUrl,
        foodType: scan.foodType,
        label: scan.label,
        confidence: scan.confidence,
        gasReadings: scan.gasReadings,
        explanation,
      });
    }

    const totalItems = images.length;
    const qualityScore = totalItems > 0
      ? Math.round(((freshCount * 1 + borderlineCount * 0.5) / totalItems) * 100)
      : 0;

    // Calculate estimated value
    const baseValue = parseFloat(estimatedValue) || totalItems * 10; // Default $10/item if not provided
    const estimatedValueCalculated = Math.round(baseValue * (qualityScore / 100) * 100) / 100;

    // Create batch
    const batch = await Batch.create({
      farmerId: farmId,
      batchName,
      foodType,
      totalItems,
      freshCount,
      borderlineCount,
      spoiledCount,
      qualityScore,
      estimatedValue: estimatedValueCalculated,
      currency,
    });

    // Link scans to batch
    await Scan.updateMany(
      { farmId, batchId: { $exists: false } },
      { batchId: batch._id }
    );

    // Generate sell/hold recommendation
    let recommendation = 'Hold / discount';
    if (qualityScore >= 80) recommendation = 'Sell now';
    else if (qualityScore >= 50) recommendation = 'Sell soon';

    return res.status(201).json({
      batch: {
        _id: batch._id,
        batchName: batch.batchName,
        foodType: batch.foodType,
        totalItems: batch.totalItems,
        freshCount: batch.freshCount,
        borderlineCount: batch.borderlineCount,
        spoiledCount: batch.spoiledCount,
        qualityScore: batch.qualityScore,
        estimatedValue: batch.estimatedValue,
        currency: batch.currency,
        recommendation,
        createdAt: batch.createdAt,
      },
      scans: results,
    });
  } catch (err) {
    next(err);
  }
}

async function listBatches(req, res, next) {
  try {
    const farmId = req.user.farmId;
    const batches = await Batch.find({ farmerId: farmId }).sort({ createdAt: -1 });
    return res.status(200).json(batches);
  } catch (err) {
    next(err);
  }
}

async function getBatch(req, res, next) {
  try {
    const farmId = req.user.farmId;
    const batch = await Batch.findOne({ _id: req.params.id, farmerId: farmId });
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    
    const scans = await Scan.find({ batchId: batch._id }).sort({ createdAt: -1 });
    
    return res.status(200).json({ batch, scans });
  } catch (err) {
    next(err);
  }
}

async function getCalendar(req, res, next) {
  try {
    const farmId = req.user.farmId;
    const batches = await Batch.find({ farmerId: farmId }).sort({ createdAt: 1 });
    
    // Group by date
    const byDate = batches.reduce((acc, batch) => {
      const date = new Date(batch.createdAt).toISOString().split('T')[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push({
        _id: batch._id,
        batchName: batch.batchName,
        foodType: batch.foodType,
        qualityScore: batch.qualityScore,
        totalItems: batch.totalItems,
      });
      return acc;
    }, {});

    // Seasonal trend: group by month
    const byMonth = batches.reduce((acc, batch) => {
      const date = new Date(batch.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!acc[monthKey]) acc[monthKey] = { count: 0, avgQuality: 0, totalItems: 0, qualitySum: 0 };
      acc[monthKey].count++;
      acc[monthKey].totalItems += batch.totalItems;
      acc[monthKey].qualitySum += batch.qualityScore;
      acc[monthKey].avgQuality = Math.round((acc[monthKey].qualitySum / acc[monthKey].count) * 10) / 10;
      return acc;
    }, {});

    return res.status(200).json({ byDate, byMonth });
  } catch (err) {
    next(err);
  }
}

async function logLoss(req, res, next) {
  try {
    const farmId = req.user.farmId || req.user.businessId || req.user.teamId || req.user._id;

    const { harvestDate, foodType, harvestedQty, soldQty, wastedQty, unit, estimatedCostPerUnit, currency = 'USD', reason } = req.body;

    if (!foodType || harvestedQty === undefined || soldQty === undefined || wastedQty === undefined) {
      return res.status(400).json({ error: 'foodType, harvestedQty, soldQty, wastedQty are required' });
    }

    const totalCost = (parseFloat(estimatedCostPerUnit) || 0) * (parseFloat(harvestedQty) || 0);
    const soldValue = (parseFloat(estimatedCostPerUnit) || 0) * (parseFloat(soldQty) || 0);
    const wasteValue = (parseFloat(estimatedCostPerUnit) || 0) * (parseFloat(wastedQty) || 0);
    const financialLoss = totalCost - soldValue;

    // Create waste log
    await WasteLog.create({
      ownerId: farmId,
      ownerType: 'farm',
      userId: req.user._id,
      foodName: foodType,
      quantity: parseFloat(wastedQty),
      unit: unit || 'kg',
      estimatedCost: wasteValue,
      currency,
      reason: reason || 'Post-harvest loss',
    });

    // Also create inventory item if there's remaining stock
    const remaining = Math.max(0, parseFloat(harvestedQty) - parseFloat(soldQty) - parseFloat(wastedQty));
    if (remaining > 0) {
      await InventoryItem.create({
        ownerId: farmId,
        ownerType: 'farm',
        userId: req.user._id,
        foodName: foodType,
        category: 'vegetable',
        quantity: remaining,
        unit: unit || 'kg',
        purchaseDate: new Date(harvestDate || Date.now()),
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'fresh',
        location: 'farm',
      });
    }

    return res.status(201).json({
      message: 'Loss logged',
      harvestedQty: parseFloat(harvestedQty),
      soldQty: parseFloat(soldQty),
      wastedQty: parseFloat(wastedQty),
      remainingQty: remaining,
      totalCost,
      soldValue,
      wasteValue,
      financialLoss,
    });
  } catch (err) {
    next(err);
  }
}

async function getLossHistory(req, res, next) {
  try {
    const farmId = req.user.farmId || req.user.businessId || req.user.teamId || req.user._id;
    const wasteLogs = await WasteLog.find({ $or: [{ ownerId: farmId }, { userId: req.user._id }] })
      .sort({ createdAt: -1 });

    // Calculate financial loss by month
    const byMonth = wasteLogs.reduce((acc, log) => {
      const date = new Date(log.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!acc[monthKey]) acc[monthKey] = { label: monthKey, loss: 0, wastedQty: 0 };
      acc[monthKey].loss += log.estimatedCost || 0;
      acc[monthKey].wastedQty += log.quantity || 0;
      return acc;
    }, {});

    const labels = Object.keys(byMonth).sort();
    const values = labels.map(k => byMonth[k].loss);

    return res.status(200).json({
      logs: wasteLogs,
      monthlyLoss: { labels, values },
      totalLoss: wasteLogs.reduce((sum, l) => sum + (l.estimatedCost || 0), 0),
    });
  } catch (err) {
    next(err);
  }
}

async function generateBuyerReport(req, res, next) {
  try {
    const batch = await Batch.findById(req.params.batchId);
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    // Generate QR code linking to verification URL
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify/batch/${batch._id}`;
    const qrDataUrl = await QRCode.toDataURL(verificationUrl);

    // Generate PDF report
    if (!fs.existsSync(REPORTS_DIR)) {
      fs.mkdirSync(REPORTS_DIR, { recursive: true });
    }

    const filename = `buyer-report-${batch._id}-${Date.now()}.pdf`;
    const filepath = path.join(REPORTS_DIR, filename);
    
    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(filepath);
    doc.pipe(writeStream);

    // Header
    doc.fontSize(24).font('Helvetica-Bold').text('FFDS Batch Quality Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).font('Helvetica').text(`Batch: ${batch.batchName}`, { align: 'center' });
    doc.text(`Food Type: ${batch.foodType}`, { align: 'center' });
    doc.text(`Date: ${new Date(batch.createdAt).toLocaleDateString()}`, { align: 'center' });
    doc.moveDown();

    // Quality Summary
    doc.fontSize(16).font('Helvetica-Bold').text('Quality Summary');
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica');
    doc.text(`Total Items Scanned: ${batch.totalItems}`);
    doc.text(`Fresh: ${batch.freshCount} (${Math.round(batch.freshCount / batch.totalItems * 100)}%)`);
    doc.text(`Borderline: ${batch.borderlineCount} (${Math.round(batch.borderlineCount / batch.totalItems * 100)}%)`);
    doc.text(`Spoiled: ${batch.spoiledCount} (${Math.round(batch.spoiledCount / batch.totalItems * 100)}%)`);
    doc.moveDown();
    doc.fontSize(14).font('Helvetica-Bold').text(`Quality Score: ${batch.qualityScore}/100`);
    doc.moveDown();

    // Sell/Hold Recommendation
    let recommendation = 'Hold / discount';
    if (batch.qualityScore >= 80) recommendation = 'Sell now';
    else if (batch.qualityScore >= 50) recommendation = 'Sell soon';
    doc.fontSize(14).font('Helvetica-Bold').text(`Recommendation: ${recommendation}`);
    doc.moveDown();

    // Estimated Value
    doc.fontSize(12).font('Helvetica').text(`Estimated Value: ${batch.currency} ${batch.estimatedValue.toFixed(2)}`);
    doc.moveDown(2);

    // QR Code
    doc.fontSize(14).font('Helvetica-Bold').text('Verification QR Code', { align: 'center' });
    doc.moveDown();
    const qrBuffer = await QRCode.toBuffer(verificationUrl);
    doc.image(qrBuffer, { fit: [150, 150], align: 'center' });
    doc.moveDown();
    doc.fontSize(10).font('Helvetica').text(`Scan to verify: ${verificationUrl}`, { align: 'center' });

    doc.end();

    await new Promise((resolve) => writeStream.on('finish', resolve));

    // Save URL to batch
    const reportUrl = `/uploads/reports/${filename}`;
    batch.buyerReportUrl = reportUrl;
    batch.buyerReportQR = qrDataUrl;
    await batch.save();

    return res.status(200).json({
      batchId: batch._id,
      reportUrl,
      qrCode: qrDataUrl,
      verificationUrl,
      recommendation: recommendation,
    });
  } catch (err) {
    next(err);
  }
}

async function chat(req, res, next) {
  try {
    const { question, language } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question required' });
    }

    const farmId = req.user.farmId;
    // Get recent batches for context
    const batches = await Batch.find({ farmerId: farmId })
      .sort({ createdAt: -1 })
      .limit(10);

    const batchSummary = batches.map(b => ({
      name: b.batchName,
      food: b.foodType,
      quality: b.qualityScore,
      items: b.totalItems,
    }));

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const langInstruction = language === 'si' 
      ? 'Respond entirely in Sinhala (සිංහල).' 
      : language === 'ta' 
        ? 'Respond entirely in Tamil (தமிழ்).' 
        : 'Respond in English.';

    const prompt = `You are an agricultural advisor for a farmer.
Recent Harvest Batches:
${JSON.stringify(batchSummary)}

${langInstruction}

Question: ${question}

Provide concise, practical advice focused on post-harvest handling, storage temperatures, transport logistics, and sell/hold decisions.`;

    let reply;
    try {
      const result = await geminiModel.generateContent(prompt);
      reply = result.response.text();
    } catch (apiErr) {
      console.warn('Gemini API call failed in farmer chat:', apiErr?.message || apiErr);
      reply = `[AI Farm Advisor Offline] Responding in offline advisory mode.

Key recommendations for your harvest:
1. **Temperature Control**: Store harvested produce in shaded, ventilated storage at optimal humidity.
2. **Sorting & Grading**: Separate prime fresh stock from borderline items to prevent rot spreading.
3. **Transport Prep**: Ensure transport containers are sanitized and properly stacked.`;
    }

    return res.status(200).json({ reply });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboard,
  batchScan,
  listBatches,
  getBatch,
  getCalendar,
  logLoss,
  getLossHistory,
  generateBuyerReport,
  chat,
};