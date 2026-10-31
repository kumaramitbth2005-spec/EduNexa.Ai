import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  timeout: 30000,
});

// Attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('edunexa_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('edunexa_token');
      localStorage.removeItem('edunexa_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

