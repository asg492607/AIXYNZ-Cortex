import axios from 'axios';
import { getAuth } from 'firebase/auth';

// Get base URL from environment or fallback to localhost
// In single-service production (Render), VITE_API_URL isn't needed, we just use the relative /api/v1 path.
const API_BASE = import.meta.env.PROD ? '/api/v1' : (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1');

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — always send a fresh Firebase token
api.interceptors.request.use(
  async (config) => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (currentUser) {
        // forceRefresh=false uses cached token if still valid (< 1hr old)
        const token = await currentUser.getIdToken(false);
        config.headers.Authorization = `Bearer ${token}`;
        localStorage.setItem('cortex_token', token);
      } else {
        // Fallback to stored token
        const stored = localStorage.getItem('cortex_token');
        if (stored) config.headers.Authorization = `Bearer ${stored}`;
      }
    } catch {
      const stored = localStorage.getItem('cortex_token');
      if (stored) config.headers.Authorization = `Bearer ${stored}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login if not already there
      localStorage.removeItem('cortex_token');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
