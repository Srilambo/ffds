const express = require('express');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const shopController = require('../controllers/shopController');

const router = express.Router();

// ─── Manager routes ───────────────────────────────────────────
router.post('/',     auth, requireRole('manager'), shopController.upsertShop);
router.get('/my',    auth, requireRole('manager'), shopController.getMyShop);

// ─── Consumer routes ──────────────────────────────────────────
router.get('/nearby', auth, requireRole('consumer'), shopController.getNearbyShops);

// ─── Admin routes ─────────────────────────────────────────────
router.get('/all',              auth, requireRole('admin'), shopController.getAllShops);
router.patch('/:id/verify',     auth, requireRole('admin'), shopController.toggleVerified);
router.delete('/:id',           auth, requireRole('admin'), shopController.deleteShop);

// ─── Shared: single shop (manager or consumer viewing) ───────
router.get('/:id', auth, shopController.getShopById);

module.exports = router;
