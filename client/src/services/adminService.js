import api from './api';

export const getDashboardMetrics = async () => {
  const response = await api.get('/admin/dashboard');
  return response.data;
};

export const getRevenueTrend = async (period = '30d') => {
  const response = await api.get('/admin/dashboard/revenue', { params: { period } });
  return response.data;
};

export const getAdminProducts = async (params = {}) => {
  const response = await api.get('/admin/products', { params });
  return response.data;
};

export const getAdminInventory = async (params = {}) => {
  const response = await api.get('/admin/inventory', { params });
  return response.data;
};

export const updateAdminInventory = async (id, data) => {
  const response = await api.patch(`/admin/inventory/${id}`, data);
  return response.data;
};

export const getAdminOrders = async (params = {}) => {
  const response = await api.get('/admin/orders', { params });
  return response.data;
};

export const getAdminOrderDetail = async (orderNumber) => {
  const response = await api.get(`/admin/orders/${orderNumber}`);
  return response.data;
};

export const updateAdminOrderStatus = async (orderNumber, data) => {
  const response = await api.patch(`/admin/orders/${orderNumber}/status`, data);
  return response.data;
};

export const getAdminCustomers = async (params = {}) => {
  const response = await api.get('/admin/customers', { params });
  return response.data;
};

export const getAdminCustomerDetail = async (id) => {
  const response = await api.get(`/admin/customers/${id}`);
  return response.data;
};

export const toggleCustomerStatus = async (id, isActive) => {
  const response = await api.patch(`/admin/customers/${id}/status`, { isActive });
  return response.data;
};

export const getAdminCoupons = async () => {
  const response = await api.get('/admin/coupons');
  return response.data;
};

export const createAdminCoupon = async (data) => {
  const response = await api.post('/admin/coupons', data);
  return response.data;
};

export const updateAdminCoupon = async (id, data) => {
  const response = await api.patch(`/admin/coupons/${id}`, data);
  return response.data;
};

export const deleteAdminCoupon = async (id) => {
  const response = await api.delete(`/admin/coupons/${id}`);
  return response.data;
};

export const getAdminReviews = async () => {
  const response = await api.get('/admin/reviews');
  return response.data;
};

export const updateReviewStatus = async (id, status) => {
  const response = await api.patch(`/admin/reviews/${id}/status`, { status });
  return response.data;
};

export const deleteAdminReview = async (id) => {
  const response = await api.delete(`/admin/reviews/${id}`);
  return response.data;
};

export const deleteReview = deleteAdminReview;

export const getAdminBanners = async () => {
  const response = await api.get('/admin/banners');
  return response.data;
};

export const createAdminBanner = async (data) => {
  const response = await api.post('/admin/banners', data);
  return response.data;
};

export const updateAdminBanner = async (id, data) => {
  const response = await api.patch(`/admin/banners/${id}`, data);
  return response.data;
};

export const deleteAdminBanner = async (id) => {
  const response = await api.delete(`/admin/banners/${id}`);
  return response.data;
};

export const getSalesReport = async (from, to) => {
  const response = await api.get('/admin/reports/sales', { params: { from, to } });
  return response.data;
};

export const getInventoryReport = async () => {
  const response = await api.get('/admin/reports/inventory');
  return response.data;
};

export const getAdminSettings = async () => {
  const response = await api.get('/admin/settings');
  return response.data;
};

export const updateAdminSettings = async (data) => {
  const response = await api.patch('/admin/settings', data);
  return response.data;
};

// Shipments & Fulfillment
export const getAdminShipments = async (params = {}) => {
  const response = await api.get('/admin/shipments', { params });
  return response.data;
};

export const getAdminShipmentDetail = async (id) => {
  const response = await api.get(`/admin/shipments/${id}`);
  return response.data;
};

export const createAdminShipment = async (orderNumber, data) => {
  const response = await api.post(`/admin/orders/${orderNumber}/shipments`, data);
  return response.data;
};

export const updateAdminShipment = async (id, data) => {
  const response = await api.patch(`/admin/shipments/${id}`, data);
  return response.data;
};

export const dispatchAdminShipment = async (id, data = {}) => {
  const response = await api.post(`/admin/shipments/${id}/dispatch`, data);
  return response.data;
};

export const deliverAdminShipment = async (id, data = {}) => {
  const response = await api.post(`/admin/shipments/${id}/deliver`, data);
  return response.data;
};

// Invoices
export const getAdminInvoices = async (params = {}) => {
  const response = await api.get('/admin/invoices', { params });
  return response.data;
};

export const getAdminOrderInvoice = async (orderNumber) => {
  const response = await api.get(`/admin/orders/${orderNumber}/invoice`);
  return response.data;
};

export const downloadAdminOrderInvoice = async (orderNumber) => {
  const response = await api.get(`/admin/orders/${orderNumber}/invoice/download`, {
    responseType: 'blob',
  });
  return response.data;
};

export default {
  getDashboardMetrics,
  getRevenueTrend,
  getAdminProducts,
  getAdminInventory,
  updateAdminInventory,
  getAdminOrders,
  getAdminOrderDetail,
  updateAdminOrderStatus,
  getAdminCustomers,
  getAdminCustomerDetail,
  toggleCustomerStatus,
  getAdminCoupons,
  createAdminCoupon,
  updateAdminCoupon,
  deleteAdminCoupon,
  getAdminReviews,
  updateReviewStatus,
  deleteAdminReview,
  deleteReview: deleteAdminReview,
  getAdminBanners,
  createAdminBanner,
  updateAdminBanner,
  deleteAdminBanner,
  getSalesReport,
  getInventoryReport,
  getAdminSettings,
  updateAdminSettings,
  getAdminShipments,
  getAdminShipmentDetail,
  createAdminShipment,
  updateAdminShipment,
  dispatchAdminShipment,
  deliverAdminShipment,
  getAdminInvoices,
  getAdminOrderInvoice,
  downloadAdminOrderInvoice,
};

