import api from './api';

export const getAddresses = async () => {
  const response = await api.get('/users/me/addresses');
  return response.data;
};

export const addAddress = async (addressData) => {
  const response = await api.post('/users/me/addresses', addressData);
  return response.data;
};

export const createAddress = addAddress;

export const updateAddress = async (addressId, addressData) => {
  const response = await api.patch(`/users/me/addresses/${addressId}`, addressData);
  return response.data;
};

export const deleteAddress = async (addressId) => {
  const response = await api.delete(`/users/me/addresses/${addressId}`);
  return response.data;
};

export default {
  getAddresses,
  addAddress,
  createAddress,
  updateAddress,
  deleteAddress,
};
