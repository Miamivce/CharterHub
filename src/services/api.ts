import axios from 'axios';
import { envConfig } from './envValidator';

// Define a fallback API URL
const API_URL = 'http://localhost:8000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: envConfig.AUTH_API_URL || API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    // Get the token from session storage
    const token = sessionStorage.getItem('auth_token');
    
    if (token) {
      // Ensure the token is not a placeholder or test token
      if (token === 'test_token' || token.startsWith('test_token')) {
        console.warn('[API] Invalid token format detected. Using a test token is not allowed in production.');
        // Clear the invalid token
        sessionStorage.removeItem('auth_token');
      } else {
        // Add token to request headers
        config.headers.Authorization = `Bearer ${token}`;
      }
    } else {
      // Log a warning for requests that might need authentication
      const authEndpoints = ['/auth/update-profile.php', '/auth/me.php'];
      if (authEndpoints.some(endpoint => config.url?.includes(endpoint))) {
        console.warn('[API] No authentication token found for authenticated endpoint:', config.url);
      }
    }
    
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is due to an expired token and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Get the refresh token
        const refreshToken = sessionStorage.getItem('refresh_token');
        
        if (refreshToken) {
          // Try to refresh the token
          const response = await axios.post(
            `${originalRequest.baseURL}/auth/refresh`,
            { refresh_token: refreshToken },
            { headers: { 'Content-Type': 'application/json' } }
          );
          
          // Store the new tokens
          const { access_token, refresh_token } = response.data.tokens;
          sessionStorage.setItem('auth_token', access_token);
          sessionStorage.setItem('refresh_token', refresh_token);
          
          // Retry the original request with the new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('[API] Token refresh error:', refreshError);
        
        // Clear tokens and redirect to login
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('refresh_token');
        
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Class to handle API errors
export class ApiError extends Error {
  status: number;
  code?: string;
  errors?: Record<string, string[]>;
  
  constructor(message: string, status: number, code?: string, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

// Class to handle validation errors
export class ValidationError extends Error {
  errors: Record<string, string[]>;
  
  constructor(message: string, errors: Record<string, string[]>) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

// Error handling helper
const handleApiError = (error: any): never => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const { data, status } = error.response;
    const message = data?.error || data?.message || 'An unexpected error occurred';
    const code = data?.code;
    const errors = data?.errors;
    
    if (errors) {
      throw new ValidationError(message, errors);
    } else {
      throw new ApiError(message, status, code);
    }
  } else if (error.request) {
    // The request was made but no response was received
    throw new ApiError('No response from server', 0, 'network_error');
  } else {
    // Something happened in setting up the request that triggered an Error
    throw new ApiError(error.message, 0, 'request_error');
  }
};

// Enhanced API with error handling
const enhancedApi = {
  get: async (url: string, config?: any) => {
    try {
      return await api.get(url, config);
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  post: async (url: string, data?: any, config?: any) => {
    try {
      return await api.post(url, data, config);
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  put: async (url: string, data?: any, config?: any) => {
    try {
      return await api.put(url, data, config);
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  delete: async (url: string, config?: any) => {
    try {
      return await api.delete(url, config);
    } catch (error) {
      return handleApiError(error);
    }
  }
};

export default enhancedApi; 