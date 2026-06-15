const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
const SALT_ROUNDS = 10;

function signToken(user) {
  return jwt.sign(
    {
      _id: user._id.toString(),
      email: user.email,
      role: user.role,
      language: user.language,
      teamId: user.teamId ? user.teamId.toString() : null,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function sanitizeUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    language: user.language,
    teamId: user.teamId,
  };
}

async function register(req, res, next) {
  try {
    const { name, email, password, role, language } = req.body;

    if (!name || !email || !password || !role || !language) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (!['consumer', 'manager'].includes(role)) {
      return res.status(400).json({ error: 'Role must be consumer or manager' });
    }
    if (!['en', 'si'].includes(language)) {
      return res.status(400).json({ error: 'Language must be en or si' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const teamId = role === 'manager' ? new mongoose.Types.ObjectId() : null;

    const user = await User.create({
      name,
      email,
      passwordHash,
      role,
      language,
      teamId,
    });

    const token = signToken(user);
    return res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken(user);
    return res.status(200).json({ token, user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json(sanitizeUser(user));
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me, signToken, sanitizeUser };
