const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  updateInventory,
  getLowStockProducts,
} = require('../controllers/productController');
const {
  getProductReviews,
  checkEligibility,
  createReview,
} = require('../controllers/reviewController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { setCacheHeaders, preventCache } = require('../middleware/cacheMiddleware');
const {
  validateProductCreate,
  validateProductUpdate,
  validateInventoryUpdate,
} = require('../validators/productValidator');
const { validateProductQueryParams } = require('../validators/queryValidator');
const { validateObjectId } = require('../validators/addressValidator');

// Public Product Catalog Routes
router.get('/', validateProductQueryParams, setCacheHeaders(300), getProducts);
router.get('/admin/low-stock', protect, authorizeRoles('admin'), preventCache, getLowStockProducts);

// Product Review Routes
router.get('/:productId/reviews', validateObjectId('productId'), getProductReviews);
router.get('/:productId/review-eligibility', protect, preventCache, validateObjectId('productId'), checkEligibility);
router.post('/:productId/reviews', protect, preventCache, validateObjectId('productId'), createReview);

// Public Product Details Route
router.get('/:slug', setCacheHeaders(300), getProductBySlug);

// Admin-Only Product Management Routes
router.post('/', protect, authorizeRoles('admin'), preventCache, validateProductCreate, createProduct);
router.patch('/:id', protect, authorizeRoles('admin'), preventCache, validateObjectId('id'), validateProductUpdate, updateProduct);
router.delete('/:id', protect, authorizeRoles('admin'), preventCache, validateObjectId('id'), deleteProduct);
router.patch('/:id/status', protect, authorizeRoles('admin'), preventCache, validateObjectId('id'), toggleProductStatus);
router.patch('/:id/inventory', protect, authorizeRoles('admin'), preventCache, validateObjectId('id'), validateInventoryUpdate, updateInventory);

module.exports = router;
