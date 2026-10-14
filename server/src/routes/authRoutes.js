const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  refreshTokenHandler,
  getMe,
  logoutUser,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { preventCache } = require('../middleware/cacheMiddleware');
const { authLimiter } = require('../middleware/securityMiddleware');
const {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
} = require('../validators/authValidator');

// Strict anti-caching for all authentication routes
router.use(preventCache);

router.post('/register', authLimiter, validateRegister, registerUser);
router.post('/login', authLimiter, validateLogin, loginUser);
router.post('/refresh', refreshTokenHandler);
router.get('/me', protect, getMe);
router.post('/logout', logoutUser);
router.post('/forgot-password', authLimiter, validateForgotPassword, forgotPassword);
router.post('/reset-password', authLimiter, validateResetPassword, resetPassword);

module.exports = router;
