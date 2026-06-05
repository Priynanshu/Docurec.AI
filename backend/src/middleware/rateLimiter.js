const rateLimit = require('express-rate-limit');

// Helper to create a rate limiter with consistent config
const createLimiter = (windowMinutes, max, message) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    message:        { success: false, message },
    standardHeaders: true,
    legacyHeaders:   false,
  });

// Strict limit for auth routes (login/register)
const authLimiter   = createLimiter(15, 10,  'Too many auth attempts. Try again in 15 minutes.');

// Moderate limit for file uploads
const uploadLimiter = createLimiter(1,  10,  'Upload limit reached. Max 10 uploads per minute.');

// General API limit
const apiLimiter    = createLimiter(15, 100, 'Too many requests. Please slow down.');

// Chat limit (Gemini calls cost money)
const chatLimiter   = createLimiter(1,  20,  'Chat rate limit reached. Max 20 messages per minute.');

module.exports = { authLimiter, uploadLimiter, apiLimiter, chatLimiter };
