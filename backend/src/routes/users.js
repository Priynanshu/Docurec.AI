const router = require('express').Router();
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { sendSuccess } = require('../utils/response');
const { cacheDel } = require('../config/redis');

router.use(authenticate);


router.get('/profile', async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, data: { user } });
  } catch (error) { next(error); }
});


router.patch('/profile', async (req, res, next) => {
  try {
    const { name, preferences } = req.body;
    const update = {};
    if (name) update.name = name;
    if (preferences) update.preferences = { ...req.user.preferences, ...preferences };

    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true });
    await cacheDel(`user:${req.user._id}`);
    return sendSuccess(res, { user }, 'Profile updated');
  } catch (error) { next(error); }
});


router.patch('/password', async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    await cacheDel(`user:${req.user._id}`);
    return sendSuccess(res, {}, 'Password changed successfully');
  } catch (error) { next(error); }
});

module.exports = router;
