const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');

const validateWishlistProduct = (req, res, next) => {
  const productId = req.params.productId || req.body.productId;
  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    return next(new ApiError(400, 'Wishlist Validation Error', ['Valid Product ID is required']));
  }
  next();
};

const validateMergeWishlist = (req, res, next) => {
  const { productIds } = req.body;
  if (!productIds || !Array.isArray(productIds)) {
    return next(new ApiError(400, 'Wishlist Merge Validation Error', ['Product IDs array is required']));
  }
  next();
};

module.exports = {
  validateWishlistProduct,
  validateMergeWishlist,
};
