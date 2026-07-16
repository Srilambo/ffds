const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['consumer', 'manager', 'farmer', 'admin'], required: true },
    teamId: { type: mongoose.Schema.Types.ObjectId, default: null }, // kept for backward compatibility
    businessId: { type: mongoose.Schema.Types.ObjectId, default: null },
    farmId: { type: mongoose.Schema.Types.ObjectId, default: null },
    familyId: { type: mongoose.Schema.Types.ObjectId, default: null },
    language: { type: String, enum: ['en', 'si', 'ta', 'ar', 'fr', 'ja'], default: 'en' },
    notificationPrefs: {
      expiryReminders: { type: Boolean, default: true },
      pushEnabled: { type: Boolean, default: true },
      reminderDays: { type: Number, default: 2, min: 1, max: 14 },
    },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'users' }
);

module.exports = mongoose.model('User', userSchema);
