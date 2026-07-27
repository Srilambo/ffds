const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema(
  {
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    shopName: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    phone: { type: String, default: '' },
    category: { type: String, enum: ['grocery', 'produce', 'supermarket', 'convenience', 'organic', 'other'], default: 'grocery' },
    hours: { type: String, default: '8am – 9pm' },
    isVerified: { type: Boolean, default: false },
    isOpen: { type: Boolean, default: true },
    // GeoJSON Point for geospatial queries
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
        default: [0, 0],
      },
    },
    // Products/inventory this shop stocks (denormalized summary for quick matching)
    stockSummary: [
      {
        name: String,
        category: String,
        inStock: { type: Boolean, default: true },
        price: { type: Number, default: 0 },
      },
    ],
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalOrders: { type: Number, default: 0 },
  },
  { collection: 'shops', timestamps: true }
);

// 2dsphere index for $near / $geoWithin queries
shopSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Shop', shopSchema);
