const express = require('express');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const orderController = require('../controllers/orderController');

const router = express.Router();

// ─── Consumer ─────────────────────────────────────────────────
router.post('/',        auth, requireRole('consumer'), orderController.placeOrder);
router.get('/my',       auth, requireRole('consumer'), orderController.getMyOrders);

// ─── Manager ──────────────────────────────────────────────────
router.get('/manager',                  auth, requireRole('manager'), orderController.getManagerAllOrders);
router.get('/manager/:shopId',          auth, requireRole('manager'), orderController.getShopOrders);
router.patch('/:id/status',             auth, requireRole('manager'), orderController.updateOrderStatus);

// ─── Admin ────────────────────────────────────────────────────
router.get('/admin/all',  auth, requireRole('admin'), orderController.getAllOrders);

// ─── Shared: single order (consumer or manager) ───────────────
router.get('/:id', auth, orderController.getOrderById);

module.exports = router;
