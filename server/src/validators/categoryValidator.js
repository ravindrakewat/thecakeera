const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');

const ALLOWED_CATEGORY_FIELDS = [
  'name',
  'slug',
  'description',
  'image',
  'parentCategory',
  'sortOrder',
  'seoTitle',
  'seoDescription',
  'isActive',
];

const validateCategoryCreate = (req, res, next) => {
  const { name, parentCategory } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Category name is required');
  }

  if (parentCategory && !mongoose.Types.ObjectId.isValid(parentCategory)) {
    errors.push('Invalid parent category ID format');
  }

  // Mass assignment protection check
  const reqKeys = Object.keys(req.body);
  const invalidFields = reqKeys.filter((key) => !ALLOWED_CATEGORY_FIELDS.includes(key));
  if (invalidFields.length > 0) {
    errors.push(`Disallowed fields present in request: ${invalidFields.join(', ')}`);
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Category Validation Error', errors));
  }
  next();
};

const validateCategoryUpdate = (req, res, next) => {
  const { parentCategory } = req.body;
  const errors = [];

  const categoryId = req.params.id;
  if (parentCategory && parentCategory.toString() === categoryId.toString()) {
    errors.push('Category cannot be its own parent category');
  }

  if (parentCategory && !mongoose.Types.ObjectId.isValid(parentCategory)) {
    errors.push('Invalid parent category ID format');
  }

  // Mass assignment protection check
  const reqKeys = Object.keys(req.body);
  const invalidFields = reqKeys.filter((key) => !ALLOWED_CATEGORY_FIELDS.includes(key));
  if (invalidFields.length > 0) {
    errors.push(`Disallowed fields present in request: ${invalidFields.join(', ')}`);
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Category Update Validation Error', errors));
  }
  next();
};

module.exports = {
  validateCategoryCreate,
  validateCategoryUpdate,
};
