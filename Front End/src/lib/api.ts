import axios, { AxiosHeaders } from 'axios';

// Base URL comes from env; default to Vite proxy path so we don't need CORS in dev
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const api = axios.create({
  baseURL,
  withCredentials: true // Enable sending cookies with requests (for httpOnly cookies)
});

// Attach Authorization header from localStorage if present
// Note: Moving to httpOnly cookies for better security, but keeping token for backward compatibility
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    if (!config.headers) {
      config.headers = new AxiosHeaders();
    }
    // Use AxiosHeaders API when available
    const hdrs = config.headers as AxiosHeaders | Record<string, string>;
    if (hdrs instanceof AxiosHeaders) {
      hdrs.set('Authorization', `Bearer ${token}`);
    } else {
      // Fallback for plain object headers
      (hdrs as Record<string, string>).Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Simple response error passthrough; could add global toast handling here
api.interceptors.response.use(
  (res) => res,
  (error) => Promise.reject(error)
);

export default api;
