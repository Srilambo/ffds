const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    inventoryItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', default: null },
    type: { type: String, enum: ['expiry', 'lowstock', 'system'], required: true },
    title: { type: String, default: '' },
    message: { type: String, required: true },
    severity: { type: String, enum: ['info', 'warning', 'danger'], default: 'warning' },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'notifications' }
);

module.exports = mongoose.model('Notification', notificationSchema);
