const express = require('express');
const auth = require('../middleware/auth');
const chatController = require('../controllers/chatController');
const publicChatController = require('../controllers/publicChatController');

const router = express.Router();

// Authenticated follow-up chat (linked to a scan)
router.post('/', auth, chatController.followUp);

// Combined Farmer & Business Supply Chain Advisor
router.post('/advisor/combined', auth, chatController.combinedAdvisor);

// Gemini AI Recipe Generator
router.post('/recipes/generate', auth, chatController.generateRecipes);
router.post('/recipes', auth, chatController.generateRecipes);

// Public chatbot — no auth required, Gemini free-tier, FFDS-aware
router.post('/public', publicChatController.publicChat);

module.exports = router;



