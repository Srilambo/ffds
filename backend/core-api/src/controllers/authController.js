const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
const SALT_ROUNDS = 10;

// Log JWT_SECRET status for debugging
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  WARNING: JWT_SECRET environment variable not set. Using fallback "test-secret". This is insecure for production!');
}

function signToken(user) {
  return jwt.sign(
    {
      _id: user._id.toString(),
      email: user.email,
      role: user.role,
      language: user.language,
      teamId: user.teamId ? user.teamId.toString() : null,
      businessId: user.businessId ? user.businessId.toString() : null,
      farmId: user.farmId ? user.farmId.toString() : null,
      familyId: user.familyId ? user.familyId.toString() : null,
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
    businessId: user.businessId,
    farmId: user.farmId,
    familyId: user.familyId,
    notificationPrefs: user.notificationPrefs || {
      expiryReminders: true,
      pushEnabled: true,
      reminderDays: 2,
    },
    phone: user.phone || '',
    postalCode: user.postalCode || '',
    address: user.address || '',
    location: user.location || { type: 'Point', coordinates: [79.8612, 6.9271] },
    cardDetails: user.cardDetails || { cardHolderName: '', cardNumberMasked: '', expiryDate: '' },
    isActive: user.isActive,
    lastLogin: user.lastLogin,
  };
}

async function register(req, res, next) {
  try {
    const { name, email, password, role, language } = req.body;

    if (!name || !email || !password || !role || !language) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (!['consumer', 'manager', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Role must be consumer, manager, or admin' });
    }
    if (!['en', 'si', 'ta', 'ar', 'fr', 'ja'].includes(language)) {
      return res.status(400).json({ error: 'Language must be en, si, ta, ar, fr, or ja' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    
    // Generate IDs based on role (Manager role includes farm & business capabilities)
    const businessId = role === 'manager' ? new mongoose.Types.ObjectId() : null;
    const farmId = role === 'manager' ? businessId : null;
    const familyId = role === 'consumer' ? new mongoose.Types.ObjectId() : null;
    
    // For legacy compat with manager team actions
    const teamId = businessId;

    const user = await User.create({
      name,
      email,
      passwordHash,
      role,
      language,
      teamId,
      businessId,
      farmId,
      familyId,
      isActive: true,
      lastLogin: new Date(),
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

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is suspended' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Auto-migrate legacy farmer accounts to manager (combined Producer & Business Manager)
    if (user.role === 'farmer') {
      user.role = 'manager';
      if (!user.businessId) user.businessId = user.farmId || new mongoose.Types.ObjectId();
      if (!user.farmId) user.farmId = user.businessId;
      if (!user.teamId) user.teamId = user.businessId;
    }

    user.lastLogin = new Date();
    await user.save();

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

async function updateProfile(req, res, next) {
  try {
    const { name, email, language, notificationPrefs, address, phone, postalCode, location, cardDetails } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (postalCode !== undefined) user.postalCode = postalCode;
    if (address !== undefined) user.address = address;
    if (location && location.coordinates && Array.isArray(location.coordinates)) {
      user.location = { type: 'Point', coordinates: location.coordinates };
    }
    if (cardDetails) {
      user.cardDetails = {
        cardHolderName: cardDetails.cardHolderName || user.cardDetails?.cardHolderName || '',
        cardNumberMasked: cardDetails.cardNumberMasked || user.cardDetails?.cardNumberMasked || '',
        expiryDate: cardDetails.expiryDate || user.cardDetails?.expiryDate || '',
      };
    }
    if (language) {
      if (!['en', 'si', 'ta', 'ar', 'fr', 'ja'].includes(language)) {
        return res.status(400).json({ error: 'Language must be en, si, ta, ar, fr, or ja' });
      }
      user.language = language;
    }
    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ error: 'Email already in use' });
      }
      user.email = email;
    }
    if (notificationPrefs) {
      if (!user.notificationPrefs) {
        user.notificationPrefs = { expiryReminders: true, pushEnabled: true, reminderDays: 2 };
      }
      if (notificationPrefs.expiryReminders != null) {
        user.notificationPrefs.expiryReminders = !!notificationPrefs.expiryReminders;
      }
      if (notificationPrefs.pushEnabled != null) {
        user.notificationPrefs.pushEnabled = !!notificationPrefs.pushEnabled;
      }
      if (notificationPrefs.reminderDays != null) {
        user.notificationPrefs.reminderDays = Math.min(14, Math.max(1, Number(notificationPrefs.reminderDays)));
      }
    }

    await user.save();
    const token = signToken(user);
    return res.status(200).json({ token, user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me, updateProfile, signToken, sanitizeUser };
