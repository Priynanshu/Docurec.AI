const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { sendSuccess, sendCreated, sendError } = require('../utils/response');
const { AuthError } = require('../utils/errors');
const { cacheDel } = require('../config/redis');
const logger = require('../utils/logger');

/**
 * POST /api/v1/auth/register
 * Create new account — immediately ready to use, no email verification needed
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if email is already taken
    const existing = await User.findOne({ email });
    if (existing) {
      return sendError(res, 'This email is already registered. Please login instead.', 409);
    }

    // Create the user (password gets hashed automatically by User model pre-save hook)
    const user = await User.create({ name, email, password });

    // Generate JWT token right away — user is immediately logged in
    const token = generateToken(user._id);

    logger.info(`New user registered: ${email}`);

    return sendCreated(res, {
      token,
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
        stats: user.stats,
      },
    }, 'Account created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/login
 * Login with email + password — returns token
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user and include password field (hidden by default)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return sendError(res, 'No account found with this email. Please register.', 401);
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 'Incorrect password. Please try again.', 401);
    }

    // Generate a fresh token
    const token = generateToken(user._id);

    // Update last login time
    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    logger.info(`User logged in: ${email}`);

    return sendSuccess(res, {
      token,
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
        stats: user.stats,
      },
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/logout
 * Just clear server-side cache. Token expires naturally on client side.
 */
const logout = async (req, res, next) => {
  try {
    // Clear user from Redis cache so auth check picks up any changes immediately
    await cacheDel(`user:${req.user._id}`);
    return sendSuccess(res, {}, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/auth/me
 * Get currently logged-in user info
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    return sendSuccess(res, { user });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, logout, getMe };
