const paymentService = require('../services/paymentService');
const { sendSuccess } = require('../utils/apiResponse');

const createRazorpayOrder = async (req, res, next) => {
  try {
    const paymentData = await paymentService.createRazorpayOrder(
      req.user._id,
      req.body.addressId,
      req.body.couponCode
    );
    return sendSuccess(res, 201, 'Razorpay order created successfully', paymentData);
  } catch (error) {
    next(error);
  }
};

const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const order = await paymentService.verifyRazorpayPayment(req.user._id, req.body);
    return sendSuccess(res, 200, 'Payment verified and order confirmed successfully', order);
  } catch (error) {
    next(error);
  }
};

const handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const result = await paymentService.handleWebhook(req.rawBody, signature, req.body);
    return res.status(200).json({ status: 'ok', result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
  handleWebhook,
};
