import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT from localStorage on every request.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('ecad_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear stored auth so the app can redirect to login.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('ecad_token');
      localStorage.removeItem('ecad_user');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
