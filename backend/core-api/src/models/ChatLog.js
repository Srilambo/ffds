const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const chatLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    scanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Scan', default: null },
    language: { type: String, enum: ['en', 'si'], default: 'en' },
    messages: [messageSchema],
  },
  { collection: 'chatLogs' }
);

module.exports = mongoose.model('ChatLog', chatLogSchema);
