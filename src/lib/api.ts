import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '';

export const TOKEN_KEY = 'admin_access_token';

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const t = sessionStorage.getItem(TOKEN_KEY);
  if (t) {
    config.headers.Authorization = `Bearer ${t}`;
  }
  if (config.data instanceof FormData) {
    // Let the browser set multipart boundary; default json Content-Type breaks uploads.
    delete config.headers['Content-Type'];
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      sessionStorage.removeItem(TOKEN_KEY);
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);
