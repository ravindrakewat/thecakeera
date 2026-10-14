const express = require('express');
const router = express.Router();
const {
  getProductReviews,
  checkEligibility,
  createReview,
  updateReview,
  deleteReview,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { preventCache } = require('../middleware/cacheMiddleware');

// Review Modification Routes
router.patch('/:id', protect, preventCache, updateReview);
router.delete('/:id', protect, preventCache, deleteReview);

module.exports = router;
