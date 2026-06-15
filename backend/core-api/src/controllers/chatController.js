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
    if (!scan || scan.userId.toString() !== req.user._id) {
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

module.exports = { followUp };
