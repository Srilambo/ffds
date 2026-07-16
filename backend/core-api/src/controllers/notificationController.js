const Notification = require('../models/Notification');
const User = require('../models/User');
const { syncExpiryNotificationsForUser } = require('../services/expiryNotificationService');

async function list(req, res, next) {
  try {
    await syncExpiryNotificationsForUser(req.user._id);

    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ isRead: 1, createdAt: -1 })
      .limit(50);

    return res.status(200).json(notifications);
  } catch (err) {
    next(err);
  }
}

async function unreadCount(req, res, next) {
  try {
    await syncExpiryNotificationsForUser(req.user._id);

    const count = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false,
    });

    return res.status(200).json({ count });
  } catch (err) {
    next(err);
  }
}

async function markRead(req, res, next) {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification || notification.userId.toString() !== req.user._id) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();
    return res.status(200).json(notification);
  } catch (err) {
    next(err);
  }
}

async function markAllRead(req, res, next) {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );
    return res.status(200).json({ message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
}

async function getPreferences(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select('notificationPrefs');
    return res.status(200).json(user?.notificationPrefs || {
      expiryReminders: true,
      pushEnabled: true,
      reminderDays: 2,
    });
  } catch (err) {
    next(err);
  }
}

async function updatePreferences(req, res, next) {
  try {
    const { expiryReminders, pushEnabled, reminderDays } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.notificationPrefs) {
      user.notificationPrefs = { expiryReminders: true, pushEnabled: true, reminderDays: 2 };
    }
    if (expiryReminders != null) user.notificationPrefs.expiryReminders = !!expiryReminders;
    if (pushEnabled != null) user.notificationPrefs.pushEnabled = !!pushEnabled;
    if (reminderDays != null) {
      user.notificationPrefs.reminderDays = Math.min(14, Math.max(1, Number(reminderDays)));
    }

    await user.save();
    await syncExpiryNotificationsForUser(user._id);

    return res.status(200).json(user.notificationPrefs);
  } catch (err) {
    next(err);
  }
}

async function sync(req, res, next) {
  try {
    const result = await syncExpiryNotificationsForUser(req.user._id);
    return res.status(200).json({ message: 'Notifications synced', ...result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  unreadCount,
  markRead,
  markAllRead,
  getPreferences,
  updatePreferences,
  sync,
};
