const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');

const PINCODE_REGEX = /^\d{6}$/; // Standard 6-digit Indian Pincode

const validateAddress = (req, res, next) => {
  const { fullName, phone, addressLine1, city, state, pincode } = req.body;
  const errors = [];

  if (!fullName || typeof fullName !== 'string' || fullName.trim().length === 0) {
    errors.push('Full name is required');
  }
  if (!phone || typeof phone !== 'string' || phone.trim().length < 10) {
    errors.push('Valid phone number is required');
  }
  if (!addressLine1 || typeof addressLine1 !== 'string' || addressLine1.trim().length === 0) {
    errors.push('Address Line 1 is required');
  }
  if (!city || typeof city !== 'string' || city.trim().length === 0) {
    errors.push('City is required');
  }
  if (!state || typeof state !== 'string' || state.trim().length === 0) {
    errors.push('State is required');
  }
  if (!pincode || !PINCODE_REGEX.test(pincode.trim())) {
    errors.push('Valid 6-digit Indian pincode is required');
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Address Validation Error', errors));
  }
  next();
};

const validateObjectId = (paramName = 'id') => (req, res, next) => {
  const id = req.params[paramName];
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return next(new ApiError(400, `Invalid ID format for parameter: ${paramName}`));
  }
  next();
};

module.exports = {
  validateAddress,
  validateObjectId,
};
