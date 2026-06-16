const express = require('express');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const adminController = require('../controllers/adminController');

const router = express.Router();

// Apply auth and admin checks on all routes
router.use(auth, requireRole('admin'));

router.get('/users', adminController.listUsers);
router.put('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);
router.get('/scans', adminController.listScans);
router.get('/metrics', adminController.getSystemMetrics);

module.exports = router;
