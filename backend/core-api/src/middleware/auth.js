const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

// Log JWT_SECRET status for debugging
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  WARNING: JWT_SECRET environment variable not set. Using fallback "test-secret". This is insecure for production!');
}

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    console.error('Auth failed: Missing or invalid Authorization header');
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Auth failed: Token verification error', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = auth;
