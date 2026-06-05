const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { cacheGet, cacheSet } = require('../config/redis');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'No token provided. Please login first.');
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') throw new ApiError(401, 'Session expired. Please login again.');
      throw new ApiError(401, 'Invalid token. Please login again.');
    }

    const cacheKey = `user:${decoded.id}`;
    let user = await cacheGet(cacheKey);

    if (!user) {
      user = await User.findById(decoded.id).select('-password');
      if (!user) throw new ApiError(401, 'Account not found. Please register.');
      await cacheSet(cacheKey, user, 300);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || '7d' }
  );
};

module.exports = { authenticate, generateToken };
