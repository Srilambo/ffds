const express = require('express');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const reviewController = require('../controllers/reviewController');

const router = express.Router();

// Consumer: submit review
router.post('/', auth, requireRole('consumer'), reviewController.createReview);
router.get('/my', auth, requireRole('consumer'), reviewController.getMyReviews);

// Manager: get shop reviews
router.get('/manager', auth, requireRole('manager'), reviewController.getManagerShopReviews);

// Driver: get driver ratings & feedback
router.get('/driver', auth, requireRole('driver'), reviewController.getDriverReviews);

module.exports = router;
