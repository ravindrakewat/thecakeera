import axios from 'axios';

// Helper to resolve the correct API base URL
export const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Production fallback: automatically connect to live Render API
  if (import.meta.env.PROD) {
    return 'https://api.anchara.com/api';
  }
  // Local development fallback
  return 'http://localhost:5000/api';
};

const API = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
});

// Request interceptor: Attach JWT Access Token
API.interceptors.request.use(
  (config) => {
    // Ensure base URL is always synchronized
    if (!config.baseURL) {
      config.baseURL = getApiBaseUrl();
    }
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Endpoints that should never trigger automatic token refresh
const isAuthEndpoint = (url = '') => {
  const normalized = typeof url === 'string' ? url : '';
  return (
    normalized.includes('/auth/login') ||
    normalized.includes('/auth/register') ||
    normalized.includes('/auth/refresh') ||
    normalized.includes('/auth/forgot-password') ||
    normalized.includes('/auth/reset-password')
  );
};

// Single-flight refresh state
let refreshPromise = null;

const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const baseURL = getApiBaseUrl();
        const refreshResponse = await axios.post(
          `${baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = refreshResponse.data?.data?.accessToken;
        if (newToken) {
          localStorage.setItem('accessToken', newToken);
          return newToken;
        }
        throw new Error('Refresh response missing access token');
      } catch (err) {
        localStorage.removeItem('accessToken');
        throw err;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
};

// Response interceptor: Automatic single-flight 401 refresh token attempt
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Guard against missing response or originalRequest
    if (!error.response || !originalRequest) {
      return Promise.reject(error);
    }

    // Retry only on 401 Unauthorized once per request, excluding auth endpoints,
    // and only if an access token is stored (prevents phantom refresh attempts for guest requests)
    const hasToken = typeof localStorage !== 'undefined' && !!localStorage.getItem('accessToken');
    if (
      error.response.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint(originalRequest.url) &&
      hasToken
    ) {
      originalRequest._retry = true;
      try {
        const newToken = await refreshAccessToken();
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return API(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default API;
