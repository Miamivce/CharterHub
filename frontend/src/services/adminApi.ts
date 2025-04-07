import axios from 'axios'
import { debugLog } from '@/utils/logger'
import { configureAxiosInstance } from '@/utils/axios-config'

interface AdminNonce {
  nonce: string
  expires: number
}

interface WordPressAuthResponse {
  user_id: number
  user_login: string
  user_email: string
  roles: string[]
  display_name: string
}

// Admin API (WordPress Authentication)
const adminApi = configureAxiosInstance(
  axios.create({
    baseURL: import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:8001',
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true, // Required for WordPress cookie authentication
  })
)

// Store nonce in memory (not localStorage for security)
let currentNonce: AdminNonce | null = null

/**
 * Fetch a new nonce from the server
 */
const refreshNonce = async (): Promise<void> => {
  try {
    const response = await adminApi.post('/auth/nonce')
    if (response.data?.nonce) {
      currentNonce = response.data
      debugLog('Nonce refreshed successfully')
    }
  } catch (error) {
    debugLog('Failed to refresh nonce', 'error')
    throw error
  }
}

/**
 * Verify admin session is valid
 */
const verifySession = async (): Promise<WordPressAuthResponse> => {
  try {
    const response = await adminApi.get('/auth/verify')
    if (response.data?.success) {
      debugLog('Admin session verified')
      return response.data.user
    }
    throw new Error('Invalid session')
  } catch (error) {
    debugLog('Session verification failed', 'error')
    throw error
  }
}

// Request interceptor
adminApi.interceptors.request.use(
  async (config) => {
    // Add nonce to requests if available
    if (currentNonce && currentNonce.expires > Date.now()) {
      config.headers['X-WP-Nonce'] = currentNonce.nonce
    } else {
      // Refresh nonce if expired or not available
      await refreshNonce()
      if (currentNonce) {
        config.headers['X-WP-Nonce'] = currentNonce.nonce
      }
    }

    // Log request (without sensitive data)
    debugLog(`${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    debugLog('Request failed', 'error')
    return Promise.reject(error)
  }
)

// Response interceptor
adminApi.interceptors.response.use(
  (response) => {
    // Log successful response (without sensitive data)
    debugLog(`${response.config.method?.toUpperCase()} ${response.config.url} succeeded`)
    return response
  },
  async (error) => {
    if (error.response?.status === 403 && error.response?.data?.error === 'invalid_nonce') {
      // Retry request once with new nonce
      const failedRequest = error.config
      if (!failedRequest._retry) {
        failedRequest._retry = true
        await refreshNonce()
        return adminApi(failedRequest)
      }
    }

    if (error.response?.status === 401) {
      debugLog('Authentication required, redirecting to WordPress login')
      // Redirect to WordPress login
      const loginUrl = `${import.meta.env.VITE_WORDPRESS_URL}/wp-login.php`
      const redirectUrl = window.location.href
      window.location.href = `${loginUrl}?redirect_to=${encodeURIComponent(redirectUrl)}`
      return Promise.reject(new Error('Authentication required'))
    }

    // Handle other errors (without exposing sensitive data)
    const errorMessage = error.response?.data?.error || 'Request failed'
    debugLog(`Request failed: ${errorMessage}`, 'error')
    return Promise.reject(new Error(errorMessage))
  }
)

export { adminApi, verifySession }
export type { WordPressAuthResponse }
