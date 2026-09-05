import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let activeRequests = 0;

function reportNetworkActivity() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('recalix:network-activity', { detail: activeRequests }));
  }
}

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    activeRequests += 1;
    reportNetworkActivity();
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('recalix_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — redirect to login on 401
api.interceptors.response.use(
  (response) => {
    activeRequests = Math.max(0, activeRequests - 1);
    reportNetworkActivity();
    return response;
  },
  (error) => {
    activeRequests = Math.max(0, activeRequests - 1);
    reportNetworkActivity();
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Clear stale auth data
      localStorage.removeItem('recalix_token');
      localStorage.removeItem('recalix_user');
      // Redirect to login if not already there
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
