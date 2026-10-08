import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('playbase_token');
  const clubId = localStorage.getItem('playbase_club_id');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (clubId) {
    config.headers['X-Club-Id'] = clubId;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const isInactive = 
      error.response?.status === 401 && 
      (error.response?.data?.code === 'user_inactive' || 
       error.response?.data?.detail?.toString().toLowerCase().includes('inactive'));

    const isExplicitlyBlocked = 
      error.response?.status === 403 && 
      error.response?.data?.is_blocked;

    if (isInactive || isExplicitlyBlocked) {
      // Import store dynamically or dispatch custom event to avoid circular deps
      window.dispatchEvent(new CustomEvent('playbase:user_blocked', {
        detail: {
          message: error.response?.data?.detail || "Sizning hisobingiz administrator tomonidan bloklangan.",
          supportTelegram: error.response?.data?.support_telegram || "@playbase_support"
        }
      }));
    }
    return Promise.reject(error);
  }
);
