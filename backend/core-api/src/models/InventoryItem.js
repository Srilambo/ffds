const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    teamId: { type: mongoose.Schema.Types.ObjectId, default: null },
    foodName: { type: String, required: true },
    category: {
      type: String,
      enum: ['fruit', 'vegetable', 'dairy', 'bakery', 'other'],
      required: true,
    },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    purchaseDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['active', 'consumed', 'wasted'],
      default: 'active',
    },
    linkedScanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Scan', default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'inventoryItems' }
);

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
