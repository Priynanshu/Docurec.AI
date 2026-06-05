const rateLimit = require('express-rate-limit');


const createLimiter = (windowMinutes, max, message) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    message:        { success: false, message },
    standardHeaders: true,
    legacyHeaders:   false,
  });


const authLimiter   = createLimiter(15, 10,  'Too many auth attempts. Try again in 15 minutes.');


const uploadLimiter = createLimiter(1,  10,  'Upload limit reached. Max 10 uploads per minute.');


const apiLimiter    = createLimiter(15, 100, 'Too many requests. Please slow down.');


const chatLimiter   = createLimiter(1,  20,  'Chat rate limit reached. Max 20 messages per minute.');

module.exports = { authLimiter, uploadLimiter, apiLimiter, chatLimiter };
