import API from './api';

export const bannerService = {
  getPublicBanners: async () => {
    const response = await API.get('/banners');
    return response.data;
  },
};

export default bannerService;
