const express = require('express');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const managerController = require('../controllers/managerController');

const router = express.Router();

router.get('/dashboard', auth, requireRole('manager'), managerController.dashboard);

module.exports = router;
