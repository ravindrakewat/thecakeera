import api from './api';

export const getProductReviews = async (productId, params = {}) => {
  const response = await api.get(`/products/${productId}/reviews`, { params });
  return response.data;
};

export const checkEligibility = async (productId) => {
  const response = await api.get(`/products/${productId}/review-eligibility`);
  return response.data;
};

export const createReview = async (productId, data) => {
  const response = await api.post(`/products/${productId}/reviews`, data);
  return response.data;
};

export const updateReview = async (id, data) => {
  const response = await api.patch(`/reviews/${id}`, data);
  return response.data;
};

export const deleteReview = async (id) => {
  const response = await api.delete(`/reviews/${id}`);
  return response.data;
};

export default {
  getProductReviews,
  checkEligibility,
  createReview,
  updateReview,
  deleteReview,
};
