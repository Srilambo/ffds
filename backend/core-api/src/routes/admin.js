const express = require('express');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const adminController = require('../controllers/adminController');

const router = express.Router();

// Apply auth and admin checks on all routes
router.use(auth, requireRole('admin'));

// Users
router.get('/users', adminController.listUsers);
router.put('/users/:id/role', adminController.updateUserRole);
router.put('/users/:id/status', adminController.toggleUserStatus);
router.delete('/users/:id', adminController.deleteUser);

// System Analytics & Scans
router.get('/scans', adminController.listScans);
router.get('/metrics', adminController.getSystemMetrics);

// CNN AI Models
router.get('/models', adminController.getModels);
router.post('/models/active', adminController.setActiveModel);

// Multilingual Management
router.get('/languages', adminController.getLanguageStats);

// Audit & Global Reports
router.get('/reports/summary', adminController.getGlobalReportData);

// Broadcast Announcements
router.get('/announcements', adminController.listAnnouncements);
router.post('/announcements', adminController.createAnnouncement);
router.delete('/announcements/:id', adminController.deleteAnnouncement);

module.exports = router;

