import API from './api';

export const cartService = {
  getCart: async () => {
    const response = await API.get('/cart');
    return response.data;
  },

  addToCart: async (productId, quantity = 1) => {
    const response = await API.post('/cart/items', { productId, quantity });
    return response.data;
  },

  updateCartItem: async (productId, quantity) => {
    const response = await API.patch(`/cart/items/${productId}`, { quantity });
    return response.data;
  },

  removeCartItem: async (productId) => {
    const response = await API.delete(`/cart/items/${productId}`);
    return response.data;
  },

  clearCart: async () => {
    const response = await API.delete('/cart');
    return response.data;
  },

  mergeCart: async (items) => {
    const response = await API.post('/cart/merge', { items });
    return response.data;
  },
};
