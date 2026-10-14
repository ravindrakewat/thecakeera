const express = require('express');
const router = express.Router();
const {
  getPublicCategories,
  getPublicCategoryBySlug,
  getAllCategoriesAdmin,
  getCategoryByIdAdmin,
  createCategory,
  updateCategory,
  toggleCategoryStatus,
  deleteCategory,
} = require('../controllers/categoryController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { setCacheHeaders, preventCache } = require('../middleware/cacheMiddleware');
const { validateCategoryCreate, validateCategoryUpdate } = require('../validators/categoryValidator');
const { validateObjectId } = require('../validators/addressValidator');

// Public Category Routes (Cached for performance)
router.get('/public', setCacheHeaders(300), getPublicCategories);
router.get('/public/:slug', setCacheHeaders(300), getPublicCategoryBySlug);

// Admin-Only Category Management Routes (Strict anti-caching & Admin Authorization)
router.get('/', protect, authorizeRoles('admin'), preventCache, getAllCategoriesAdmin);
router.get('/:id', protect, authorizeRoles('admin'), preventCache, validateObjectId('id'), getCategoryByIdAdmin);
router.post('/', protect, authorizeRoles('admin'), preventCache, validateCategoryCreate, createCategory);
router.patch('/:id', protect, authorizeRoles('admin'), preventCache, validateObjectId('id'), validateCategoryUpdate, updateCategory);
router.patch('/:id/status', protect, authorizeRoles('admin'), preventCache, validateObjectId('id'), toggleCategoryStatus);
router.delete('/:id', protect, authorizeRoles('admin'), preventCache, validateObjectId('id'), deleteCategory);

module.exports = router;
