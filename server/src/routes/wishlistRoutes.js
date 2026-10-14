const express = require('express');
const router = express.Router();
const {
  getWishlist,
  addItem,
  removeItem,
  clearWishlist,
  mergeWishlist,
} = require('../controllers/wishlistController');
const { protect } = require('../middleware/authMiddleware');
const { preventCache } = require('../middleware/cacheMiddleware');
const { validateWishlistProduct, validateMergeWishlist } = require('../validators/wishlistValidator');
const { validateObjectId } = require('../validators/addressValidator');

// Strict anti-caching & Authentication required for all Wishlist operations
router.use(protect);
router.use(preventCache);

router.get('/', getWishlist);
router.post('/items/:productId', validateObjectId('productId'), addItem);
router.delete('/items/:productId', validateObjectId('productId'), removeItem);
router.delete('/', clearWishlist);
router.post('/merge', validateMergeWishlist, mergeWishlist);

module.exports = router;
