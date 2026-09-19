import axios from 'axios';

// Prefer explicit API URL; otherwise use same-origin /api (Vite proxy or nginx)
const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ht_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const code = error.response?.data?.code;
    if (code === 'TOKEN_EXPIRED' || (error.response?.status === 401 && code !== 'INVALID_CREDENTIALS')) {
      localStorage.removeItem('ht_token');
      localStorage.removeItem('ht_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/login?reason=${code === 'TOKEN_EXPIRED' ? 'expired' : 'auth'}`;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
