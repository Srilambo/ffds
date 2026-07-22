const express = require('express');
const auth = require('../middleware/auth');
const scanController = require('../controllers/scanController');

const router = express.Router();

router.get('/', auth, scanController.listScans);
router.get('/:id', auth, scanController.getScan);
router.patch('/:id', auth, scanController.updateScanFoodType);

module.exports = router;
