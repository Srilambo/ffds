const express = require('express');
const auth = require('../middleware/auth');
const chatController = require('../controllers/chatController');
const publicChatController = require('../controllers/publicChatController');

const router = express.Router();

// Authenticated follow-up chat (linked to a scan)
router.post('/', auth, chatController.followUp);

// Public chatbot — no auth required, Gemini free-tier, FFDS-aware
router.post('/public', publicChatController.publicChat);

module.exports = router;

