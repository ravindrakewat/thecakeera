const ApiError = require('../utils/ApiError');

const ALLOWED_SORT_OPTIONS = ['newest', 'oldest', 'priceLow', 'priceHigh', 'rating', 'popular'];

const validateProductQueryParams = (req, res, next) => {
  const { minPrice, maxPrice, minRating, sort, page, limit } = req.query;
  const errors = [];

  if (minPrice !== undefined) {
    const val = parseFloat(minPrice);
    if (isNaN(val) || val < 0) errors.push('minPrice must be a non-negative number');
  }

  if (maxPrice !== undefined) {
    const val = parseFloat(maxPrice);
    if (isNaN(val) || val < 0) errors.push('maxPrice must be a non-negative number');
  }

  if (minPrice !== undefined && maxPrice !== undefined) {
    if (parseFloat(minPrice) > parseFloat(maxPrice)) {
      errors.push('minPrice cannot be greater than maxPrice');
    }
  }

  if (minRating !== undefined) {
    const val = parseFloat(minRating);
    if (isNaN(val) || val < 0 || val > 5) {
      errors.push('minRating must be a number between 0 and 5');
    }
  }

  if (sort && !ALLOWED_SORT_OPTIONS.includes(sort)) {
    errors.push(`Invalid sort option '${sort}'. Allowed options: ${ALLOWED_SORT_OPTIONS.join(', ')}`);
  }

  if (page !== undefined) {
    const val = parseInt(page);
    if (isNaN(val) || val < 1) errors.push('page must be an integer >= 1');
  }

  if (limit !== undefined) {
    const val = parseInt(limit);
    if (isNaN(val) || val < 1 || val > 50) errors.push('limit must be an integer between 1 and 50');
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Invalid Query Parameters', errors));
  }
  next();
};

module.exports = {
  validateProductQueryParams,
  ALLOWED_SORT_OPTIONS,
};
