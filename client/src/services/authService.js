import API from './api';

export const authService = {
  register: async (userData) => {
    const response = await API.post('/auth/register', userData);
    if (response.data.data?.accessToken) {
      localStorage.setItem('accessToken', response.data.data.accessToken);
    }
    return response.data;
  },

  login: async (credentials) => {
    const response = await API.post('/auth/login', credentials);
    if (response.data.data?.accessToken) {
      localStorage.setItem('accessToken', response.data.data.accessToken);
    }
    return response.data;
  },

  logout: async () => {
    try {
      await API.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
    }
  },

  getMe: async () => {
    const response = await API.get('/auth/me');
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await API.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (data) => {
    const response = await API.post('/auth/reset-password', data);
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await API.patch('/users/me', profileData);
    return response.data;
  },

  changePassword: async (passwordData) => {
    const response = await API.patch('/users/me/password', passwordData);
    return response.data;
  },

  getAddresses: async () => {
    const response = await API.get('/users/me/addresses');
    return response.data;
  },

  addAddress: async (addressData) => {
    const response = await API.post('/users/me/addresses', addressData);
    return response.data;
  },

  updateAddress: async (id, addressData) => {
    const response = await API.patch(`/users/me/addresses/${id}`, addressData);
    return response.data;
  },

  deleteAddress: async (id) => {
    const response = await API.delete(`/users/me/addresses/${id}`);
    return response.data;
  },
};
