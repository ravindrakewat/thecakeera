import API from './api';

export const productService = {
  getProducts: async (params = {}) => {
    const response = await API.get('/products', { params });
    return response.data;
  },

  getProductBySlug: async (slug) => {
    const response = await API.get(`/products/${encodeURIComponent(slug)}`);
    return response.data;
  },

  getProductById: async (idOrSlug) => {
    const response = await API.get(`/products/${encodeURIComponent(idOrSlug)}`);
    return response.data;
  },

  // Admin Product API methods
  createProduct: async (productData) => {
    const response = await API.post('/products', productData);
    return response.data;
  },

  updateProduct: async (id, productData) => {
    const response = await API.patch(`/products/${id}`, productData);
    return response.data;
  },

  deleteProduct: async (id) => {
    const response = await API.delete(`/products/${id}`);
    return response.data;
  },

  updateInventory: async (id, inventoryData) => {
    const response = await API.patch(`/products/${id}/inventory`, inventoryData);
    return response.data;
  },

  getLowStock: async () => {
    const response = await API.get('/products/admin/low-stock');
    return response.data;
  },
};

export default productService;
