const fs = require('fs');
const path = require('path');
const Scan = require('../models/Scan');
const cnnClient = require('../services/cnnClient');
const { generateGasReadings } = require('../services/gasSim');
const geminiClient = require('../services/geminiClient');

const UPLOAD_DIR = path.join(__dirname, '../../uploads');

function saveImage(buffer, mimetype) {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
  const ext = mimetype === 'image/png' ? '.png' : '.jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);
  fs.writeFileSync(filepath, buffer);
  return `/uploads/${filename}`;
}

async function createScan(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file required' });
    }

    const { buffer, mimetype } = req.file;
    const cnnResult = await cnnClient.classifyImage(buffer, mimetype);
    const gasReadings = generateGasReadings(cnnResult.label, cnnResult.confidence);
    const imageUrl = saveImage(buffer, mimetype);

    const explanation = await geminiClient.explainScan({
      ...cnnResult,
      gasReadings,
      language: req.user.language,
      role: req.user.role,
      imageBuffer: buffer,
    });

    const scan = await Scan.create({
      userId: req.user._id,
      imageUrl,
      foodType: cnnResult.foodType,
      label: cnnResult.label,
      confidence: cnnResult.confidence,
      gasReadings,
      chatbotExplanation: explanation,
    });

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
    if (scan.userId.toString() !== req.user._id) {
      return res.status(404).json({ error: 'Scan not found' });
    }
    return res.status(200).json(scan);
  } catch (err) {
    next(err);
  }
}

module.exports = { createScan, listScans, getScan };
