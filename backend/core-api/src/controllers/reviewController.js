const mongoose = require('mongoose');
const Review   = require('../models/Review');
const Shop     = require('../models/Shop');
const Order    = require('../models/Order');
const User     = require('../models/User');

// ─── Consumer: Create or Update Review ────────────────────────
async function createReview(req, res, next) {
  try {
    const consumerId = req.user._id;
    const { orderId, shopId: reqShopId, driverId: reqDriverId, riderRating, storeRating, freshnessRating, comment } = req.body;

    let order = null;
    if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
      order = await Order.findById(orderId).populate('shopId').populate('driverId');
    }

    let targetShopId = reqShopId || order?.shopId?._id || order?.shopId;
    let targetDriverId = reqDriverId || order?.driverId?._id || order?.driverId;
    let targetShopName = order?.shopId?.shopName || 'Store';
    let targetDriverName = req.body.driverName || req.body.riderName || order?.driverId?.name || '';

    // 1. If driver ID is valid, look up driver profile to get name
    if (targetDriverId && mongoose.Types.ObjectId.isValid(targetDriverId)) {
      const drv = await User.findById(targetDriverId);
      if (drv) {
        targetDriverName = drv.name;
        targetDriverId = drv._id;
      }
    }

    // 2. If driver ID is missing or invalid, match driver by name
    if (!targetDriverId && targetDriverName) {
      const cleanName = targetDriverName.replace(/\(#\d+\)/g, '').trim();
      const drv = await User.findOne({
        name: { $regex: new RegExp(cleanName, 'i') },
        role: 'driver',
      });
      if (drv) {
        targetDriverId = drv._id;
        targetDriverName = drv.name;
      }
    }

    if (!targetShopId) {
      const defaultShop = await Shop.findOne({ shopName: /Tellippalai/i }) || await Shop.findOne({});
      if (defaultShop) {
        targetShopId = defaultShop._id;
        targetShopName = defaultShop.shopName;
      }
    }

    const rRating = Math.min(5, Math.max(1, Number(riderRating) || 5));
    const sRating = Math.min(5, Math.max(1, Number(storeRating) || 5));
    const fRating = Math.min(5, Math.max(1, Number(freshnessRating) || 5));

    const finalOrderId = (orderId && mongoose.Types.ObjectId.isValid(orderId)) ? orderId : new mongoose.Types.ObjectId();

    const review = await Review.create({
      orderId: finalOrderId,
      consumerId,
      shopId: targetShopId,
      driverId: targetDriverId,
      consumerName: req.user.name || 'Customer',
      shopName: targetShopName,
      driverName: targetDriverName || 'Store Rider',
      riderRating: rRating,
      storeRating: sRating,
      freshnessRating: fRating,
      comment: comment || 'Great delivery service and super fresh produce!',
    });

    // Recalculate and update shop average rating
    if (targetShopId) {
      const allShopReviews = await Review.find({ shopId: targetShopId });
      if (allShopReviews.length > 0) {
        const avgRating = (allShopReviews.reduce((sum, r) => sum + r.storeRating, 0) / allShopReviews.length).toFixed(1);
        await Shop.findByIdAndUpdate(targetShopId, { rating: parseFloat(avgRating) });
      }
    }

    return res.status(201).json({ message: 'Review saved successfully', review });
  } catch (err) {
    next(err);
  }
}

// ─── Manager: Get all reviews for manager's shop ─────────────
async function getManagerShopReviews(req, res, next) {
  try {
    const managerId = req.user._id;
    const shops = await Shop.find({ managerId });
    const shopIds = shops.map((s) => s._id);

    const reviews = await Review.find({ shopId: { $in: shopIds } })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('consumerId', 'name email')
      .populate('driverId', 'name phone vehicleType');

    return res.status(200).json(reviews);
  } catch (err) {
    next(err);
  }
}

// ─── Driver: Get reviews for driver's deliveries ─────────────
async function getDriverReviews(req, res, next) {
  try {
    const driverId = req.user._id;
    const driverObjId = mongoose.Types.ObjectId.isValid(driverId) ? new mongoose.Types.ObjectId(driverId) : driverId;

    const reviews = await Review.find({
      $or: [
        { driverId: driverId },
        { driverId: driverObjId },
        { driverName: { $regex: new RegExp(req.user.name.trim(), 'i') } },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('consumerId', 'name email');

    const totalReviews = reviews.length;
    const avgRiderRating = totalReviews > 0
      ? (reviews.reduce((sum, r) => sum + r.riderRating, 0) / totalReviews).toFixed(1)
      : '5.0';

    return res.status(200).json({
      avgRating: parseFloat(avgRiderRating),
      totalReviews,
      reviews,
    });
  } catch (err) {
    next(err);
  }
}

// ─── Consumer: Get consumer's own reviews ─────────────────────
async function getMyReviews(req, res, next) {
  try {
    const reviews = await Review.find({ consumerId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    return res.status(200).json(reviews);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createReview,
  getManagerShopReviews,
  getDriverReviews,
  getMyReviews,
};
