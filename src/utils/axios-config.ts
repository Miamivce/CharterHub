import axios from 'axios';

// Configure Axios defaults
axios.defaults.withCredentials = true; // Ensure cookies are sent with requests
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest'; // Identify AJAX requests

// Add request interceptor to handle potential CORS preflight issues
axios.interceptors.request.use(
  config => {
    // Ensure JSON content type for non-FormData payloads
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
axios.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    // Log CORS errors distinctly for easier debugging
    if (error.message && error.message.includes('Network Error')) {
      console.error('Possible CORS issue:', error);
    }
    
    return Promise.reject(error);
  }
);

export default axios; 