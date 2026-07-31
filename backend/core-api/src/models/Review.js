const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    consumerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    consumerName: { type: String, default: 'Customer' },
    shopName: { type: String, default: '' },
    driverName: { type: String, default: '' },
    riderRating: { type: Number, min: 1, max: 5, default: 5 },
    storeRating: { type: Number, min: 1, max: 5, default: 5 },
    freshnessRating: { type: Number, min: 1, max: 5, default: 5 },
    comment: { type: String, default: '' },
  },
  { collection: 'reviews', timestamps: true }
);

module.exports = mongoose.model('Review', reviewSchema);
