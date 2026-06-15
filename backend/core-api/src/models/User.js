const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['consumer', 'manager'], required: true },
    teamId: { type: mongoose.Schema.Types.ObjectId, default: null },
    language: { type: String, enum: ['en', 'si'], default: 'en' },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'users' }
);

module.exports = mongoose.model('User', userSchema);
