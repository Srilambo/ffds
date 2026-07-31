const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

// Log JWT_SECRET status for debugging
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  WARNING: JWT_SECRET environment variable not set. Using fallback "test-secret". This is insecure for production!');
}

async function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verify the user actually still exists in DB (handles stale tokens after seed re-runs)
    const dbUser = await User.findById(decoded._id).select('_id role email name phone managerId businessId teamId farmId familyId language isActive');
    if (!dbUser || !dbUser.isActive) {
      return res.status(401).json({ error: 'Session expired – please log in again' });
    }

    // Use fresh DB data merged with JWT data
    req.user = {
      ...decoded,
      _id: dbUser._id,
      role: dbUser.role,
      name: dbUser.name,
      phone: dbUser.phone,
      managerId: dbUser.managerId,
      businessId: dbUser.businessId,
      teamId: dbUser.teamId,
      farmId: dbUser.farmId,
      familyId: dbUser.familyId,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token – please log in again' });
  }
}

module.exports = auth;
