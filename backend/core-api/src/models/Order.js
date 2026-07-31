const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  qty: { type: String, default: '1 unit' },
  category: { type: String, default: 'Produce' },
  price: { type: Number, default: 0 },
  emoji: { type: String, default: '🛒' },
});

const orderSchema = new mongoose.Schema(
  {
    consumerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    shopId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    managerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    driverId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    items: [orderItemSchema],
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'assigned', 'out_for_delivery', 'delivered', 'rejected'],
      default: 'pending',
    },
    paymentMethod: { type: String, enum: ['cash', 'card'], default: 'cash' },
    totalAmount: { type: Number, default: 0 },
    estimatedDelivery: { type: String, default: '10–15 min' },
    consumerNote: { type: String, default: '' },
    rejectionReason: { type: String, default: '' },
    // Snapshot of consumer address at order time
    deliveryAddress: { type: String, default: '' },
    deliveryLocation: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
    },
    deliveryOtp: { type: String, default: null },
    assignedAt: { type: Date, default: null },
    outForDeliveryAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
  },
  { collection: 'orders', timestamps: true }
);

// Index for quick lookups
orderSchema.index({ consumerId: 1, createdAt: -1 });
orderSchema.index({ shopId: 1, createdAt: -1 });
orderSchema.index({ managerId: 1, status: 1 });
orderSchema.index({ driverId: 1, status: 1 });

module.exports = mongoose.model('Order', orderSchema);
