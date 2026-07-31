const express = require('express');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const driverController = require('../controllers/driverController');

const router = express.Router();

// All routes require driver role
router.use(auth, requireRole('driver'));

// Dashboard stats
router.get('/dashboard', driverController.getDriverDashboard);

// Assigned delivery orders
router.get('/orders', driverController.getAssignedOrders);

// Delivery status update
router.patch('/orders/:id/status', driverController.updateDeliveryStatus);

// Duty availability and vehicle settings
router.patch('/status', driverController.updateDriverStatus);

module.exports = router;
