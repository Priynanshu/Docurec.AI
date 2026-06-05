const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { sendSuccess, sendCreated, sendError } = require('../utils/response');
const { cacheDel } = require('../config/redis');

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return sendError(res, 'This email is already registered. Please login instead.', 409);
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);

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

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return sendError(res, 'No account found with this email. Please register.', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 'Incorrect password. Please try again.', 401);
    }

    const token = generateToken(user._id);

    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

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

const logout = async (req, res, next) => {
  try {
    await cacheDel(`user:${req.user._id}`);
    return sendSuccess(res, {}, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    return sendSuccess(res, { user });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, logout, getMe };
