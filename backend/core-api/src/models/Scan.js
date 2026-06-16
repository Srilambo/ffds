const mongoose = require('mongoose');

const gasReadingsSchema = new mongoose.Schema(
  {
    nh3: { type: Number, required: true },
    h2s: { type: Number, required: true },
    ethylene: { type: Number, required: true },
  },
  { _id: false }
);

const scanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    businessId: { type: mongoose.Schema.Types.ObjectId, default: null },
    farmId: { type: mongoose.Schema.Types.ObjectId, default: null },
    batchId: { type: mongoose.Schema.Types.ObjectId, default: null },
    imageUrl: { type: String, required: true },
    foodType: { type: String, required: true },
    label: { type: String, enum: ['Fresh', 'Borderline', 'Spoiled'], required: true },
    confidence: { type: Number, required: true, min: 0, max: 100 },
    gasReadings: { type: gasReadingsSchema, required: true },
    chatbotExplanation: { type: String, required: true },
    chatbotResponse: { type: String }, // for new spec compatibility
    language: { type: String, enum: ['en', 'si', 'ta', 'ar', 'fr', 'ja'], default: 'en' },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'scans' }
);

module.exports = mongoose.model('Scan', scanSchema);
