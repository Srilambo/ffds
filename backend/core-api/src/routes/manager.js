const express = require('express');
const multer = require('multer');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const managerController = require('../controllers/managerController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// All routes require manager role
router.use(auth, requireRole('manager'));

// Dashboard
router.get('/dashboard', managerController.getDashboard);

// Inventory
router.get('/inventory', managerController.listInventory);
router.post('/inventory', managerController.createInventoryItem);
router.patch('/inventory/:id', managerController.updateInventoryItem);
router.delete('/inventory/:id', managerController.deleteInventoryItem);
router.post('/inventory/import', upload.single('file'), managerController.importCSV);

// Scans
router.get('/scans', managerController.listScans);

// Waste Analytics
router.get('/waste-analytics', managerController.getWasteAnalytics);
router.get('/waste-report/pdf', managerController.generateWasteReportPDF);

// Chatbot
router.post('/chat', managerController.chat);

// Drivers Management
router.get('/drivers', managerController.getManagerDrivers);
router.post('/drivers', managerController.createOrLinkDriver);
router.patch('/drivers/:driverId/status', managerController.updateManagerDriverStatus);
router.delete('/drivers/:driverId', managerController.deleteManagerDriver);
router.post('/orders/:orderId/assign-driver', managerController.assignDriverToOrder);

module.exports = router;