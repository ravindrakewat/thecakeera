const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');

const ALLOWED_CART_ITEM_FIELDS = ['productId', 'quantity'];

const validateAddCartItem = (req, res, next) => {
  const { productId, quantity } = req.body;
  const errors = [];

  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    errors.push('Valid Product ID is required');
  }

  const parsedQty = parseInt(quantity);
  if (quantity === undefined || isNaN(parsedQty) || parsedQty < 1 || !Number.isInteger(parsedQty)) {
    errors.push('Quantity must be an integer >= 1');
  }

  // Mass assignment protection
  const reqKeys = Object.keys(req.body);
  const invalidFields = reqKeys.filter((k) => !ALLOWED_CART_ITEM_FIELDS.includes(k));
  if (invalidFields.length > 0) {
    errors.push(`Disallowed fields present in request: ${invalidFields.join(', ')}`);
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Cart Validation Error', errors));
  }
  next();
};

const validateUpdateCartQuantity = (req, res, next) => {
  const { quantity } = req.body;
  const parsedQty = parseInt(quantity);

  if (quantity === undefined || isNaN(parsedQty) || parsedQty < 1 || !Number.isInteger(parsedQty)) {
    return next(new ApiError(400, 'Cart Validation Error', ['Quantity must be an integer >= 1']));
  }

  const reqKeys = Object.keys(req.body);
  if (reqKeys.some((k) => k !== 'quantity')) {
    return next(new ApiError(400, 'Cart Validation Error', ['Only quantity field may be updated']));
  }

  next();
};

const validateMergeCart = (req, res, next) => {
  const { items } = req.body;
  if (!items || !Array.isArray(items)) {
    return next(new ApiError(400, 'Cart Merge Validation Error', ['Items array is required']));
  }
  next();
};

module.exports = {
  validateAddCartItem,
  validateUpdateCartQuantity,
  validateMergeCart,
};
