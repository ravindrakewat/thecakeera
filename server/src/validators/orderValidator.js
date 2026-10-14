const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');

const validatePreviewOrder = (req, res, next) => {
  const { addressId } = req.body;
  if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
    return next(new ApiError(400, 'Order Validation Error', ['Valid addressId is required']));
  }
  next();
};

const validateCreateOrder = (req, res, next) => {
  const { addressId, paymentMethod } = req.body;
  const errors = [];

  if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
    errors.push('Valid addressId is required');
  }

  if (paymentMethod && !['ONLINE', 'COD'].includes(paymentMethod)) {
    errors.push('Payment method must be ONLINE or COD');
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Order Validation Error', errors));
  }
  next();
};

module.exports = {
  validatePreviewOrder,
  validateCreateOrder,
};
