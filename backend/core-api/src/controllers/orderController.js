const mongoose = require('mongoose');
const Order = require('../models/Order');
const Shop  = require('../models/Shop');
const User  = require('../models/User');
const Notification = require('../models/Notification');

// Helper: get io from app (attached in server.js)
function getIO(req) {
  return req.app.get('io');
}

// Helper: create in-app notification
async function createNotification(userId, title, message, type = 'order', severity = 'info') {
  try {
    await Notification.create({ userId, title, message, type, severity });
  } catch (e) {
    console.warn('Notification create failed:', e.message);
  }
}

// ─── Consumer: place order ────────────────────────────────────
async function placeOrder(req, res, next) {
  try {
    const consumerId = req.user._id;
    const { shopId, shopName, items, paymentMethod, consumerNote, deliveryAddress, deliveryLocation } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: 'Order items are required' });
    }

    let shop = null;
    if (shopId && mongoose.Types.ObjectId.isValid(shopId)) {
      shop = await Shop.findById(shopId);
    }
    if (!shop && shopName) {
      shop = await Shop.findOne({ shopName: { $regex: new RegExp(shopName.trim(), 'i') } });
    }
    if (!shop) {
      // Prefer Manager Main's store (Tellippalai Fresh Supermarket) for demo continuity
      shop = await Shop.findOne({ shopName: /Tellippalai/i }) || await Shop.findOne({});
    }

    if (!shop) {
      return res.status(404).json({ error: 'No active store found to process this order' });
    }

    const totalAmount = items.reduce((sum, i) => sum + (parseFloat(i.price) || 0), 0);
    const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

    const order = await Order.create({
      consumerId,
      shopId: shop._id,
      managerId: shop.managerId,
      driverId: null, // Unassigned until Manager assigns a rider
      items,
      paymentMethod: paymentMethod || 'cash',
      totalAmount,
      deliveryOtp,
      consumerNote: consumerNote || '',
      deliveryAddress: deliveryAddress || shop.address || 'Delivery Pinpoint Location',
      deliveryLocation: deliveryLocation || { lat: 0, lng: 0 },
      status: 'pending',
    });

    // Increment shop order count
    await Shop.findByIdAndUpdate(shop._id, { $inc: { totalOrders: 1 } });

    // Notify manager via Socket.io
    const io = getIO(req);
    if (io) {
      const consumer = await User.findById(consumerId).select('name');
      const payload = {
        orderId: order._id,
        shopId: shop._id,
        shopName: shop.shopName,
        totalAmount: order.totalAmount,
        consumerName: consumer?.name || 'Customer',
        itemsCount: items.length,
        status: 'pending',
        createdAt: order.createdAt,
      };

      io.to(`shop:${shop._id}`).emit('new_order', payload);
      io.to(`manager:${shop.managerId}`).emit('new_order', payload);
      io.emit('new_order', payload);
    }

    // In-app notification for manager
    await createNotification(
      shop.managerId,
      '🛒 New Order Received',
      `New order from ${req.user.name} for ${items.length} item(s)`,
      'order'
    );

    // In-app notification for consumer
    await createNotification(
      consumerId,
      '🛒 Order Placed Successfully',
      `Your order #${order._id.toString().slice(-6)} to ${shop.shopName} has been placed. OTP: ${deliveryOtp}`,
      'order'
    );

    return res.status(201).json(order);
  } catch (err) {
    next(err);
  }
}

// ─── Consumer: my orders ──────────────────────────────────────
async function getMyOrders(req, res, next) {
  try {
    const orders = await Order.find({ consumerId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('shopId', 'shopName address phone')
      .populate('driverId', 'name phone vehicleType licensePlate driverStatus');
    return res.status(200).json(orders);
  } catch (err) {
    next(err);
  }
}

// ─── Shared: single order ─────────────────────────────────────
async function getOrderById(req, res, next) {
  try {
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Invalid or missing order ID' });
    }

    const order = await Order.findById(req.params.id)
      .populate('shopId', 'shopName address phone')
      .populate('driverId', 'name phone vehicleType licensePlate driverStatus')
      .populate('consumerId', 'name email phone address');

    if (!order) return res.status(404).json({ error: 'Order not found' });
    return res.status(200).json(order);
  } catch (err) {
    next(err);
  }
}

// ─── Manager: orders for a shop ───────────────────────────────
async function getShopOrders(req, res, next) {
  try {
    const { shopId } = req.params;
    const { status } = req.query;

    // Verify this shop belongs to the requesting manager
    const shop = await Shop.findOne({ _id: shopId, managerId: req.user._id });
    if (!shop) return res.status(403).json({ error: 'Shop not found or access denied' });

    const filter = { shopId };
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('consumerId', 'name email phone')
      .populate('driverId', 'name phone vehicleType licensePlate driverStatus');

    return res.status(200).json(orders);
  } catch (err) {
    next(err);
  }
}

// ─── Manager: update order status ────────────────────────────
async function updateOrderStatus(req, res, next) {
  try {
    const { status, rejectionReason, estimatedDelivery } = req.body;
    const validStatuses = ['confirmed', 'preparing', 'assigned', 'out_for_delivery', 'delivered', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await Order.findOne({ _id: req.params.id, managerId: req.user._id });
    if (!order) return res.status(404).json({ error: 'Order not found or access denied' });

    order.status = status;
    if (rejectionReason) order.rejectionReason = rejectionReason;
    if (estimatedDelivery) order.estimatedDelivery = estimatedDelivery;
    await order.save();

    // Notify consumer via Socket.io (with driver info if assigned)
    const io = getIO(req);
    if (io) {
      // Populate driver for real-time update
      await order.populate('driverId', 'name phone vehicleType licensePlate');
      const driver = order.driverId;
      io.to(`order:${order._id}`).emit('order_status_update', {
        orderId: order._id,
        status,
        estimatedDelivery: order.estimatedDelivery,
        rejectionReason: order.rejectionReason,
        driverName: driver?.name || null,
        driverPhone: driver?.phone || null,
        driverVehicle: driver?.vehicleType || null,
        driverId: driver ? {
          _id: driver._id,
          name: driver.name,
          phone: driver.phone,
          vehicleType: driver.vehicleType,
          licensePlate: driver.licensePlate,
        } : null,
      });
    }

    // In-app notification for consumer
    const statusMessages = {
      confirmed:        '✅ Your order has been confirmed!',
      preparing:        '👨‍🍳 Your order is being prepared.',
      assigned:         '🚴 A delivery driver has been assigned to your order!',
      out_for_delivery: '🚴 Your order is on the way!',
      delivered:        '🎉 Your order has been delivered!',
      rejected:         `❌ Your order was rejected. ${rejectionReason || ''}`,
    };

    await createNotification(
      order.consumerId,
      'Order Update',
      statusMessages[status] || `Order status: ${status}`,
      'order'
    );

    return res.status(200).json({ message: 'Status updated', order });
  } catch (err) {
    next(err);
  }
}

// ─── Manager: all orders across manager's shop (dashboard) ───
async function getManagerAllOrders(req, res, next) {
  try {
    const managerId = req.user._id;
    const managerObjId = mongoose.Types.ObjectId.isValid(managerId) ? new mongoose.Types.ObjectId(managerId) : managerId;

    // Find all shops owned by this manager
    const shops = await Shop.find({
      $or: [{ managerId: managerId }, { managerId: managerObjId }]
    });
    const shopIds = shops.map((s) => s._id);

    const orders = await Order.find({
      $or: [
        { managerId: managerId },
        { managerId: managerObjId },
        { shopId: { $in: shopIds } },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(200)
      .populate('consumerId', 'name email phone')
      .populate('driverId', 'name phone vehicleType licensePlate driverStatus')
      .populate('shopId', 'shopName address phone');

    return res.status(200).json(orders);
  } catch (err) {
    next(err);
  }
}

// ─── Admin: all orders system-wide ───────────────────────────
async function getAllOrders(req, res, next) {
  try {
    const { status, limit = 100 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('consumerId', 'name email')
      .populate('shopId', 'shopName')
      .populate('driverId', 'name phone vehicleType');
    return res.status(200).json(orders);
  } catch (err) {
    next(err);
  }
}

// ─── Shared: Cancel Order (Consumer or Manager) ───────────────
async function cancelOrder(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    const order = (mongoose.Types.ObjectId.isValid(id)) ? await Order.findById(id) : null;
    if (order) {
      if (order.status === 'delivered') {
        return res.status(400).json({ error: 'Delivered orders cannot be cancelled.' });
      }
      order.status = 'rejected';
      order.rejectionReason = reason || 'Cancelled by customer';
      await order.save();

      // Emit Socket.io update
      const io = getIO(req);
      if (io) {
        io.to(`order:${order._id}`).emit('order_status_update', {
          orderId: order._id.toString(),
          status: 'rejected',
          rejectionReason: order.rejectionReason,
        });
        io.emit('order_status_update', {
          orderId: order._id.toString(),
          status: 'rejected',
          rejectionReason: order.rejectionReason,
        });
      }
    }

    return res.status(200).json({
      message: 'Order cancelled successfully',
      status: 'rejected',
      reason: reason || 'Cancelled by customer'
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  placeOrder,
  getMyOrders,
  getOrderById,
  getShopOrders,
  updateOrderStatus,
  getManagerAllOrders,
  getAllOrders,
  cancelOrder,
};
