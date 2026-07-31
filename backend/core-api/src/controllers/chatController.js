const Scan = require('../models/Scan');
const ChatLog = require('../models/ChatLog');
const geminiClient = require('../services/geminiClient');

async function followUp(req, res, next) {
  try {
    const { scanId, question, language } = req.body;

    if (!scanId || !question) {
      return res.status(400).json({ error: 'scanId and question are required' });
    }

    const scan = await Scan.findById(scanId);
    if (!scan || scan.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ error: 'Scan not found' });
    }

    let chatLog = await ChatLog.findOne({ scanId, userId: req.user._id });
    if (!chatLog) {
      chatLog = new ChatLog({
        userId: req.user._id,
        scanId,
        language: language || req.user.language,
        messages: [],
      });
    }

    const reply = await geminiClient.answerFollowUp({
      scanContext: {
        foodType: scan.foodType,
        label: scan.label,
        confidence: scan.confidence,
        gasReadings: scan.gasReadings,
      },
      chatHistory: chatLog.messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.text }],
      })),
      question,
      language: language || req.user.language,
    });

    const now = new Date();
    chatLog.messages.push({ role: 'user', text: question, timestamp: now });
    chatLog.messages.push({ role: 'assistant', text: reply, timestamp: now });
    await chatLog.save();

    return res.status(200).json({ reply, chatLogId: chatLog._id });
  } catch (err) {
    next(err);
  }
}

async function combinedAdvisor(req, res, next) {
  try {
    const {
      actionType,
      foodType,
      verdict,
      confidence,
      batchSize,
      qualityScore,
      freshPct,
      borderlinePct,
      spoiledPct,
      inventorySummary,
      userLanguage,
      predictedDaysLeft,
      tempC,
      humidityPct,
      matchedAllergen,
    } = req.body;

    if (!actionType || !foodType || !verdict) {
      return res.status(400).json({ error: 'actionType, foodType, and verdict are required parameters.' });
    }

    const advice = await geminiClient.explainCombinedAdvisor({
      actionType,
      foodType,
      verdict,
      confidence,
      batchSize,
      qualityScore,
      freshPct,
      borderlinePct,
      spoiledPct,
      inventorySummary,
      userLanguage: userLanguage || req.user?.language || 'English',
      predictedDaysLeft,
      tempC,
      humidityPct,
      matchedAllergen,
    });

    return res.status(200).json({ advice });
  } catch (err) {
    next(err);
  }
}

async function generateRecipes(req, res, next) {
  try {
    const { ingredients, language } = req.body;
    const recipes = await geminiClient.generateRecipesWithGemini({
      ingredients: ingredients || [],
      language: language || req.user?.language || 'English',
    });
    return res.status(200).json({ recipes });
  } catch (err) {
    next(err);
  }
}

module.exports = { followUp, combinedAdvisor, generateRecipes };


