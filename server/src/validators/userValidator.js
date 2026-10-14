const ApiError = require('../utils/ApiError');

const validateProfileUpdate = (req, res, next) => {
  const { firstName, lastName, phone, role, email, admin } = req.body;
  const errors = [];

  // Prevent users from tampering with role or email directly via profile update
  if (role !== undefined || admin !== undefined) {
    errors.push('Role and privileges cannot be updated via profile update');
  }
  if (email !== undefined) {
    errors.push('Email update must be handled via dedicated email change endpoint');
  }

  if (firstName !== undefined && (typeof firstName !== 'string' || firstName.trim().length === 0)) {
    errors.push('First name cannot be empty');
  }
  if (lastName !== undefined && (typeof lastName !== 'string' || lastName.trim().length === 0)) {
    errors.push('Last name cannot be empty');
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Profile Validation Error', errors));
  }
  next();
};

module.exports = {
  validateProfileUpdate,
};
