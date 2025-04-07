/**
 * Application configuration
 */

// API base URLs
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.charterhub.com'
export const WP_API_URL = import.meta.env.VITE_WP_API_URL || 'https://yachtstory.com/wp-json'
export const AUTH_API_URL = import.meta.env.VITE_API_URL || 'https://api.charterhub.com'

// Authentication settings
export const AUTH_TOKEN_KEY = 'charterhub_token'
export const AUTH_USER_KEY = 'charterhub_user'

// Feature flags
export const FEATURES = {
  USE_API: true, // Whether to use the API or localStorage
  MOCK_AUTH: false, // Whether to use mock authentication
  DEBUG_MODE: import.meta.env.VITE_DEBUG === 'true', // Whether to show debug information
}

// App metadata
export const APP_VERSION = '1.0.0'
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'CharterHub'
