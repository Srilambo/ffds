const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['consumer', 'manager', 'farmer', 'admin', 'driver'], required: true },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    teamId: { type: mongoose.Schema.Types.ObjectId, default: null }, // kept for backward compatibility
    businessId: { type: mongoose.Schema.Types.ObjectId, default: null },
    farmId: { type: mongoose.Schema.Types.ObjectId, default: null },
    familyId: { type: mongoose.Schema.Types.ObjectId, default: null },
    vehicleType: { type: String, default: 'Bicycle' }, // Bicycle, Scooter, Motorcycle, Van
    licensePlate: { type: String, default: '' },
    driverStatus: { type: String, enum: ['available', 'delivering', 'offline'], default: 'available' },
    language: { type: String, enum: ['en', 'si', 'ta', 'ar', 'fr', 'ja'], default: 'en' },
    notificationPrefs: {
      expiryReminders: { type: Boolean, default: true },
      pushEnabled: { type: Boolean, default: true },
      reminderDays: { type: Number, default: 2, min: 1, max: 14 },
    },
    phone: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    address: { type: String, default: '' },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [lng, lat]
        default: [79.8612, 6.9271],
      },
    },
    cardDetails: {
      cardHolderName: { type: String, default: '' },
      cardNumberMasked: { type: String, default: '' },
      expiryDate: { type: String, default: '' },
    },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'users' }
);

module.exports = mongoose.model('User', userSchema);
