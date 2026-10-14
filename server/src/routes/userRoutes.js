const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  changePassword,
  getUsers,
} = require('../controllers/userController');
const {
  createAddress,
  getMyAddresses,
  getAddressById,
  updateAddress,
  deleteAddress,
} = require('../controllers/addressController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { preventCache } = require('../middleware/cacheMiddleware');
const { validateProfileUpdate } = require('../validators/userValidator');
const { validateChangePassword } = require('../validators/authValidator');
const { validateAddress, validateObjectId } = require('../validators/addressValidator');

// Strict anti-caching for user profile & address endpoints
router.use(preventCache);

// User Profile Routes
router.get('/me', protect, getProfile);
router.patch('/me', protect, validateProfileUpdate, updateProfile);
router.patch('/me/password', protect, validateChangePassword, changePassword);

// User Address CRUD Routes (supports both /me/addresses and /addresses)
router.post(['/me/addresses', '/addresses'], protect, validateAddress, createAddress);
router.get(['/me/addresses', '/addresses'], protect, getMyAddresses);
router.get(['/me/addresses/:id', '/addresses/:id'], protect, validateObjectId('id'), getAddressById);
router.patch(['/me/addresses/:id', '/addresses/:id'], protect, validateObjectId('id'), updateAddress);
router.put(['/me/addresses/:id', '/addresses/:id'], protect, validateObjectId('id'), updateAddress);
router.delete(['/me/addresses/:id', '/addresses/:id'], protect, validateObjectId('id'), deleteAddress);

// Admin-only User Management
router.get('/', protect, authorizeRoles('admin'), getUsers);

module.exports = router;
