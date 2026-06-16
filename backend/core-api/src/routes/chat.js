const express = require('express');
const auth = require('../middleware/auth');
const chatController = require('../controllers/chatController');

const router = express.Router();

router.post('/', auth, chatController.followUp);

module.exports = router;
