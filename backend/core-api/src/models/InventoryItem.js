const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // legacy / fallback
    teamId: { type: mongoose.Schema.Types.ObjectId, default: null }, // legacy / fallback
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ownerType: { type: String, enum: ['business', 'farm', 'consumer'], required: true },
    foodName: { type: String, required: true },
    category: {
      type: String,
      enum: ['fruit', 'vegetable', 'dairy', 'bakery', 'other', 'meat', 'bread'],
      required: true,
    },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    purchaseDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['active', 'consumed', 'wasted', 'fresh', 'expiring', 'spoiled'],
      default: 'active',
    },
    location: {
      type: String,
      enum: ['fridge', 'pantry', 'warehouse'],
      default: 'pantry',
    },
    linkedScanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Scan', default: null },
  },
  { collection: 'inventoryItems', timestamps: true }
);

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
