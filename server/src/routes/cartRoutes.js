const express = require('express');
const router = express.Router();
const {
  getCart,
  addItem,
  updateQuantity,
  removeItem,
  clearCart,
  mergeCart,
} = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');
const { preventCache } = require('../middleware/cacheMiddleware');
const {
  validateAddCartItem,
  validateUpdateCartQuantity,
  validateMergeCart,
} = require('../validators/cartValidator');
const { validateObjectId } = require('../validators/addressValidator');

// Strict anti-caching & Authentication required for all Cart operations
router.use(protect);
router.use(preventCache);

router.get('/', getCart);
router.post('/items', validateAddCartItem, addItem);
router.patch('/items/:productId', validateObjectId('productId'), validateUpdateCartQuantity, updateQuantity);
router.delete('/items/:productId', validateObjectId('productId'), removeItem);
router.delete('/', clearCart);
router.post('/merge', validateMergeCart, mergeCart);

module.exports = router;
