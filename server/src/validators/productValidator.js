const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');

const ALLOWED_PRODUCT_FIELDS = [
  'name',
  'slug',
  'shortDescription',
  'description',
  'brand',
  'category',
  'subCategory',
  'sku',
  'mrp',
  'sellingPrice',
  'costPrice',
  'stockQuantity',
  'lowStockThreshold',
  'trackInventory',
  'thumbnail',
  'images',
  'ingredients',
  'benefits',
  'howToUse',
  'nutritionalInformation',
  'disclaimer',
  'allergenInformation',
  'seoTitle',
  'seoDescription',
  'seoKeywords',
  'isActive',
  'isFeatured',
  'fssaiNumber',
  'countryOfOrigin',
  'showBotanicalShowcase',
  'botanicalSubtitle',
  'botanicalTitle',
  'botanicalAnimatedImage',
  'showPromoSlider',
  'promoSliderImages',
];

const validateProductCreate = (req, res, next) => {
  const { name, category, sku, mrp, sellingPrice, costPrice, stockQuantity } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Product name is required');
  }
  if (!sku || typeof sku !== 'string' || sku.trim().length === 0) {
    errors.push('Product SKU is required');
  }
  if (!category || !mongoose.Types.ObjectId.isValid(category)) {
    errors.push('Valid Category ID is required');
  }
  if (mrp === undefined || typeof mrp !== 'number' || mrp < 0) {
    errors.push('MRP must be a non-negative number');
  }
  if (sellingPrice === undefined || typeof sellingPrice !== 'number' || sellingPrice < 0) {
    errors.push('Selling price must be a non-negative number');
  }
  if (mrp !== undefined && sellingPrice !== undefined && sellingPrice > mrp) {
    errors.push('Selling price cannot be greater than MRP');
  }
  if (costPrice !== undefined && (typeof costPrice !== 'number' || costPrice < 0)) {
    errors.push('Cost price cannot be a negative number');
  }
  if (stockQuantity !== undefined && (typeof stockQuantity !== 'number' || stockQuantity < 0)) {
    errors.push('Stock quantity cannot be a negative number');
  }

  // Mass assignment protection check
  const reqKeys = Object.keys(req.body);
  const invalidFields = reqKeys.filter((key) => !ALLOWED_PRODUCT_FIELDS.includes(key));
  if (invalidFields.length > 0) {
    errors.push(`Disallowed system fields present in request: ${invalidFields.join(', ')}`);
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Product Validation Error', errors));
  }
  next();
};

const validateProductUpdate = (req, res, next) => {
  const { category, subCategory, mrp, sellingPrice, costPrice, stockQuantity } = req.body;
  const errors = [];

  if (category && !mongoose.Types.ObjectId.isValid(category)) {
    errors.push('Invalid Category ID format');
  }
  if (subCategory && !mongoose.Types.ObjectId.isValid(subCategory)) {
    errors.push('Invalid Sub-Category ID format');
  }
  if (mrp !== undefined && (typeof mrp !== 'number' || mrp < 0)) {
    errors.push('MRP must be a non-negative number');
  }
  if (sellingPrice !== undefined && (typeof sellingPrice !== 'number' || sellingPrice < 0)) {
    errors.push('Selling price must be a non-negative number');
  }
  if (mrp !== undefined && sellingPrice !== undefined && sellingPrice > mrp) {
    errors.push('Selling price cannot be greater than MRP');
  }
  if (costPrice !== undefined && (typeof costPrice !== 'number' || costPrice < 0)) {
    errors.push('Cost price cannot be a negative number');
  }
  if (stockQuantity !== undefined && (typeof stockQuantity !== 'number' || stockQuantity < 0)) {
    errors.push('Stock quantity cannot be a negative number');
  }

  // Mass assignment protection check
  const reqKeys = Object.keys(req.body);
  const invalidFields = reqKeys.filter((key) => !ALLOWED_PRODUCT_FIELDS.includes(key));
  if (invalidFields.length > 0) {
    errors.push(`Disallowed system fields present in request: ${invalidFields.join(', ')}`);
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Product Update Validation Error', errors));
  }
  next();
};

const validateInventoryUpdate = (req, res, next) => {
  const { stockQuantity, adjustment } = req.body;
  const errors = [];

  if (stockQuantity === undefined && adjustment === undefined) {
    errors.push('Either stockQuantity or adjustment must be provided');
  }
  if (stockQuantity !== undefined && (typeof stockQuantity !== 'number' || stockQuantity < 0)) {
    errors.push('Stock quantity must be a non-negative number');
  }
  if (adjustment !== undefined && typeof adjustment !== 'number') {
    errors.push('Stock adjustment must be a number');
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Inventory Validation Error', errors));
  }
  next();
};

module.exports = {
  validateProductCreate,
  validateProductUpdate,
  validateInventoryUpdate,
};
