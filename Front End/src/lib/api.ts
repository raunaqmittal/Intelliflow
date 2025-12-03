import axios, { AxiosHeaders, AxiosError } from 'axios';

// Base URL comes from env; default to Vite proxy path so we don't need CORS in dev
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const api = axios.create({
  baseURL,
  withCredentials: false, // Not using cookies - using Authorization header from localStorage
  timeout: 25000 // 25 second timeout for deployed environment
});

// Attach Authorization header from localStorage if present
// Note: Moving to httpOnly cookies for better security, but keeping token for backward compatibility
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  
  // Don't send token for login/public endpoints to prevent conflicts
  const isPublicEndpoint = config.url?.includes('/login') || 
                           config.url?.includes('/forgotPassword') ||
                           config.url?.includes('/resetPassword') ||
                           config.url?.includes('/verify-reset-otp') ||
                           config.url?.includes('/verify-login-otp');
  
  if (token && !isPublicEndpoint) {
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
  (error: AxiosError) => {
    // Handle network errors (no internet connection)
    if (!error.response && error.code === 'ERR_NETWORK') {
      const networkError = new Error('Network error. Please check your internet connection.');
      networkError.name = 'NetworkError';
      return Promise.reject(networkError);
    }
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      const timeoutError = new Error('Request timeout. Please try again.');
      timeoutError.name = 'TimeoutError';
      return Promise.reject(timeoutError);
    }
    
    // Pass through other errors as-is
    return Promise.reject(error);
  }
);

export default api;
