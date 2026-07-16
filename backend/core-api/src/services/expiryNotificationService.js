const InventoryItem = require('../models/InventoryItem');
const Notification = require('../models/Notification');
const User = require('../models/User');

function daysUntilExpiry(expiryDate) {
  const diff = new Date(expiryDate) - new Date();
  return Math.ceil(diff / 86400000);
}

function buildExpiryMessage(foodName, days) {
  if (days <= 0) return `${foodName} has expired — remove it from your pantry.`;
  if (days === 1) return `${foodName} expires tomorrow.`;
  return `${foodName} expires in ${days} days.`;
}

async function syncExpiryNotificationsForUser(userId) {
  const user = await User.findById(userId);
  if (!user) return;

  const prefs = user.notificationPrefs || {};
  if (prefs.expiryReminders === false) return;

  const reminderDays = prefs.reminderDays ?? 2;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + reminderDays);
  cutoff.setHours(23, 59, 59, 999);

  const expiringItems = await InventoryItem.find({
    $or: [{ userId }, { ownerId: userId }],
    status: 'active',
    expiryDate: { $lte: cutoff },
  }).sort({ expiryDate: 1 });

  const expiringIds = expiringItems.map((i) => i._id.toString());

  // Remove stale expiry alerts for items no longer expiring
  await Notification.deleteMany({
    userId,
    type: 'expiry',
    inventoryItemId: { $nin: expiringItems.map((i) => i._id) },
    isRead: false,
  });

  for (const item of expiringItems) {
    const days = daysUntilExpiry(item.expiryDate);
    const severity = days <= 0 ? 'danger' : days === 1 ? 'warning' : 'warning';
    const title = days <= 0 ? 'Expired' : 'Expiring Soon';
    const message = buildExpiryMessage(item.foodName, days);

    await Notification.findOneAndUpdate(
      { userId, inventoryItemId: item._id, type: 'expiry' },
      {
        $set: {
          title,
          message,
          severity,
          isRead: false,
        },
        $setOnInsert: {
          userId,
          inventoryItemId: item._id,
          type: 'expiry',
          createdAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );
  }

  return { synced: expiringIds.length };
}

async function syncAllUsersExpiryNotifications() {
  const users = await User.find({ isActive: true }).select('_id');
  let total = 0;
  for (const user of users) {
    const result = await syncExpiryNotificationsForUser(user._id);
    total += result?.synced || 0;
  }
  return total;
}

module.exports = {
  syncExpiryNotificationsForUser,
  syncAllUsersExpiryNotifications,
  daysUntilExpiry,
  buildExpiryMessage,
};
