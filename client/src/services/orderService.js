import api from './api';

export const previewCheckout = async (addressId, couponCode = '') => {
  const response = await api.post('/orders/preview', { addressId, couponCode });
  return response.data;
};

export const checkoutPreview = previewCheckout;

export const createOrder = async ({ addressId, paymentMethod = 'COD', couponCode }) => {
  const response = await api.post('/orders', { addressId, paymentMethod, couponCode });
  return response.data;
};

export const verifyPayment = async (data) => {
  const response = await api.post('/payment/razorpay/verify', {
    razorpayOrderId: data.razorpay_order_id || data.razorpayOrderId,
    razorpayPaymentId: data.razorpay_payment_id || data.razorpayPaymentId,
    razorpaySignature: data.razorpay_signature || data.razorpaySignature,
  });
  return response.data;
};

export const getUserOrders = async (page = 1, limit = 10) => {
  const response = await api.get('/orders', { params: { page, limit } });
  return response.data;
};

export const getOrderByNumber = async (orderNumber) => {
  const response = await api.get(`/orders/${orderNumber}`);
  return response.data;
};

export const cancelOrder = async (orderNumber, reason = '') => {
  const response = await api.post(`/orders/${orderNumber}/cancel`, { reason });
  return response.data;
};

export const getShipment = async (orderNumber) => {
  const response = await api.get(`/orders/${orderNumber}/shipment`);
  return response.data;
};

export const downloadInvoice = async (orderNumber) => {
  const response = await api.get(`/orders/${orderNumber}/invoice`, {
    responseType: 'blob',
  });
  return response.data;
};

export const getInvoiceData = async (orderNumber) => {
  const response = await api.get(`/orders/${orderNumber}/invoice/data`);
  return response.data;
};

export default {
  previewCheckout,
  checkoutPreview,
  createOrder,
  verifyPayment,
  getUserOrders,
  getOrderByNumber,
  cancelOrder,
  getShipment,
  downloadInvoice,
  getInvoiceData,
};

