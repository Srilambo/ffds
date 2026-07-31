const InventoryItem = require('../models/InventoryItem');
const { syncExpiryNotificationsForUser } = require('../services/expiryNotificationService');

function getListFilter(user) {
  if (user.role === 'manager') {
    const mId = user.businessId || user.teamId;
    return {
      $or: [
        { ownerId: mId, ownerType: 'business' },
        { teamId: mId }
      ]
    };
  }
  if (user.role === 'farmer') {
    return { ownerId: user.farmId, ownerType: 'farm' };
  }
  return {
    $or: [
      { ownerId: user._id, ownerType: 'consumer' },
      { userId: user._id }
    ]
  };
}

function canAccessItem(user, item) {
  if (user.role === 'manager') {
    const mId = user.businessId?.toString() || user.teamId?.toString();
    return (item.ownerType === 'business' && item.ownerId?.toString() === mId) || (item.teamId?.toString() === mId);
  }
  if (user.role === 'farmer') {
    return item.ownerType === 'farm' && item.ownerId?.toString() === user.farmId?.toString();
  }
  return (item.ownerType === 'consumer' && item.ownerId?.toString() === user._id.toString()) || (item.userId?.toString() === user._id.toString());
}

async function list(req, res, next) {
  try {
    const filter = getListFilter(req.user);
    if (req.query.category) filter.category = req.query.category;
    if (req.query.status) filter.status = req.query.status;

    const items = await InventoryItem.find(filter).sort({ expiryDate: 1 });
    return res.status(200).json(items);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    let {
      foodName,
      category,
      quantity,
      unit,
      purchaseDate,
      expiryDate,
      status,
      linkedScanId,
      location,
    } = req.body;

    if (!foodName || !category || quantity == null || !unit) {
      return res.status(400).json({ error: 'Missing required fields: foodName, category, quantity, unit' });
    }

    const finalPurchaseDate = purchaseDate ? new Date(purchaseDate) : new Date();
    const finalExpiryDate = expiryDate ? new Date(expiryDate) : new Date(Date.now() + 7 * 86400000);

    let ownerType = 'consumer';
    let ownerId = req.user._id;

    if (req.user.role === 'manager') {
      ownerType = 'business';
      ownerId = req.user.businessId || req.user.teamId;
    } else if (req.user.role === 'farmer') {
      ownerType = 'farm';
      ownerId = req.user.farmId;
    }

    const item = await InventoryItem.create({
      foodName,
      category,
      quantity,
      unit,
      location: location || 'fridge',
      purchaseDate: finalPurchaseDate,
      expiryDate: finalExpiryDate,
      status: status || 'active',
      linkedScanId: linkedScanId || null,
      userId: req.user._id,
      teamId: req.user.teamId || null,
      ownerId,
      ownerType,
    });

    await syncExpiryNotificationsForUser(req.user._id);

    return res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    if (!canAccessItem(req.user, item)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { quantity, unit, expiryDate, status } = req.body;
    if (quantity != null) item.quantity = quantity;
    if (unit != null) item.unit = unit;
    if (expiryDate != null) item.expiryDate = expiryDate;
    if (status != null) item.status = status;

    await item.save();
    await syncExpiryNotificationsForUser(req.user._id);
    return res.status(200).json(item);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    if (!canAccessItem(req.user, item)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await InventoryItem.deleteOne({ _id: item._id });
    return res.status(200).json({ message: 'Item deleted' });
  } catch (err) {
    next(err);
  }
}

async function expiring(req, res, next) {
  try {
    // Admins manage the platform, not personal/business inventory
    if (req.user.role === 'admin') {
      return res.status(200).json([]);
    }

    const filter = getListFilter(req.user);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + 2);
    cutoff.setHours(23, 59, 59, 999);

    const items = await InventoryItem.find({
      ...filter,
      status: 'active',
      expiryDate: { $lte: cutoff },
    }).sort({ expiryDate: 1 });

    return res.status(200).json(items);
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update, remove, expiring };
