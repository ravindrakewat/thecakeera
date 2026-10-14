const ApiError = require('../utils/ApiError');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/; // Standard 10-digit Indian mobile number
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const validateRegister = (req, res, next) => {
  const { firstName, lastName, email, phone, password } = req.body;
  const errors = [];

  if (!firstName || typeof firstName !== 'string' || firstName.trim().length === 0) {
    errors.push('First name is required');
  }
  if (!lastName || typeof lastName !== 'string' || lastName.trim().length === 0) {
    errors.push('Last name is required');
  }
  if (!email || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email address is required');
  }
  if (!phone || !PHONE_REGEX.test(phone.trim())) {
    errors.push('A valid 10-digit phone number starting with 6-9 is required');
  }
  if (!password || !PASSWORD_REGEX.test(password)) {
    errors.push('Password must be at least 8 characters long and contain uppercase, lowercase, and a number');
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Validation Failure', errors));
  }
  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !EMAIL_REGEX.test(email.trim())) {
    errors.push('Valid email is required');
  }
  if (!password) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Validation Failure', errors));
  }
  next();
};

const validateForgotPassword = (req, res, next) => {
  const { email } = req.body;
  if (!email || !EMAIL_REGEX.test(email.trim())) {
    return next(new ApiError(400, 'Validation Failure', ['Valid email is required']));
  }
  next();
};

const validateResetPassword = (req, res, next) => {
  const { token, password } = req.body;
  const errors = [];

  if (!token || typeof token !== 'string') {
    errors.push('Reset token is required');
  }
  if (!password || !PASSWORD_REGEX.test(password)) {
    errors.push('New password must be at least 8 characters long and contain uppercase, lowercase, and a number');
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Validation Failure', errors));
  }
  next();
};

const validateChangePassword = (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const errors = [];

  if (!currentPassword) {
    errors.push('Current password is required');
  }
  if (!newPassword || !PASSWORD_REGEX.test(newPassword)) {
    errors.push('New password must be at least 8 characters long and contain uppercase, lowercase, and a number');
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Validation Failure', errors));
  }
  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateChangePassword,
};
