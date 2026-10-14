const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// General API Rate limiter: 100 requests per 15 minutes per IP (1000 in dev)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});

// Stricter Rate limiter for Auth endpoints (Login, Register, Forgot/Reset Password)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 15 : 100, // Allows up to 15 auth attempts in production
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

module.exports = {
  helmetMiddleware: helmet(),
  apiLimiter,
  authLimiter,
};
