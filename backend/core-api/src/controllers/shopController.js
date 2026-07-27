const Shop = require('../models/Shop');
const User = require('../models/User');

// ─── Manager: create or update own shop profile ───────────────
async function upsertShop(req, res, next) {
  try {
    const managerId = req.user._id;
    const { shopName, address, phone, category, hours, isOpen, location, stockSummary } = req.body;

    if (!shopName || !address) {
      return res.status(400).json({ error: 'shopName and address are required' });
    }

    // Validate location
    const loc = location || { coordinates: [0, 0] };
    if (!loc.coordinates || loc.coordinates.length !== 2) {
      return res.status(400).json({ error: 'location.coordinates must be [lng, lat]' });
    }

    const update = {
      shopName,
      address,
      phone: phone || '',
      category: category || 'grocery',
      hours: hours || '8am – 9pm',
      isOpen: isOpen !== undefined ? isOpen : true,
      location: { type: 'Point', coordinates: loc.coordinates },
      stockSummary: stockSummary || [],
    };

    const shop = await Shop.findOneAndUpdate(
      { managerId },
      { $set: update },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ message: 'Shop profile saved', shop });
  } catch (err) {
    next(err);
  }
}

// ─── Manager: get own shop ────────────────────────────────────
async function getMyShop(req, res, next) {
  try {
    const shop = await Shop.findOne({ managerId: req.user._id });
    if (!shop) return res.status(404).json({ error: 'No shop profile found. Please create one.' });
    return res.status(200).json(shop);
  } catch (err) {
    next(err);
  }
}

// ─── Consumer: nearby shops ───────────────────────────────────
async function getNearbyShops(req, res, next) {
  try {
    const { lat, lng, radius = 10000 } = req.query; // radius in metres, default 10 km
    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng query params required' });
    }

    const shops = await Shop.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseFloat(radius),
        },
      },
      isOpen: true,
    }).limit(30);

    // Enrich with manager name
    const managerIds = [...new Set(shops.map((s) => s.managerId.toString()))];
    const managers = await User.find({ _id: { $in: managerIds } }).select('name email');
    const managerMap = {};
    managers.forEach((m) => { managerMap[m._id.toString()] = m; });

    const result = shops.map((s) => ({
      ...s.toObject(),
      managerName: managerMap[s.managerId.toString()]?.name || 'Manager',
    }));

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

// ─── Admin: all shops ─────────────────────────────────────────
async function getAllShops(req, res, next) {
  try {
    const { search, category, verified } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (verified !== undefined) filter.isVerified = verified === 'true';
    if (search) {
      filter.$or = [
        { shopName: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
      ];
    }

    const shops = await Shop.find(filter).sort({ createdAt: -1 });

    const managerIds = [...new Set(shops.map((s) => s.managerId.toString()))];
    const managers = await User.find({ _id: { $in: managerIds } }).select('name email');
    const managerMap = {};
    managers.forEach((m) => { managerMap[m._id.toString()] = m; });

    const result = shops.map((s) => ({
      ...s.toObject(),
      managerName: managerMap[s.managerId.toString()]?.name || 'Unknown',
      managerEmail: managerMap[s.managerId.toString()]?.email || '',
    }));

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

// ─── Admin: toggle verified ───────────────────────────────────
async function toggleVerified(req, res, next) {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    shop.isVerified = !shop.isVerified;
    await shop.save();
    return res.status(200).json({ message: `Shop ${shop.isVerified ? 'verified' : 'unverified'}`, shop });
  } catch (err) {
    next(err);
  }
}

// ─── Admin: delete shop ───────────────────────────────────────
async function deleteShop(req, res, next) {
  try {
    await Shop.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: 'Shop deleted' });
  } catch (err) {
    next(err);
  }
}

// ─── Public: get single shop by id ───────────────────────────
async function getShopById(req, res, next) {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    const manager = await User.findById(shop.managerId).select('name email');
    return res.status(200).json({ ...shop.toObject(), managerName: manager?.name || 'Manager' });
  } catch (err) {
    next(err);
  }
}

module.exports = { upsertShop, getMyShop, getNearbyShops, getAllShops, toggleVerified, deleteShop, getShopById };
