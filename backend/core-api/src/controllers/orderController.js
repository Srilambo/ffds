const Order = require('../models/Order');
const Shop  = require('../models/Shop');
const User  = require('../models/User');
const Notification = require('../models/Notification');

// Helper: get io from app (attached in server.js)
function getIO(req) {
  return req.app.get('io');
}

// Helper: create in-app notification
async function createNotification(userId, title, message, type = 'order') {
  try {
    await Notification.create({ userId, title, message, type });
  } catch (e) {
    console.warn('Notification create failed:', e.message);
  }
}

// ─── Consumer: place order ────────────────────────────────────
async function placeOrder(req, res, next) {
  try {
    const consumerId = req.user._id;
    const { shopId, items, paymentMethod, consumerNote, deliveryAddress, deliveryLocation } = req.body;

    if (!shopId || !items || !items.length) {
      return res.status(400).json({ error: 'shopId and items are required' });
    }

    const shop = await Shop.findById(shopId);
    if (!shop) return res.status(404).json({ error: 'Shop not found' });

    const totalAmount = items.reduce((sum, i) => sum + (parseFloat(i.price) || 0), 0);

    const order = await Order.create({
      consumerId,
      shopId,
      managerId: shop.managerId,
      items,
      paymentMethod: paymentMethod || 'cash',
      totalAmount,
      consumerNote: consumerNote || '',
      deliveryAddress: deliveryAddress || '',
      deliveryLocation: deliveryLocation || { lat: 0, lng: 0 },
    });

    // Increment shop order count
    await Shop.findByIdAndUpdate(shopId, { $inc: { totalOrders: 1 } });

    // Notify manager via Socket.io room
    const io = getIO(req);
    if (io) {
      const consumer = await User.findById(consumerId).select('name');
      io.to(`shop:${shopId}`).emit('new_order', {
        orderId: order._id,
        consumerName: consumer?.name || 'Consumer',
        items: order.items,
        paymentMethod: order.paymentMethod,
        status: order.status,
        createdAt: order.createdAt,
      });
    }

    // In-app notification for manager
    await createNotification(
      shop.managerId,
      '🛒 New Order Received',
      `New order from ${req.user.name} for ${items.length} item(s)`,
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
      .populate('shopId', 'shopName address phone');
    return res.status(200).json(orders);
  } catch (err) {
    next(err);
  }
}

// ─── Consumer: single order ───────────────────────────────────
async function getOrderById(req, res, next) {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      $or: [{ consumerId: req.user._id }, { managerId: req.user._id }],
    }).populate('shopId', 'shopName address phone');
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
      .populate('consumerId', 'name email');

    return res.status(200).json(orders);
  } catch (err) {
    next(err);
  }
}

// ─── Manager: update order status ────────────────────────────
async function updateOrderStatus(req, res, next) {
  try {
    const { status, rejectionReason, estimatedDelivery } = req.body;
    const validStatuses = ['confirmed', 'preparing', 'out_for_delivery', 'delivered', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await Order.findOne({ _id: req.params.id, managerId: req.user._id });
    if (!order) return res.status(404).json({ error: 'Order not found or access denied' });

    order.status = status;
    if (rejectionReason) order.rejectionReason = rejectionReason;
    if (estimatedDelivery) order.estimatedDelivery = estimatedDelivery;
    await order.save();

    // Notify consumer via Socket.io
    const io = getIO(req);
    if (io) {
      io.to(`order:${order._id}`).emit('order_status_update', {
        orderId: order._id,
        status,
        estimatedDelivery: order.estimatedDelivery,
        rejectionReason: order.rejectionReason,
      });
    }

    // In-app notification for consumer
    const statusMessages = {
      confirmed:        '✅ Your order has been confirmed!',
      preparing:        '👨‍🍳 Your order is being prepared.',
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
    const shop = await Shop.findOne({ managerId: req.user._id });
    if (!shop) return res.status(200).json([]);

    const orders = await Order.find({ managerId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(200)
      .populate('consumerId', 'name email');

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
      .populate('shopId', 'shopName');
    return res.status(200).json(orders);
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
};
