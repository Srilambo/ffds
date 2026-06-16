const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema(
  {
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    batchName: { type: String, required: true },
    foodType: { type: String, required: true },
    totalItems: { type: Number, required: true, default: 0 },
    freshCount: { type: Number, required: true, default: 0 },
    borderlineCount: { type: Number, required: true, default: 0 },
    spoiledCount: { type: Number, required: true, default: 0 },
    qualityScore: { type: Number, required: true, default: 100 },
    estimatedValue: { type: Number, required: true, default: 0 },
    currency: { type: String, default: 'USD' },
    buyerReportUrl: { type: String, default: '' },
    buyerReportQR: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'batches' }
);

module.exports = mongoose.model('Batch', batchSchema);
