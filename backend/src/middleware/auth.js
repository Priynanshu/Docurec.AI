const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AuthError } = require('../utils/errors');
const { cacheGet, cacheSet } = require('../config/redis');

// ── Main auth middleware: checks JWT token on every protected route ────────────
const authenticate = async (req, res, next) => {
  try {
    // Token must come in header: "Authorization: Bearer <token>"
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthError('No token provided. Please login first.');
    }

    const token = authHeader.split(' ')[1];

    // Verify the token signature and expiry
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') throw new AuthError('Session expired. Please login again.');
      throw new AuthError('Invalid token. Please login again.');
    }

    // Try cache first (faster than DB hit)
    const cacheKey = `user:${decoded.id}`;
    let user = await cacheGet(cacheKey);

    if (!user) {
      // Cache miss → load from DB
      user = await User.findById(decoded.id).select('-password');
      if (!user) throw new AuthError('Account not found. Please register.');
      // Cache for 5 minutes
      await cacheSet(cacheKey, user, 300);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

// ── Generate a JWT token for a user (call after login/register) ───────────────
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || '7d' } // 7 days — simple, no refresh needed
  );
};

module.exports = { authenticate, generateToken };
