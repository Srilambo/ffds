const express = require('express');
const auth = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

const router = express.Router();

router.get('/', auth, notificationController.list);
router.get('/unread-count', auth, notificationController.unreadCount);
router.get('/preferences', auth, notificationController.getPreferences);
router.patch('/preferences', auth, notificationController.updatePreferences);
router.post('/sync', auth, notificationController.sync);
router.patch('/read-all', auth, notificationController.markAllRead);
router.patch('/:id/read', auth, notificationController.markRead);

module.exports = router;
