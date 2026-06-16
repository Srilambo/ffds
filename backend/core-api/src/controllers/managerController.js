const Scan = require('../models/Scan');
const InventoryItem = require('../models/InventoryItem');

async function dashboard(req, res, next) {
  try {
    const teamId = req.user.teamId;
    if (!teamId) {
      return res.status(400).json({ error: 'Manager has no team assigned' });
    }

    const teamUsers = await require('../models/User').find({ teamId });
    const userIds = teamUsers.map((u) => u._id);

    const scans = await Scan.find({ userId: { $in: userIds } }).sort({ createdAt: -1 });
    const inventoryItems = await InventoryItem.find({ teamId });

    const scansByLabel = { Fresh: 0, Borderline: 0, Spoiled: 0 };
    scans.forEach((s) => {
      if (scansByLabel[s.label] !== undefined) scansByLabel[s.label]++;
    });

    const wastedItems = inventoryItems.filter((i) => i.status === 'wasted').length;
    const totalInventoryItems = inventoryItems.length;
    const wasteRate =
      totalInventoryItems > 0
        ? `${((wastedItems / totalInventoryItems) * 100).toFixed(1)}%`
        : '0.0%';

    const recentScans = scans.slice(0, 10).map((s) => ({
      _id: s._id,
      foodType: s.foodType,
      label: s.label,
      confidence: s.confidence,
      createdAt: s.createdAt,
    }));

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + 2);
    cutoff.setHours(23, 59, 59, 999);

    const expiringItems = inventoryItems.filter(
      (i) => i.status === 'active' && i.expiryDate <= cutoff
    );

    return res.status(200).json({
      totalScans: scans.length,
      scansByLabel,
      totalInventoryItems,
      wastedItems,
      wasteRate,
      recentScans,
      expiringItems,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { dashboard };
