/**
 * Public chatbot controller — no authentication required.
 *
 * POST /chat/public
 * Body: { question: string, history?: Array<{role:'user'|'assistant', text:string}> }
 *
 * Rate-limit: 10 requests per minute per IP (in-memory, resets per minute window).
 * This stays within the Gemini free-tier limit of 15 req/min.
 */

const geminiClient = require('../services/geminiClient');

// --- Simple in-memory rate limiter ---
// Map: ip -> { count: number, windowStart: number }
const rateLimitMap = new Map();
const RATE_LIMIT = 10;      // max requests per window
const WINDOW_MS = 60_000;   // 1-minute window

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    // New window
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return false;
  }

  if (entry.count >= RATE_LIMIT) {
    return true;
  }

  entry.count += 1;
  return false;
}

// --- Controller ---
async function publicChat(req, res, next) {
  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';

    if (isRateLimited(ip)) {
      return res.status(429).json({
        error: 'Too many requests. Please wait a moment before asking again.',
        retryAfterSeconds: 60,
      });
    }

    const { question, history } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({ error: 'question is required and must be a non-empty string.' });
    }

    if (question.trim().length > 500) {
      return res.status(400).json({ error: 'question must be 500 characters or fewer.' });
    }

    // Validate history format if provided
    let chatHistory = [];
    if (Array.isArray(history)) {
      chatHistory = history
        .filter((m) => m && typeof m.text === 'string' && ['user', 'assistant'].includes(m.role))
        .slice(-10); // keep last 10 messages to avoid token overflow
    }

    const reply = await geminiClient.publicChatbot({
      question: question.trim(),
      history: chatHistory,
    });

    return res.status(200).json({ reply });
  } catch (err) {
    next(err);
  }
}

module.exports = { publicChat };
