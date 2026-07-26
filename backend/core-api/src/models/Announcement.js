const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  targetRole: {
    type: String,
    enum: ['all', 'consumer', 'manager', 'admin'],
    default: 'all',
  },
  priority: {
    type: String,
    enum: ['info', 'warning', 'alert'],
    default: 'info',
  },
  createdByName: {
    type: String,
    default: 'System Admin',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Announcement', announcementSchema);
