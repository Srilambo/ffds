const User = require('../models/User');
const Scan = require('../models/Scan');
const InventoryItem = require('../models/InventoryItem');

// List all users
async function listUsers(req, res, next) {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    return res.status(200).json(users);
  } catch (err) {
    next(err);
  }
}

// Update user role
async function updateUserRole(req, res, next) {
  try {
    const { role } = req.body;
    const { id } = req.params;

    if (!['consumer', 'manager', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    if (id === req.user._id.toString() && role !== 'admin') {
      return res.status(400).json({ error: 'Cannot demote yourself from admin role' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.role = role;
    await user.save();

    return res.status(200).json({
      message: 'User role updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        language: user.language,
        teamId: user.teamId,
      },
    });
  } catch (err) {
    next(err);
  }
}

// Delete user and clean up their documents
async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;

    if (id === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot delete your own admin account' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Perform cleanup of related documents
    await Scan.deleteMany({ userId: id });
    await InventoryItem.deleteMany({ userId: id });
    await User.deleteOne({ _id: id });

    return res.status(200).json({ message: 'User and associated data deleted successfully' });
  } catch (err) {
    next(err);
  }
}

// List all scans in the system
async function listScans(req, res, next) {
  try {
    const scans = await Scan.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    return res.status(200).json(scans);
  } catch (err) {
    next(err);
  }
}

// Get system-wide metrics and database details
async function getSystemMetrics(req, res, next) {
  try {
    const [usersCount, scansCount, inventoryCount, scans, items] = await Promise.all([
      User.countDocuments(),
      Scan.countDocuments(),
      InventoryItem.countDocuments(),
      Scan.find({}, 'label'),
      InventoryItem.find({}, 'status'),
    ]);

    const usersByRole = { consumer: 0, manager: 0, admin: 0 };
    const allUsers = await User.find({}, 'role');
    allUsers.forEach((u) => {
      if (usersByRole[u.role] !== undefined) usersByRole[u.role]++;
    });

    const scansByLabel = { Fresh: 0, Borderline: 0, Spoiled: 0 };
    scans.forEach((s) => {
      if (scansByLabel[s.label] !== undefined) scansByLabel[s.label]++;
    });

    const inventoryByStatus = { active: 0, consumed: 0, wasted: 0 };
    items.forEach((i) => {
      if (inventoryByStatus[i.status] !== undefined) inventoryByStatus[i.status]++;
    });

    // Simple backend health indicators
    const health = {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      dbConnected: true,
      platform: process.platform,
      nodeVersion: process.version,
    };

    return res.status(200).json({
      totalUsers: usersCount,
      totalScans: scansCount,
      totalInventory: inventoryCount,
      usersByRole,
      scansByLabel,
      inventoryByStatus,
      health,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listUsers,
  updateUserRole,
  deleteUser,
  listScans,
  getSystemMetrics,
};
