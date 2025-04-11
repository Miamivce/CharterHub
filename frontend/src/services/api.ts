import axios, { AxiosRequestConfig, AxiosAdapter } from 'axios'
import { generateCacheBuster } from '@/utils/cacheControl'
import { debugLog } from '@/utils/logger'
import { TOKEN_KEY } from '@/services/jwtApi'
import { configureAxiosInstance } from '@/utils/axios-config'

// Base URL configuration
const API_BASE_URL = import.meta.env.VITE_PHP_API_URL || 'http://localhost:8000'

// Log the API base URL for debugging
console.log('API Base URL:', API_BASE_URL)
debugLog(`API configured with base URL: ${API_BASE_URL}`)

// Common default headers
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
}

// Helper to get the auth token from storage
const getAuthToken = () => {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)
}

// Main API - Used for all JWT-authenticated requests (both client and admin)
const axiosInstance = configureAxiosInstance(
  axios.create({
    baseURL: API_BASE_URL,
    headers: DEFAULT_HEADERS,
    timeout: 90000,
    withCredentials: true, // Required for cookie-based auth and CORS with credentials
  })
)

// Extend the AxiosRequestConfig type to include our critical flag
interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  critical?: boolean;
  keepalive?: boolean;
}

// Request interceptor for adding auth token and cache busting
axiosInstance.interceptors.request.use(
  (config: ExtendedAxiosRequestConfig) => {
    // Add JWT token to Authorization header for all requests
    const token = getAuthToken()

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Convert PUT/DELETE methods to POST with X-HTTP-Method-Override header
    // This avoids CORS preflight issues with PUT/DELETE methods
    if (config.method?.toUpperCase() === 'PUT' || config.method?.toUpperCase() === 'DELETE') {
      config.headers['X-HTTP-Method-Override'] = config.method.toUpperCase()
      config.method = 'post'
      console.log(
        `Converting ${config.headers['X-HTTP-Method-Override']} to POST with override header`
      )
    }

    // Add cache control for GET requests
    if (config.method?.toLowerCase() === 'get') {
      // Add cache buster
      const cacheBuster = generateCacheBuster()
      config.params = { ...config.params, _: cacheBuster }
    }

    // Safe request logging
    debugLog(`${config.method?.toUpperCase()} ${config.url}`)

    // Add a new request interceptor for critical requests
    if (config.url?.includes('/auth/') || config.url?.endsWith('me.php')) {
      console.log(`[API] Making critical request to ${config.url}`);
      // Set custom flag for critical auth requests
      config.critical = true;
      
      // Make the request non-cancellable
      // This ensures the request completes even during page navigation
      config.signal = undefined; // Remove any abort signal
      
      // Set keepalive for fetch-based requests if supported by the environment
      if (!config.adapter) {
        config.keepalive = true;
      }
    }

    return config
  },
  (error) => {
    debugLog('Request failed', 'error')
    return Promise.reject(error)
  }
)

// Response interceptor with automatic token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Attempt to refresh the token
        await axiosInstance.post('/api/auth/refresh-token.php')

        // Update the auth token after refresh
        const newToken = getAuthToken()
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
        }

        // Retry the original request
        return axiosInstance(originalRequest)
      } catch (refreshError) {
        // Dispatch auth failure event
        window.dispatchEvent(new CustomEvent('jwt:authFailure'))

        // Redirect to appropriate login page
        if (window.location.pathname.startsWith('/admin')) {
          window.location.href = '/admin/login'
        } else {
          window.location.href = '/login'
        }

        return Promise.reject(refreshError)
      }
    }

    // Handle other errors
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred'
    debugLog(`Request failed: ${errorMessage}`, 'error')
    return Promise.reject(new Error(errorMessage))
  }
)

// Fix the custom adapter implementation
// Add a custom adapter for critical requests that should not be cancelled
const originalAdapter = axiosInstance.defaults.adapter;
axiosInstance.defaults.adapter = async function(config: ExtendedAxiosRequestConfig) {
  if (config.critical) {
    try {
      // For critical requests, use fetch with keepalive
      // This will continue even if the page changes
      if (typeof window !== 'undefined' && window.fetch) {
        const url = axios.getUri(config);
        
        // Extract request details
        const method = config.method?.toUpperCase() || 'GET';
        const headers = { 
          ...config.headers as Record<string, string>,
          // Add any auth headers
          ...(config?.headers?.['Authorization'] ? 
            { 'Authorization': config.headers['Authorization'] as string } : {})
        };
        
        // Prepare fetch options with keepalive
        const fetchOptions: RequestInit = {
          method,
          headers,
          credentials: 'include' as RequestCredentials,
          keepalive: true,
          mode: 'cors' as RequestMode,
          body: config.data ? JSON.stringify(config.data) : undefined
        };
        
        console.log(`[API] Using keepalive fetch for critical request to ${url}`);
        
        // Make the fetch request that will survive navigation
        const response = await fetch(url, fetchOptions);
        
        // Convert the response to axios format
        const responseData = await response.json();
        
        return {
          data: responseData,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries([...response.headers.entries()]),
          config: config,
          request: null
        };
      }
    } catch (fetchError) {
      console.warn(`[API] Keepalive fetch failed, falling back to standard adapter: ${(fetchError as Error).message}`);
      // If fetch fails, fall back to the original adapter
    }
  }
  
  // Use the original adapter for non-critical requests or if fetch failed
  return (originalAdapter as AxiosAdapter)(config);
};

// For backward compatibility - use the same instance
export const clientApi = axiosInstance
export const adminApi = axiosInstance

export default axiosInstance
