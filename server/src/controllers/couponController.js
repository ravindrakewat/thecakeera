const couponService = require('../services/couponService');
const { sendSuccess } = require('../utils/apiResponse');

const validateCoupon = async (req, res, next) => {
  try {
    const { code, cartItems } = req.body;
    const result = await couponService.validateCoupon(req.user._id, code, cartItems);
    return sendSuccess(res, 200, 'Coupon validated successfully', result);
  } catch (error) {
    next(error);
  }
};

module.exports = { validateCoupon };
