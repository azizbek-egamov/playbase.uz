import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

export const adminApiClient = axios.create({
  baseURL: `${API_BASE_URL}/superadmin`,
  headers: {
    'Content-Type': 'application/json',
  },
});

adminApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('playbase_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('playbase_admin_token');
      localStorage.removeItem('playbase_admin_user');
      // window.location.reload();
    }
    return Promise.reject(error);
  }
);
