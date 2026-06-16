const InventoryItem = require('../models/InventoryItem');

function getListFilter(user) {
  if (user.role === 'manager' && user.teamId) {
    return { teamId: user.teamId };
  }
  return { userId: user._id };
}

function canAccessItem(user, item) {
  if (user.role === 'manager' && user.teamId && item.teamId?.toString() === user.teamId) {
    return true;
  }
  return item.userId.toString() === user._id;
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
    const {
      foodName,
      category,
      quantity,
      unit,
      purchaseDate,
      expiryDate,
      status,
      linkedScanId,
    } = req.body;

    if (!foodName || !category || quantity == null || !unit || !purchaseDate || !expiryDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const item = await InventoryItem.create({
      foodName,
      category,
      quantity,
      unit,
      purchaseDate,
      expiryDate,
      status: status || 'active',
      linkedScanId: linkedScanId || null,
      userId: req.user._id,
      teamId: req.user.teamId || null,
    });

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
