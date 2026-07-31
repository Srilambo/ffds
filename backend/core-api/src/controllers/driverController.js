const Order = require('../models/Order');
const User = require('../models/User');
const Shop = require('../models/Shop');
const InventoryItem = require('../models/InventoryItem');
const Notification = require('../models/Notification');

function getIO(req) {
  return req.app.get('io');
}

async function createNotification(userId, title, message, type = 'order', severity = 'info') {
  try {
    await Notification.create({ userId, title, message, type, severity });
  } catch (e) {
    console.warn('Notification create failed:', e.message);
  }
}

// ─── Driver Dashboard Stats ──────────────────────────────────
async function getDriverDashboard(req, res, next) {
  try {
    const driverId = req.user._id;

    // Fetch fresh user profile from DB to get managerId & driver attributes
    const currentUser = (await User.findById(driverId)) || req.user;

    // Get manager details if linked
    let manager = null;
    if (currentUser.managerId) {
      manager = await User.findById(currentUser.managerId).select('name email phone businessId');
    }

    const assignedOrders = await Order.find({ driverId })
      .sort({ createdAt: -1 })
      .populate('consumerId', 'name email phone address')
      .populate('shopId', 'shopName address phone location');

    const activeDeliveries = assignedOrders.filter(
      (o) => ['assigned', 'out_for_delivery', 'preparing'].includes(o.status)
    );

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const completedToday = assignedOrders.filter(
      (o) => o.status === 'delivered' && o.deliveredAt && new Date(o.deliveredAt) >= todayStart
    ).length;

    const totalDelivered = assignedOrders.filter((o) => o.status === 'delivered').length;

    return res.status(200).json({
      driver: {
        _id: currentUser._id,
        name: currentUser.name,
        email: currentUser.email,
        phone: currentUser.phone || '',
        vehicleType: currentUser.vehicleType || 'Bicycle',
        licensePlate: currentUser.licensePlate || '',
        driverStatus: currentUser.driverStatus || 'available',
      },
      manager: manager
        ? {
            _id: manager._id,
            name: manager.name,
            email: manager.email,
            phone: manager.phone,
          }
        : null,
      stats: {
        activeCount: activeDeliveries.length,
        completedToday,
        totalDelivered,
      },
      activeDeliveries,
      recentOrders: assignedOrders.slice(0, 15),
    });
  } catch (err) {
    next(err);
  }
}

// ─── Driver: Assigned Orders List ────────────────────────────
async function getAssignedOrders(req, res, next) {
  try {
    const driverId = req.user._id;
    const { status } = req.query;

    const filter = { driverId };
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('consumerId', 'name email phone address')
      .populate('shopId', 'shopName address phone location');

    return res.status(200).json(orders);
  } catch (err) {
    next(err);
  }
}

// ─── Driver: Update Delivery Status ──────────────────────────
async function updateDeliveryStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, otp } = req.body;
    const driverId = req.user._id;

    const validStatuses = ['confirmed', 'preparing', 'assigned', 'out_for_delivery', 'delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status must be one of: confirmed, preparing, assigned, out_for_delivery, delivered' });
    }

    const order = await Order.findOne({ _id: id, driverId });
    if (!order) {
      return res.status(404).json({ error: 'Order not found or not assigned to you' });
    }

    // OTP verification required for Stage 5: Delivered
    if (status === 'delivered') {
      if (!otp) {
        return res.status(400).json({ error: '4-digit Delivery OTP code is required to complete delivery.' });
      }
      if (order.deliveryOtp && order.deliveryOtp.toString().trim() !== otp.toString().trim()) {
        return res.status(400).json({ error: 'Incorrect Delivery OTP! Please ask the customer for their 4-digit OTP shown on their screen.' });
      }
      order.deliveredAt = new Date();
      await User.findByIdAndUpdate(driverId, { driverStatus: 'available' });

      // ─── Auto-add delivered items to consumer's Fridge Inventory ───
      try {
        const today      = new Date();
        const purchase   = new Date(today);

        // Helper: guess expiry days by item category
        const expiryDaysMap = (cat) => {
          const c = (cat || '').toLowerCase();
          if (c.includes('dairy') || c.includes('milk') || c.includes('egg'))   return 7;
          if (c.includes('meat') || c.includes('fish') || c.includes('seafood')) return 3;
          if (c.includes('bread') || c.includes('bakery'))                       return 4;
          if (c.includes('fruit') || c.includes('vegeta') || c.includes('produce')) return 7;
          return 10; // default for packaged/other goods
        };

        // Map order item category to InventoryItem enum
        const mapCategory = (cat) => {
          const c = (cat || '').toLowerCase();
          if (c.includes('fruit'))   return 'fruit';
          if (c.includes('vegeta') || c.includes('produce') || c.includes('leafy')) return 'vegetable';
          if (c.includes('dairy') || c.includes('milk') || c.includes('egg') || c.includes('cheese')) return 'dairy';
          if (c.includes('meat') || c.includes('chicken') || c.includes('beef')) return 'meat';
          if (c.includes('bread') || c.includes('bake') || c.includes('cake'))  return 'bakery';
          return 'other';
        };

        // Parse qty: e.g. '2 kg', '5 pcs', '1 unit' → { qty: 2, unit: 'kg' }
        const parseQty = (qtyStr) => {
          const match = String(qtyStr || '1').match(/(\d+\.?\d*)\s*(.*)?/);
          return {
            quantity: parseFloat(match?.[1] || 1) || 1,
            unit:     (match?.[2] || 'pcs').trim() || 'pcs',
          };
        };

        const fridgeItems = (order.items || []).map(item => {
          const category = mapCategory(item.category);
          const days     = expiryDaysMap(item.category);
          const expiry   = new Date(today);
          expiry.setDate(expiry.getDate() + days);
          const { quantity, unit } = parseQty(item.qty);
          return {
            ownerId:      order.consumerId,
            ownerType:    'consumer',
            userId:       order.consumerId,
            foodName:     item.name,
            category,
            quantity,
            unit,
            purchaseDate: purchase,
            expiryDate:   expiry,
            status:       'fresh',
            location:     'fridge',
          };
        });

        if (fridgeItems.length) {
          await InventoryItem.insertMany(fridgeItems);
        }
      } catch (fridgeErr) {
        // Non-blocking: log but don't fail the delivery confirmation
        console.warn('[Auto-Fridge] Failed to add items to fridge:', fridgeErr.message);
      }
    } else if (status === 'out_for_delivery') {
      order.outForDeliveryAt = new Date();
      await User.findByIdAndUpdate(driverId, { driverStatus: 'delivering' });
    }

    order.status = status;
    await order.save();

    // Socket.io Real-time Event
    const io = getIO(req);
    if (io) {
      const payload = {
        orderId: order._id.toString(),
        status,
        driverId: req.user._id.toString(),
        driverName: req.user.name,
        driverPhone: req.user.phone,
        driverVehicle: req.user.vehicleType,
        updatedAt: new Date(),
      };
      io.to(`order:${order._id}`).emit('order_status_update', payload);
      io.to(`order:${order._id.toString()}`).emit('order_status_update', payload);
      io.to(`shop:${order.shopId}`).emit('order_status_update', payload);
      io.emit('order_status_update', payload);
    }

    // In-app Notifications
    const statusTextMap = {
      confirmed: `✅ Order confirmed by driver ${req.user.name}`,
      preparing: `👨‍🍳 Order is being prepared`,
      assigned: `📦 Order packed and assigned to rider ${req.user.name}`,
      out_for_delivery: `🚴 Order is out for delivery with rider ${req.user.name}!`,
      delivered: `🎉 Order successfully delivered by rider ${req.user.name}!`,
    };

    await createNotification(order.consumerId, 'Delivery Status Update', statusTextMap[status] || `Status updated to ${status}`, 'order');
    await createNotification(
      order.managerId,
      'Order Delivery Progress',
      `Driver ${req.user.name} updated order status to ${status.replace(/_/g, ' ')}`,
      'order'
    );

    return res.status(200).json({ message: 'Delivery status updated successfully', order });
  } catch (err) {
    next(err);
  }
}

// ─── Driver: Update Profile / Duty Status ────────────────────
async function updateDriverStatus(req, res, next) {
  try {
    const driverId = req.user._id;
    const { driverStatus, vehicleType, licensePlate, phone } = req.body;

    const user = await User.findById(driverId);
    if (!user) return res.status(404).json({ error: 'Driver profile not found' });

    if (driverStatus && ['available', 'delivering', 'offline'].includes(driverStatus)) {
      user.driverStatus = driverStatus;
    }
    if (vehicleType) user.vehicleType = vehicleType;
    if (licensePlate !== undefined) user.licensePlate = licensePlate;
    if (phone !== undefined) user.phone = phone;

    await user.save();
    return res.status(200).json({ message: 'Driver status updated', user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      vehicleType: user.vehicleType,
      licensePlate: user.licensePlate,
      driverStatus: user.driverStatus,
    }});
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDriverDashboard,
  getAssignedOrders,
  updateDeliveryStatus,
  updateDriverStatus,
};
