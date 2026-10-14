const express = require('express');
const router = express.Router();
const { validateCoupon } = require('../controllers/couponController');
const { protect } = require('../middleware/authMiddleware');
const { preventCache } = require('../middleware/cacheMiddleware');

router.use(protect);
router.use(preventCache);

router.post('/validate', validateCoupon);

module.exports = router;
