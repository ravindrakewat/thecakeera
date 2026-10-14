const express = require('express');
const router = express.Router();
const { Banner } = require('../models');
const { sendSuccess } = require('../utils/apiResponse');

// GET /api/banners — Public list of active promotional banners
router.get('/', async (req, res, next) => {
  try {
    const banners = await Banner.find({ isActive: true })
      .sort({ position: 1, createdAt: -1 })
      .lean();
    return sendSuccess(res, 200, 'Banners fetched successfully', banners);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
