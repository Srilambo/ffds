const mongoose = require('mongoose');

const wasteLogSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ownerType: { type: String, enum: ['business', 'farm', 'consumer'], required: true },
    foodName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    estimatedCost: { type: Number, required: true, default: 0 },
    currency: { type: String, default: 'USD' },
    reason: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'wasteLogs' }
);

module.exports = mongoose.model('WasteLog', wasteLogSchema);
