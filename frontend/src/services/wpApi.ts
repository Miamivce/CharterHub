import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios'
import CSRFManager from './CSRFManager'
import { debugLog } from '@/utils/logger'

// Error Types
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public errors?: Record<string, string[]>
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: Record<string, string[]>
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter?: number
  ) {
    super(message)
    this.name = 'RateLimitError'
  }
}

// Validation helper functions
const validateEmail = (email: string): string[] => {
  const errors: string[] = []
  if (!email) {
    errors.push('Email is required')
  } else if (!/\S+@\S+\.\S+/.test(email)) {
    errors.push('Invalid email format')
  }
  return errors
}

const validatePassword = (password: string): string[] => {
  const errors: string[] = []
  if (!password) {
    errors.push('Password is required')
  } else if (password.length < 8) {
    errors.push('Password must be at least 8 characters')
  }
  return errors
}

// Environment configuration
const isLocal = import.meta.env.MODE === 'development'
const API_URL =
  import.meta.env.VITE_PHP_API_URL ||
  (isLocal ? 'http://localhost:8000' : 'https://charterhub.yachtstory.com/api')

// WordPress API base URL
const WP_API_URL =
  import.meta.env.VITE_WP_API_URL || 'https://charterhub.yachtstory.com/wp-json/wp/v2'

// Get the current frontend URL with port for the Origin header
const FRONTEND_URL = window.location.origin

// Constants
export const TOKEN_KEY = 'auth_token'
export const REFRESH_TOKEN_KEY = 'refresh_token'
export const TOKEN_EXPIRY_KEY = 'token_expiry'
export const REMEMBER_ME_KEY = 'remember_me'
export const CSRF_TOKEN_KEY = 'csrf_token'
export const USER_DATA_KEY = 'user_data'
export const STORAGE_SYNC_KEY = 'storage_sync_timestamp'
export const RATE_LIMIT_KEY = 'rate_limit_info'

// Define constants for development mode
const DEVELOPMENT_MODE = import.meta.env.MODE === 'development'

// Utility functions
const error_log = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(...args)
  }
}

// Helper function to get the appropriate storage type
const getStorageType = (): Storage => {
  // Check remember me preference
  const useLocalStorage = localStorage.getItem(REMEMBER_ME_KEY) === 'true'

  // If remember me is set, use localStorage, otherwise sessionStorage
  return useLocalStorage ? localStorage : sessionStorage
}

// Updated TokenStorage implementation
export const TokenStorage = {
  getToken: (): string | null => {
    // Try the preferred storage type first
    const storageType = getStorageType()
    const token = storageType.getItem(TOKEN_KEY)

    // If token not found in preferred storage, try the other storage as fallback
    if (!token) {
      const fallbackStorage = storageType === localStorage ? sessionStorage : localStorage
      const fallbackToken = fallbackStorage.getItem(TOKEN_KEY)

      if (fallbackToken) {
        console.log('[TokenStorage] Found token in fallback storage, moving to preferred storage')
        // Move to preferred storage for consistency
        storageType.setItem(TOKEN_KEY, fallbackToken)
        return fallbackToken
      }
    }

    return token
  },

  getRefreshToken: (): string | null => {
    // Try the preferred storage type first
    const storageType = getStorageType()
    const refreshToken = storageType.getItem(REFRESH_TOKEN_KEY)

    // If refresh token not found in preferred storage, try the other storage as fallback
    if (!refreshToken) {
      const fallbackStorage = storageType === localStorage ? sessionStorage : localStorage
      const fallbackRefreshToken = fallbackStorage.getItem(REFRESH_TOKEN_KEY)

      if (fallbackRefreshToken) {
        console.log(
          '[TokenStorage] Found refresh token in fallback storage, moving to preferred storage'
        )
        // Move to preferred storage for consistency
        storageType.setItem(REFRESH_TOKEN_KEY, fallbackRefreshToken)
        return fallbackRefreshToken
      }
    }

    return refreshToken
  },

  getTokenExpiry: (): string | null => {
    // Try the preferred storage type first
    const storageType = getStorageType()
    const expiry = storageType.getItem(TOKEN_EXPIRY_KEY)

    // If expiry not found in preferred storage, try the other storage as fallback
    if (!expiry) {
      const fallbackStorage = storageType === localStorage ? sessionStorage : localStorage
      const fallbackExpiry = fallbackStorage.getItem(TOKEN_EXPIRY_KEY)

      if (fallbackExpiry) {
        console.log('[TokenStorage] Found expiry in fallback storage, moving to preferred storage')
        // Move to preferred storage for consistency
        storageType.setItem(TOKEN_EXPIRY_KEY, fallbackExpiry)
        return fallbackExpiry
      }
    }

    return expiry
  },

  storeAuthData: (
    token: string,
    refreshToken: string,
    expiresIn: number,
    rememberMe?: boolean
  ): void => {
    // Determine storage type
    const storageType =
      rememberMe !== undefined ? (rememberMe ? localStorage : sessionStorage) : getStorageType()

    // Store rememberMe preference
    if (rememberMe !== undefined) {
      localStorage.setItem(REMEMBER_ME_KEY, rememberMe.toString())
    }

    // Calculate token expiration
    const expiryTime = Date.now() + expiresIn * 1000

    // Store tokens and expiry
    storageType.setItem(TOKEN_KEY, token)
    storageType.setItem(REFRESH_TOKEN_KEY, refreshToken)
    storageType.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString())

    // If switching storage types, clear the other storage
    const otherStorage = storageType === localStorage ? sessionStorage : localStorage
    otherStorage.removeItem(TOKEN_KEY)
    otherStorage.removeItem(REFRESH_TOKEN_KEY)
    otherStorage.removeItem(TOKEN_EXPIRY_KEY)

    // Log debug info
    console.log(
      `[TokenStorage] Auth data stored with expiry: ${new Date(expiryTime).toLocaleString()}`
    )
  },

  clearAuthData: async (): Promise<void> => {
    try {
      // Ensure we try to clear from both storage types
      ;[localStorage, sessionStorage].forEach((storage) => {
        storage.removeItem(TOKEN_KEY)
        storage.removeItem(REFRESH_TOKEN_KEY)
        storage.removeItem(TOKEN_EXPIRY_KEY)
        storage.removeItem(USER_DATA_KEY)
        storage.removeItem(RATE_LIMIT_KEY)
      })

      // Also clear CSRF cookies
      document.cookie = 'CSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      document.cookie = 'CSRF-REFRESH=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'

      console.log('[TokenStorage] Auth data cleared')
    } catch (error) {
      console.error('[TokenStorage] Error clearing auth data:', error)
    }
  },

  storeUserData: (userData: any): void => {
    if (!userData) {
      console.error('[TokenStorage] Cannot store null user data')
      return
    }

    // Additional logging to debug user data
    console.log('[TokenStorage] Original user data to store:', JSON.stringify(userData, null, 2))

    // Format user data to ensure it has the correct structure
    const formattedUser = {
      id: userData.id,
      email: userData.email,
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      displayName:
        userData.displayName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
      role: userData.role,
      verified: userData.verified,
      phoneNumber: userData.phoneNumber || '',
      company: userData.company || '',
      registeredDate: userData.registeredDate || new Date().toISOString(),
    }

    // Log the formatted user data that we'll actually store
    console.log(
      '[TokenStorage] Formatted user data being stored:',
      JSON.stringify(formattedUser, null, 2)
    )

    const storageType = getStorageType()
    storageType.setItem(USER_DATA_KEY, JSON.stringify(formattedUser))
    console.log('[TokenStorage] User data stored successfully')
  },

  getUserData: (): any | null => {
    try {
      const storageType = getStorageType()
      const userData = storageType.getItem(USER_DATA_KEY)

      if (!userData) {
        return null
      }

      // Parse and ensure data has the correct structure
      const parsed = JSON.parse(userData)

      // Ensure the data has the right structure and defaults
      return {
        id: parsed.id,
        email: parsed.email,
        firstName: parsed.firstName || '',
        lastName: parsed.lastName || '',
        displayName:
          parsed.displayName || `${parsed.firstName || ''} ${parsed.lastName || ''}`.trim(),
        role: parsed.role,
        verified: parsed.verified,
        phoneNumber: parsed.phoneNumber || '',
        company: parsed.company || '',
        registeredDate: parsed.registeredDate || new Date().toISOString(),
      }
    } catch (error) {
      console.error('[TokenStorage] Error retrieving user data:', error)
      return null
    }
  },

  isTokenExpired: (): boolean => {
    const expiryStr = TokenStorage.getTokenExpiry()
    if (!expiryStr) return true

    const expiry = parseInt(expiryStr, 10)
    const now = Date.now()
    return now >= expiry
  },

  setStoragePreference: (preference: 'local' | 'session'): void => {
    const useLocalStorage = preference === 'local'
    localStorage.setItem(REMEMBER_ME_KEY, useLocalStorage.toString())
  },

  setItem: (key: string, value: string, rememberMe?: boolean): void => {
    const storageType =
      rememberMe !== undefined ? (rememberMe ? localStorage : sessionStorage) : getStorageType()

    storageType.setItem(key, value)
  },

  getItem: (key: string): string | null => {
    const storageType = getStorageType()
    return storageType.getItem(key)
  },

  removeItem: (key: string): void => {
    ;[localStorage, sessionStorage].forEach((storage) => {
      storage.removeItem(key)
    })
  },
}

// Update User type to include all required fields
export interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  displayName: string
  role: 'admin' | 'client' | 'charter_client'
  verified: boolean
  phoneNumber?: string
  company?: string
  registeredDate: string
}

// Add UserProfileData interface for API requests
export interface UserProfileData {
  id: number
  email?: string
  firstName?: string
  lastName?: string
  displayName?: string
  role?: 'admin' | 'client' | 'charter_client'
  verified?: boolean
  phoneNumber?: string
  company?: string
  registeredDate?: string
}

// Add UserData interface for API responses
interface UserData {
  id: number
  email: string
  first_name?: string
  last_name?: string
  display_name?: string
  role: 'admin' | 'client' | 'charter_client'
  verified?: boolean
  phone_number?: string
  company?: string
  registeredDate?: string
  createdAt?: string
}

interface LoginResponse {
  success: boolean
  token: string
  refresh_token: string
  user: UserData
  expires_in: number
}

interface PasswordResetData {
  email: string
  token?: string
  newPassword?: string
}

// Add retry logic for database operations that might experience timeouts
const executeWithRetry = async <T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> => {
  let lastError: any

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      // Type guard to ensure error is properly typed
      const axiosError = error as AxiosError

      // Only retry for network errors or timeout errors
      if (
        axiosError &&
        axiosError.code !== 'ECONNABORTED' && // timeout
        (!axiosError.response || axiosError.response.status < 500) // not a server error
      ) {
        throw error // Don't retry client errors or validation errors
      }

      if (attempt < maxRetries) {
        const delay = attempt * 1000 // Exponential backoff
        console.warn(
          `API request failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

/**
 * Recovery mechanism for when browser storage has been cleared
 *
 * This function is triggered when the application detects that authentication tokens
 * are missing but the user was previously authenticated. It attempts to:
 *
 * 1. Detect if auth tokens are missing
 * 2. Fetch a new CSRF token from the server using our isolated fetch method
 * 3. Clear any partial authentication data
 * 4. Prepare the application for re-authentication
 *
 * @returns {Promise<boolean>} True if recovery was successful, false otherwise
 */
const recoverFromStorageClearing = async () => {
  console.log('Attempting to recover from storage clearing')

  // Check if we have any auth tokens
  const hasToken = TokenStorage.getItem(TOKEN_KEY)
  const hasRefreshToken = TokenStorage.getItem(REFRESH_TOKEN_KEY)

  // If we have no tokens, we need to get a new CSRF token
  if (!hasToken || !hasRefreshToken) {
    try {
      // Use CSRFManager directly to get a new token with forced refresh
      // This uses our isolated axios instance that avoids CORS issues
      const csrfToken = await CSRFManager.ensureToken(true)

      if (csrfToken) {
        console.log('Successfully recovered CSRF token')

        // Clear any partial auth data to ensure a clean state
        TokenStorage.clearAuthData()

        // Notify the user that they need to log in again
        if (typeof window !== 'undefined') {
          // Only show this message if we're in a browser context
          console.info('Authentication state was reset. Please log in again.')
        }

        return true
      } else {
        console.warn('CSRF token fetch succeeded but returned null')
        return false
      }
    } catch (error) {
      console.error('Failed to recover CSRF token:', error)

      // Try one more approach with a direct fetch - as a backup
      try {
        console.log('Attempting alternate recovery approach...')

        // Create a minimal axios instance just for this recovery
        const recoveryClient = axios.create({
          baseURL: API_URL,
          timeout: 5000,
          withCredentials: true,
          headers: {
            Accept: 'application/json',
            'Cache-Control': 'no-cache',
          },
        })

        const response = await recoveryClient.get('/auth/csrf-token.php')

        if (response.data?.csrf_token) {
          CSRFManager.setToken(response.data.csrf_token)
          console.log('Recovery succeeded with alternate approach')
          TokenStorage.clearAuthData()
          return true
        }
      } catch (backupError) {
        console.error('Alternate recovery also failed:', backupError)
      }
    }
  }

  return false
}

// Create API instance for authentication
// Note: Cache-control headers (Cache-Control, Pragma, Expires) have been removed to prevent CORS issues
// These headers trigger preflight requests that often fail with the current backend CORS configuration
// JWT authentication doesn't require these cache headers, as tokens are sent in the Authorization header
const api = axios.create({
  baseURL: API_URL,
  timeout: 90000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

// Add request interceptor to include authentication token
api.interceptors.request.use(
  async (config) => {
    // Profile update specific interceptor to resolve CORS issues
    // This is necessary because the backend CORS configuration doesn't allow certain headers
    // during preflight requests for update-profile endpoint
    if (config.url && config.url.includes('update-profile')) {
      debugLog('[API] Preprocessing profile update request to ensure CORS compatibility')

      // Log headers before modification (development mode only)
      if (DEVELOPMENT_MODE) {
        console.log('[API] Profile update request headers before modification:', config.headers)
      }

      // Remove all cache-control related headers that trigger CORS preflight failures
      if (config.headers) {
        // Remove problematic headers that cause CORS preflight issues
        delete config.headers['pragma']
        delete config.headers['Pragma']
        delete config.headers['expires']
        delete config.headers['Expires']
        delete config.headers['cache-control']
        delete config.headers['Cache-Control']

        // Also remove any other non-standard headers that might cause issues
        delete config.headers['X-Cache-Control']

        debugLog('[API] Removed all cache control headers for CORS compatibility')
      }

      // Log headers after modification (development mode only)
      if (DEVELOPMENT_MODE) {
        console.log('[API] Profile update request headers after modification:', config.headers)
      }

      debugLog('[API] Headers modified for profile update request to comply with CORS policy')
    }

    // Skip auth header for CSRF token requests to avoid circular dependency
    // Check URL pattern explicitly to ensure consistent detection
    if (
      config.url &&
      (config.url.includes('/auth/csrf-token.php') ||
        config.url.endsWith('/csrf-token.php') ||
        config.url.includes('/auth/csrf-token'))
    ) {
      if (DEVELOPMENT_MODE) {
        console.log(
          `Skipping auth headers for CSRF token request: ${config.method?.toUpperCase()} ${config.url}`
        )
      }
      // Ensure no auth headers are added to CSRF requests
      const safeConfig = { ...config }
      if (safeConfig.headers) {
        // Remove any auth-related headers that might be set by default
        delete safeConfig.headers['Authorization']
        delete safeConfig.headers['X-CSRF-Token']
        delete safeConfig.headers['X-Skip-Auth']
      }
      return safeConfig
    }

    // Check if token is expired and refresh if needed
    const token = TokenStorage.getToken()
    const isTokenExpired = TokenStorage.isTokenExpired()

    if (token && isTokenExpired && !config.url?.includes('/auth/refresh-token.php')) {
      debugLog('Token is expired, attempting refresh before request', 'API')

      try {
        // Attempt to refresh the token
        const refreshed = await wpApi.refreshToken()

        if (refreshed) {
          // Get the new token after refresh
          const newToken = TokenStorage.getToken()
          if (newToken) {
            config.headers.Authorization = `Bearer ${newToken}`
            debugLog('Using refreshed token for request', 'API')
          }
        } else {
          debugLog('Token refresh failed, proceeding without auth token', 'API')
        }
      } catch (refreshError) {
        debugLog(
          `Token refresh error: ${refreshError instanceof Error ? refreshError.message : 'Unknown error'}`,
          'API',
          'error'
        )
        // Continue with the request even if refresh fails
      }
    } else if (token) {
      // If we have a valid token, use it
      config.headers.Authorization = `Bearer ${token}`
      debugLog(`Adding auth token to ${config.method?.toUpperCase()} ${config.url}`, 'API')
    } else {
      // Only log for endpoints that should have auth
      if (!config.url?.includes('/auth/login.php') && !config.url?.includes('/auth/register.php')) {
        debugLog(`No auth token available for ${config.method?.toUpperCase()} ${config.url}`, 'API')
      }
    }

    // Add CSRF token for mutation operations
    if (['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase() || '')) {
      const csrfToken = CSRFManager.getToken()
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken
        if (DEVELOPMENT_MODE) {
          console.log(`Added CSRF token to ${config.method?.toUpperCase()} ${config.url}`)
        }
      } else if (!config.url?.includes('/auth/csrf-token.php')) {
        // Only fetch a new token if we're not already fetching one
        try {
          const newToken = await CSRFManager.ensureToken()
          if (newToken) {
            config.headers['X-CSRF-Token'] = newToken
            if (DEVELOPMENT_MODE) {
              console.log(
                `Fetched and added new CSRF token to ${config.method?.toUpperCase()} ${config.url}`
              )
            }
          } else {
            console.warn(
              `Failed to get CSRF token for ${config.method?.toUpperCase()} ${config.url}`
            )
          }
        } catch (csrfError) {
          console.error('Failed to get CSRF token for request:', csrfError)
        }
      }
    }

    return config
  },
  (error) => {
    debugLog(`Request interceptor error: ${error.message}`, 'API', 'error')
    return Promise.reject(error)
  }
)

// Helper function to handle errors consistently
const handleApiError = (error: unknown): never => {
  console.error('API Error:', error)

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError
    const status = axiosError.response?.status
    const errorData = axiosError.response?.data as any

    // Handle validation errors
    if (status === 422 && errorData?.errors) {
      throw new ValidationError(errorData.message || 'Validation failed', errorData.errors)
    }

    // Handle other API errors
    throw new ApiError(
      errorData?.message || axiosError.message,
      status,
      errorData?.code,
      errorData?.errors
    )
  }

  // Handle non-Axios errors
  throw new ApiError(error instanceof Error ? error.message : 'Unknown error occurred')
}

// Format user data from API response to frontend format
const formatUserData = (userData: UserData): User => {
  if (!userData) {
    throw new Error('Invalid user data received from API')
  }

  // Ensure we have the required fields
  if (!userData.email) {
    throw new Error('User data missing email field')
  }

  // Normalize role
  const normalizeRole = (role: string = 'client'): User['role'] => {
    switch (role?.toLowerCase()) {
      case 'admin':
      case 'administrator':
        return 'admin'
      case 'charter_client':
        return 'charter_client'
      case 'customer': // Handle legacy 'customer' role
        return 'client'
      default:
        return 'client'
    }
  }

  // Handle metadata fields
  return {
    id: parseInt(String(userData.id), 10),
    email: userData.email,
    firstName: userData.first_name || '',
    lastName: userData.last_name || '',
    displayName:
      userData.display_name || `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
    role: normalizeRole(userData.role),
    verified: Boolean(userData.verified),
    phoneNumber: userData.phone_number || '',
    company: userData.company || '',
    registeredDate: userData.registeredDate || userData.createdAt || new Date().toISOString(),
  }
}

// Export getApi function needed by wordpressService
export function getApi(baseURL: string): AxiosInstance {
  return axios.create({
    baseURL,
    timeout: 15000,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  })
}

export interface VerificationResponse {
  success: boolean
  message: string
  redirectUrl?: string
}

export const verifyEmail = async (token: string, email?: string): Promise<VerificationResponse> => {
  const api = getApi(API_URL)
  
  try {
    const payload: any = { token }
    if (email) {
      payload.email = email
    }
    
    const response = await api.post('/auth/verify-email', payload)
    
    return {
      success: response.data.success,
      message: response.data.message,
      redirectUrl: response.data.redirectUrl,
    }
  } catch (error) {
    console.error('Email verification error:', error)
    return {
      success: false,
      message: 'Email verification failed. Please try again or contact support.',
    }
  }
}

// Add interface definitions for ProfileData and CharterhubUser
interface ProfileData {
  firstName: string
  lastName: string
  email: string
  phoneNumber?: string
  company?: string
}

interface CharterhubUser {
  id?: number
  firstName: string
  lastName: string
  email: string
  phoneNumber?: string
  company?: string
  role?: string
  verified?: boolean
  displayName?: string
  registeredDate?: string
}

// Export the wpApi service
const wpApi = {
  api: getApi(import.meta.env.VITE_PHP_API_URL || 'http://localhost:8888'),

  /**
   * Test connection to the API
   */
  async testConnection() {
    try {
      const response = await api.get('/auth/status.php')
      return {
        success: true,
        message: response.data?.message || 'Connected to PHP Auth API',
      }
    } catch (error) {
      return handleApiError(error)
    }
  },

  /**
   * Get initial CSRF token (if required by server)
   */
  async getCSRFToken(forceRefresh = false) {
    try {
      // Use CSRFManager to handle token fetching with deduplication
      const token = await CSRFManager.ensureToken(forceRefresh)

      if (token) {
        console.log('CSRF token available:', token.substring(0, 6) + '...')
        return { csrf_token: token }
      }

      console.warn('Server did not return a CSRF token')
      return null
    } catch (error) {
      console.error('Failed to get CSRF token:', error)

      // Try to recover
      await recoverFromStorageClearing()

      return null
    }
  },

  /**
   * Reset login attempts for current IP address
   * Useful during development or for troubleshooting
   */
  async resetLoginAttempts() {
    try {
      console.log('Attempting to reset login attempts for current IP')

      // Make request without cache-control headers that trigger CORS issues
      const response = await api.get('/auth/reset-login-attempts.php', {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          // Removed problematic cache-control headers:
          // 'Cache-Control': 'no-cache, no-store, must-revalidate',
          // 'Pragma': 'no-cache',
          // 'Expires': '0'
        },
      })

      if (response.data && response.data.success) {
        console.log('Login attempts reset successfully:', response.data)
        return response.data
      }

      console.warn('Failed to reset login attempts:', response.data)
      return {
        success: false,
        message: 'Server did not confirm reset of login attempts',
      }
    } catch (error) {
      console.error('Error resetting login attempts:', error)
      return {
        success: false,
        message: 'Failed to reset login attempts due to an error',
      }
    }
  },

  /**
   * Get the current authenticated user
   */
  async getCurrentUser(retryAttempt = 0): Promise<any> {
    try {
      // Create a dedicated client for this request
      const client = axios.create({
        timeout: 10000, // 10 seconds timeout
        headers: {
          Authorization: `Bearer ${TokenStorage.getToken()}`,
          // Avoid cache-control header that might cause CORS issues
        },
      })

      console.log('[API] Adding auth token to GET /auth/me.php')

      // Make the request to the me.php endpoint
      const response = await client.get(`${API_URL}/auth/me.php`)

      // Log the full response for debugging
      console.log(
        '[getCurrentUser] Full response from /auth/me.php:',
        JSON.stringify(response.data, null, 2)
      )

      if (!response.data || !response.data.success || !response.data.user) {
        console.error('[getCurrentUser] Invalid response format from /auth/me.php:', response.data)
        throw new Error('Invalid user data received from server')
      }

      // Check if new tokens were returned (e.g., after profile changes detected)
      if (response.data.tokens) {
        console.log(
          '[getCurrentUser] New tokens detected in me.php response, updating stored tokens'
        )

        // Store the new tokens using the storeAuthData method
        TokenStorage.storeAuthData(
          response.data.tokens.access_token,
          response.data.tokens.refresh_token,
          response.data.tokens.expires_in || 3600,
          true // Remember me - true for persistent login
        )

        console.log('[getCurrentUser] Tokens updated successfully')
      }

      // Clear any cached user data first
      TokenStorage.removeItem(USER_DATA_KEY)

      // Format user data consistently, with extra validation
      const userData = {
        id: response.data.user.id,
        email: response.data.user.email,
        firstName: response.data.user.firstName || '',
        lastName: response.data.user.lastName || '',
        displayName:
          response.data.user.displayName ||
          `${response.data.user.firstName || ''} ${response.data.user.lastName || ''}`.trim(),
        phoneNumber: response.data.user.phoneNumber || '',
        company: response.data.user.company || '',
        role: response.data.user.role || 'charter_client',
        verified: response.data.user.verified || false,
      }

      // Log explicit debug info for each field
      console.log('[getCurrentUser] Parsed user data:', {
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phoneNumber: userData.phoneNumber,
        company: userData.company,
        role: userData.role,
      })

      // Store user data based on remember me preference
      const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true'
      TokenStorage.storeUserData(userData)

      return userData
    } catch (error) {
      console.error('[getCurrentUser] Error:', error)

      // Handle token expiration
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        if (retryAttempt === 0) {
          // Try to refresh the token once
          console.log('[getCurrentUser] Unauthorized, attempting to refresh token')
          try {
            const refreshed = await this.refreshToken()
            if (refreshed) {
              // Retry with new token
              return this.getCurrentUser(1)
            }
          } catch (refreshError) {
            console.error('[getCurrentUser] Token refresh failed:', refreshError)
            await TokenStorage.clearAuthData()
            throw new Error('Session expired. Please login again.')
          }
        } else {
          // Already retried once, force logout
          await TokenStorage.clearAuthData()
          throw new Error('Authentication failed. Please login again.')
        }
      }

      throw error
    }
  },

  /**
   * Login user
   *
   * This function handles the authentication process:
   * 1. Ensures a valid CSRF token is available
   * 2. Sends credentials to the server
   * 3. Stores the received tokens in the appropriate storage
   * 4. Sets token expiration based on the "Remember Me" preference
   *
   * Token storage strategy:
   * - If rememberMe=true: Tokens are stored in localStorage (persist across sessions)
   * - If rememberMe=false: Tokens are stored in sessionStorage (cleared when browser closes)
   *
   * @param {Object} params Login parameters
   * @param {string} params.email User email
   * @param {string} params.password User password
   * @param {boolean} params.rememberMe Whether to remember the user across sessions
   * @returns Promise with user data and tokens
   */
  async login({
    email,
    password,
    rememberMe = false,
  }: {
    email: string
    password: string
    rememberMe?: boolean
  }): Promise<{
    user: {
      id: number
      email: string
      firstName: string
      lastName: string
      role: string
      verified: boolean
      phoneNumber?: string
      company?: string
    }
    token: string
    refresh_token: string
    expires_in: number
  }> {
    try {
      console.log(`Attempting login for ${email} with rememberMe=${rememberMe}`)

      // Get the current CSRF token - the interceptor will handle adding it to the request
      // No need to fetch a new one here as the Login component already ensures we have one

      // Create a custom axios instance for login to handle potential broken responses
      const loginApi = axios.create({
        baseURL: API_URL,
        timeout: 30000,
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-Token': CSRFManager.getToken() || '',
          'Cache-Control': 'no-cache',
        },
        // Add a custom response transformer to handle malformed JSON
        transformResponse: [
          (data) => {
            if (typeof data === 'string') {
              try {
                // Try direct parsing first
                return JSON.parse(data)
              } catch (e) {
                console.error('Failed to parse login response as JSON, attempting extraction:', e)
                try {
                  // Find JSON object pattern in the response
                  const jsonMatch = data.match(/(\{[\s\S]*\})/)
                  if (jsonMatch && jsonMatch[1]) {
                    const extractedJson = jsonMatch[1]
                    console.log(
                      'Extracted potential JSON:',
                      extractedJson.substring(0, 100) + '...'
                    )
                    return JSON.parse(extractedJson)
                  }
                } catch (extractError) {
                  console.error('Failed to extract JSON from login response:', extractError)
                }
                return data
              }
            }
            return data
          },
        ],
      })

      // Ensure proper format for the API request
      const response = await loginApi.post('/auth/login.php', {
        email,
        password,
        rememberMe: rememberMe,
      })

      // Log the raw response for debugging
      console.log('Login raw response:', response)

      // Handle different response formats
      let userData, token, refresh_token, expires_in

      if (response.data && typeof response.data === 'object') {
        if (response.data.success && response.data.token && response.data.user) {
          // Standard format
          ;({ token, refresh_token, expires_in, user: userData } = response.data)
        } else if (response.data.tokens && response.data.user) {
          // Alternative format with tokens object
          token = response.data.tokens.access_token || response.data.tokens.token
          refresh_token = response.data.tokens.refresh_token
          expires_in = response.data.tokens.expires_in || 3600
          userData = response.data.user
        } else {
          console.error('Login response has unexpected format:', response.data)
          throw new Error('Invalid login response structure from server')
        }
      } else {
        console.error('Login response is not a valid object:', response.data)
        throw new Error('Invalid login response from server')
      }

      // Validate essential data
      if (!token || !refresh_token || !userData || !userData.email) {
        console.error('Login response missing required data:', {
          hasToken: !!token,
          hasRefreshToken: !!refresh_token,
          hasUserData: !!userData,
          hasEmail: userData?.email,
        })
        throw new Error('Invalid login response: missing required authentication data')
      }

      console.log('Login response validation passed:', {
        success: true,
        hasToken: !!token,
        hasUserData: !!userData,
      })

      // Store new CSRF token if provided
      if (response.data.csrf_token) {
        CSRFManager.setToken(response.data.csrf_token)
      }

      // Store rememberMe preference first
      localStorage.setItem(REMEMBER_ME_KEY, rememberMe.toString())

      // Store tokens in both storages for resilience
      TokenStorage.storeAuthData(token, refresh_token, expires_in || 3600, rememberMe)

      // Format user data
      const formattedUser = formatUserData(userData)

      return {
        user: formattedUser,
        token,
        refresh_token,
        expires_in: expires_in || 3600,
      }
    } catch (error) {
      // Handle specific error cases
      if (error instanceof AxiosError && error.response) {
        console.error('Login failed with status:', error.response.status)
        console.error('Login error response:', error.response.data)

        // Handle rate limiting
        if (error.response.status === 429) {
          const retryAfter = error.response.headers['retry-after']
          const message =
            error.response.data?.message || 'Too many login attempts. Please try again later.'
          throw new ApiError(message, 429, 'RATE_LIMITED', {
            general: [`Rate limited: ${message}`],
            retryAfter: retryAfter ? [retryAfter] : ['60'],
          })
        }

        // Handle invalid credentials
        if (error.response.status === 401) {
          throw new ApiError(
            error.response.data?.message ||
              error.response.data?.error ||
              'Invalid email or password',
            401,
            'INVALID_CREDENTIALS'
          )
        }

        // Handle validation errors
        if (error.response.status === 422 && error.response.data?.errors) {
          throw new ValidationError(
            error.response.data?.message || 'Validation failed',
            error.response.data.errors
          )
        }

        // Check for CSRF token issues
        if (
          error.response.data &&
          error.response.data.message &&
          (error.response.data.message.includes('CSRF') ||
            error.response.data.message.includes('security token'))
        ) {
          // Try to recover by getting a new CSRF token
          await this.getCSRFToken(true)
          throw new ApiError('Authentication token expired. Please try again.')
        }

        // Handle other server errors with custom message if available
        if (error.response.data?.message || error.response.data?.error) {
          throw new ApiError(
            error.response.data?.message || error.response.data?.error || 'Login failed'
          )
        }

        throw new ApiError('Login failed. Please check your credentials and try again.')
      }

      // For network errors, provide a clear message
      if (error instanceof AxiosError && !error.response) {
        throw new ApiError(
          'Unable to connect to authentication server. Please check your network connection.'
        )
      }

      // Handle non-Axios errors
      throw new ApiError(
        error instanceof Error ? error.message : 'An unexpected error occurred during login'
      )
    }
  },

  /**
   * Logout user
   *
   * This function handles the logout process:
   * 1. Notifies the server about the logout (if a token is available)
   * 2. Clears all authentication tokens from both localStorage and sessionStorage
   * 3. Removes the CSRF token from sessionStorage
   *
   * The function clears tokens from both storage types to ensure a complete logout,
   * regardless of which storage was used during login. This prevents issues where
   * tokens might exist in multiple storage locations.
   *
   * @returns Promise with success status
   */
  async logout() {
    try {
      // Use the helper function to check if we have a token
      const hasToken = TokenStorage.getItem(TOKEN_KEY)

      // Only make the API call if we have a token
      if (hasToken) {
        try {
          // Use the token that exists for the API call
          await api.post('/auth/logout.php')
        } catch (apiError) {
          console.error('Logout API call failed, continuing with local logout', apiError)
        }
      }

      // Clear auth data from both storage types
      TokenStorage.clearAuthData()

      // Clear CSRF token as well
      CSRFManager.removeToken()

      // Keep remember me setting for UX consistency

      return { success: true }
    } catch (error) {
      // Even if API call fails, clear tokens from both storage types
      TokenStorage.clearAuthData()

      CSRFManager.removeToken()

      return handleApiError(error)
    }
  },

  /**
   * Register a new user
   */
  async registerUser(data: {
    email: string
    password: string
    firstName: string
    lastName: string
    phoneNumber?: string
    company?: string
  }) {
    try {
      // Validate inputs
      const emailErrors = validateEmail(data.email)
      const passwordErrors = validatePassword(data.password)

      if (emailErrors.length > 0 || passwordErrors.length > 0) {
        const errors: Record<string, string[]> = {}
        if (emailErrors.length > 0) errors.email = emailErrors
        if (passwordErrors.length > 0) errors.password = passwordErrors
        throw new ValidationError('Validation failed', errors)
      }

      // Use retry logic for the registration call
      const response = await executeWithRetry<AxiosResponse>(() =>
        this.api.post('/auth/register.php', {
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          phoneNumber: data.phoneNumber,
          company: data.company,
        })
      )

      return response.data
    } catch (err) {
      return handleApiError(err)
    }
  },

  /**
   * Request a password reset email
   */
  async requestPasswordReset(data: PasswordResetData) {
    const emailErrors = validateEmail(data.email)
    if (emailErrors.length > 0) {
      throw new ValidationError('Validation failed', { email: emailErrors })
    }

    try {
      const response = await api.post('/auth/request-password-reset.php', {
        email: data.email,
      })
      return response.data
    } catch (error) {
      return handleApiError(error)
    }
  },

  /**
   * Reset password with token
   */
  async resetPassword(data: PasswordResetData) {
    const errors: Record<string, string[]> = {}

    if (!data.token) {
      errors.token = ['Reset token is required']
    }
    if (data.newPassword) {
      errors.password = validatePassword(data.newPassword)
    } else {
      errors.password = ['New password is required']
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Validation failed', errors)
    }

    try {
      const response = await api.post('/auth/reset-password.php', {
        token: data.token,
        newPassword: data.newPassword,
      })
      return response.data
    } catch (error) {
      return handleApiError(error)
    }
  },

  /**
   * Refresh the auth token
   *
   * This function handles token refresh with the following features:
   * - Checks token expiry before attempting refresh
   * - Ensures CSRF token availability
   * - Implements retry logic for transient failures
   * - Maintains storage consistency
   * - Provides detailed error information
   */
  async refreshToken(): Promise<boolean> {
    const refreshToken = TokenStorage.getRefreshToken()
    if (!refreshToken) {
      console.error('No refresh token available')
      return false
    }

    try {
      // Ensure CSRF token
      await CSRFManager.ensureToken()
      const csrfToken = CSRFManager.getToken()

      const response = await axios.post(
        `${API_URL}/auth/refresh-token.php`,
        { refresh_token: refreshToken },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken || '',
          },
          timeout: 10000, // 10 second timeout
        }
      )

      if (!response.data?.success || !response.data?.token) {
        console.error('Invalid response from refresh token endpoint')
        return false
      }

      const { token, refresh_token, expires_in, user } = response.data

      // Store the new tokens using the same storage preference
      const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true'
      TokenStorage.storeAuthData(token, refresh_token, expires_in, rememberMe)

      // Update user data if available
      if (user) {
        TokenStorage.storeUserData(user)
      }

      console.log('Token refreshed successfully')
      return true
    } catch (error) {
      console.error('Failed to refresh token:', error)

      // Check for specific error cases
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log('Token refresh failed due to authorization error - clearing auth data')
          await TokenStorage.clearAuthData()
        }
      }

      return false
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(profileData: {
    firstName?: string
    lastName?: string
    email?: string
    phoneNumber?: string
    company?: string
  }): Promise<Partial<CharterhubUser>> {
    try {
      // Get current authentication token - use enhanced token retrieval
      const token = TokenStorage.getToken()
      if (!token) {
        console.error('[UPDATE PROFILE] No authentication token found')

        // Try refreshing the token first before failing
        const refreshed = await this.refreshToken()
        if (!refreshed) {
          console.error('[UPDATE PROFILE] Failed to refresh token')
          throw new Error('Authentication required')
        }

        // Get the refreshed token
        const refreshedToken = TokenStorage.getToken()
        if (!refreshedToken) {
          console.error('[UPDATE PROFILE] Still no token after refresh')
          throw new Error('Authentication required')
        }

        console.log('[UPDATE PROFILE] Successfully refreshed token')
      }

      // Get the current user data to compare with updated data
      const userData = TokenStorage.getUserData()
      if (!userData || !userData.id) {
        console.error('[UPDATE PROFILE] User data not available')
        throw new Error('User data not available')
      }

      // Check if email is being changed - we'll need this later
      const isEmailChanging = profileData.email && userData.email !== profileData.email

      if (isEmailChanging) {
        console.log(
          '[UPDATE PROFILE] Email change detected from:',
          userData.email,
          'to:',
          profileData.email
        )
      }

      try {
        // Get CSRF token for the request - might be legacy requirement
        await CSRFManager.ensureToken()
        const csrfToken = CSRFManager.getToken()

        if (!csrfToken) {
          console.warn('[UPDATE PROFILE] No CSRF token available, proceeding without it')
        }

        // Get the latest token after possible refresh
        const currentToken = TokenStorage.getToken()
        if (!currentToken) {
          throw new Error('Authentication token not available')
        }

        // Normalize profile data to ensure expected format
        const normalizedData = {
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          email: profileData.email,
          phoneNumber: profileData.phoneNumber,
          company: profileData.company,
        }

        console.log('[UPDATE PROFILE] Normalized data for backend:', JSON.stringify(normalizedData))

        // Create dedicated Axios client for this request
        const client = axios.create({
          timeout: 15000, // 15 seconds timeout
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentToken}`,
            ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
          },
        })

        // Implement retry mechanism for network errors
        let attempts = 0
        const maxAttempts = 3
        let lastError: any = null

        while (attempts < maxAttempts) {
          attempts++

          try {
            console.log(`[UPDATE PROFILE] Attempt ${attempts}/${maxAttempts}`)

            // Make the API request - ensure we're using the correct API base URL
            // Use the configured API_URL instead of hardcoding localhost:8000
            const response = await client.post(`${API_URL}/auth/update-profile.php`, normalizedData)

            // Process successful response
            const responseData = response.data
            const success = responseData && responseData.success

            if (success) {
              console.log('[UPDATE PROFILE] Profile update successful:', responseData)

              // Check for tokens in the response (will be present if email was changed)
              if (responseData.tokens) {
                console.log('[UPDATE PROFILE] Received new tokens after email change')

                // Extract token data using consistent naming regardless of response format
                const tokenData = {
                  token: responseData.tokens.access_token,
                  refreshToken: responseData.tokens.refresh_token,
                  expiresIn: responseData.tokens.expires_in || 3600,
                }

                // Get current "remember me" setting
                const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true'

                // Store the new tokens - always use the consistent storeAuthData method
                TokenStorage.storeAuthData(
                  tokenData.token,
                  tokenData.refreshToken,
                  tokenData.expiresIn,
                  rememberMe
                )

                console.log('[UPDATE PROFILE] New tokens stored successfully')
              }

              // Create a user object from the response data
              const returnData: Partial<CharterhubUser> = {
                id: responseData.user?.id || userData.id,
                email: responseData.user?.email || profileData.email || userData.email,
                firstName:
                  responseData.user?.firstName || profileData.firstName || userData.firstName,
                lastName: responseData.user?.lastName || profileData.lastName || userData.lastName,
                phoneNumber:
                  responseData.user?.phoneNumber || profileData.phoneNumber || userData.phoneNumber,
                company: responseData.user?.company || profileData.company || userData.company,
                displayName:
                  responseData.user?.displayName ||
                  `${profileData.firstName || userData.firstName || ''} ${profileData.lastName || userData.lastName || ''}`.trim(),
                role: responseData.user?.role || userData.role,
                verified:
                  responseData.user?.verified !== undefined
                    ? responseData.user.verified
                    : userData.verified,
              }

              console.log('[UPDATE PROFILE] Updated user data:', returnData)

              // Update stored user data with the latest values
              TokenStorage.storeUserData(returnData)

              return returnData
            } else {
              // Handle error responses where the request succeeded but the operation failed
              const errorMessage =
                responseData?.message || responseData?.error || 'Profile update failed'
              console.error('[UPDATE PROFILE] API returned error:', errorMessage)
              lastError = new Error(errorMessage)

              // Don't retry if it's a validation error or other client-side issue
              if (response.status >= 400 && response.status < 500) {
                break
              }

              // Wait before retrying
              await new Promise((resolve) => setTimeout(resolve, 1000 * attempts))
            }
          } catch (error: any) {
            console.error(`[UPDATE PROFILE] Attempt ${attempts} failed:`, error.message)
            lastError = error

            // Handle authentication errors - try to refresh the token and retry
            if (
              error.response &&
              (error.response.status === 401 || error.response.status === 403)
            ) {
              console.log('[UPDATE PROFILE] Authentication error, attempting to refresh token')
              const refreshed = await this.refreshToken()

              if (refreshed) {
                console.log('[UPDATE PROFILE] Token refreshed successfully, retrying request')
                // Update the client with the new token
                const newToken = TokenStorage.getToken()
                if (newToken) {
                  client.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
                  // Don't increment attempts for a token refresh retry
                  attempts--
                  await new Promise((resolve) => setTimeout(resolve, 500))
                  continue
                }
              }
            }

            // Only retry network errors, not server errors
            if (!error.response || error.response.status >= 500) {
              await new Promise((resolve) => setTimeout(resolve, 1000 * attempts))
              continue
            }

            // Don't retry client errors
            break
          }
        }

        // If we get here, all attempts failed
        throw lastError || new Error('Profile update failed after multiple attempts')
      } catch (error: any) {
        console.error('[UPDATE PROFILE] Request error:', error.message)
        throw error
      }
    } catch (error: any) {
      console.error('[UPDATE PROFILE] Error:', error)
      throw error
    }
  },

  /**
   * Verify email with token
   */
  async verifyEmail(token: string, email?: string) {
    const api = getApi(API_URL)
    
    try {
      const payload: any = { token }
      if (email) {
        payload.email = email
      }
      
      const response = await api.post('/auth/verify-email', payload)
      
      return {
        success: response.data.success,
        message: response.data.message,
        redirectUrl: response.data.redirectUrl,
      }
    } catch (error) {
      console.error('Email verification error:', error)
      return {
        success: false,
        message: 'Email verification failed. Please try again or contact support.',
      }
    }
  },

  // Test API methods for development and testing purposes
  async testAuthMethods() {
    console.log('Testing auth methods...')
    try {
      const results = {
        success: true,
        message: 'Auth methods tested successfully',
        tests: {
          csrf: false,
          login: false,
          refresh: false,
          profile: false
        }
      }
      
      // Test CSRF token
      const csrfResult = await this.getCSRFToken(true)
      results.tests.csrf = !!csrfResult.csrf_token
      
      // Additional test results can be added here
      
      return results
    } catch (error) {
      console.error('Error testing auth methods:', error)
      return {
        success: false,
        message: 'Auth methods test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

export default wpApi
