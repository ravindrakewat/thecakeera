import api from './api';

export const createRazorpayOrder = async (addressId, couponCode = '') => {
  const response = await api.post('/payment/razorpay/create-order', { addressId, couponCode });
  return response.data;
};

export const verifyRazorpayPayment = async ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
  const response = await api.post('/payment/razorpay/verify', {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });
  return response.data;
};

export default {
  createRazorpayOrder,
  verifyRazorpayPayment,
};
