const express = require('express');
const router = express.Router();
const {
  createRazorpayOrder,
  verifyRazorpayPayment,
  handleWebhook,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { preventCache } = require('../middleware/cacheMiddleware');
const { validatePreviewOrder } = require('../validators/orderValidator');

// Public Webhook route (signature authenticated)
router.post('/razorpay/webhook', preventCache, handleWebhook);

// Protected Razorpay payment routes
router.use(protect);
router.use(preventCache);

router.post('/razorpay/create-order', validatePreviewOrder, createRazorpayOrder);
router.post('/razorpay/verify', verifyRazorpayPayment);

module.exports = router;
