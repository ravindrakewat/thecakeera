import API from './api';

export const wishlistService = {
  getWishlist: async () => {
    const response = await API.get('/wishlist');
    return response.data;
  },

  addToWishlist: async (productId) => {
    const response = await API.post(`/wishlist/items/${productId}`);
    return response.data;
  },

  removeFromWishlist: async (productId) => {
    const response = await API.delete(`/wishlist/items/${productId}`);
    return response.data;
  },

  clearWishlist: async () => {
    const response = await API.delete('/wishlist');
    return response.data;
  },

  mergeWishlist: async (productIds) => {
    const response = await API.post('/wishlist/merge', { productIds });
    return response.data;
  },
};
