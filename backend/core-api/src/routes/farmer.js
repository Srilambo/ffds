const express = require('express');
const multer = require('multer');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const farmerController = require('../controllers/farmerController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// All routes require farmer role
router.use(auth, requireRole('farmer'));

// Dashboard
router.get('/dashboard', farmerController.getDashboard);

// Batch Scan
router.post('/batch-scan', upload.array('images', 50), farmerController.batchScan);

// Batches
router.get('/batches', farmerController.listBatches);
router.get('/batches/:id', farmerController.getBatch);

// Calendar
router.get('/calendar', farmerController.getCalendar);

// Loss Tracking
router.post('/loss', farmerController.logLoss);
router.get('/loss', farmerController.getLossHistory);

// Buyer Reports
router.post('/buyer-report/:batchId', farmerController.generateBuyerReport);

// Chatbot
router.post('/chat', farmerController.chat);

module.exports = router;