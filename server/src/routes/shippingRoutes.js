const express = require('express');
const router = express.Router();
const { checkServiceability } = require('../controllers/shippingController');
const { handleShippingWebhook } = require('../services/shippingWebhookService');
const { preventCache } = require('../middleware/cacheMiddleware');
const { sendSuccess } = require('../utils/apiResponse');

// Public Serviceability check endpoint for storefront & checkout
router.use(preventCache);
router.post('/serviceability', checkServiceability);

// Secure Tracking Webhook endpoint (Requires provider signature)
router.post('/webhook', async (req, res, next) => {
  try {
    const signature = req.headers['x-shipping-signature'] || req.headers['x-provider-signature'];
    const result = await handleShippingWebhook(req.rawBody, signature, req.body);
    return sendSuccess(res, 200, 'Webhook processed successfully', result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

