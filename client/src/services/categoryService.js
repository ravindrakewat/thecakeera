import API from './api';

export const categoryService = {
  getPublicCategories: async () => {
    const response = await API.get('/categories/public');
    return response.data;
  },

  getPublicCategoryBySlug: async (slug) => {
    const response = await API.get(`/categories/public/${slug}`);
    return response.data;
  },

  // Admin Category API methods
  getAllCategoriesAdmin: async () => {
    const response = await API.get('/categories');
    return response.data;
  },

  getAllCategories: async () => {
    const response = await API.get('/categories');
    return response.data;
  },

  getCategories: async () => {
    const response = await API.get('/categories');
    return response.data;
  },

  getCategoryById: async (id) => {
    const response = await API.get(`/categories/${id}`);
    return response.data;
  },

  createCategory: async (categoryData) => {
    const response = await API.post('/categories', categoryData);
    return response.data;
  },

  updateCategory: async (id, categoryData) => {
    const response = await API.patch(`/categories/${id}`, categoryData);
    return response.data;
  },

  deleteCategory: async (id) => {
    const response = await API.delete(`/categories/${id}`);
    return response.data;
  },
};

export default categoryService;
