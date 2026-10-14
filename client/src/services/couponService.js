import api from './api';

export const validateCoupon = async (code, cartItems = []) => {
  const response = await api.post('/coupons/validate', { code, cartItems });
  return response.data;
};

export default { validateCoupon };
