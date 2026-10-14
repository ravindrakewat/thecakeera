import api from './api';

export const checkServiceability = async (pincode, subtotal = 0, paymentMethod = 'ONLINE') => {
  const response = await api.post('/shipping/serviceability', {
    pincode,
    subtotal,
    paymentMethod,
  });
  return response.data;
};

export default {
  checkServiceability,
};
