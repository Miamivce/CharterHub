import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { configureAxiosInstance } from '@/utils/axios-config'
import { TokenService } from './tokenService'

// Error types
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: Record<string, any>
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string, code?: string) {
    super(message, 401, code)
    this.name = 'AuthenticationError'
  }
}

export class ValidationError extends ApiError {
  constructor(
    message: string,
    public errors: Record<string, string[]>
  ) {
    super(message, 422, 'validation_error', { errors })
    this.name = 'ValidationError'
  }
}

// Storage constants
export const TOKEN_KEY = 'auth_token'
export const REFRESH_TOKEN_KEY = 'refresh_token' // Only used for storage detection, actual token is in HTTP-only cookie
export const TOKEN_EXPIRY_KEY = 'token_expiry'
export const REMEMBER_ME_KEY = 'remember_me'
export const USER_DATA_KEY = 'user_data'
export const RATE_LIMIT_KEY = 'rate_limit_info'
export const LAST_LOGIN_KEY = 'last_login'

// API URL configuration
const API_URL = import.meta.env.VITE_PHP_API_URL || 'http://localhost:8000'
const DEVELOPMENT_MODE = import.meta.env.MODE === 'development'

// User interfaces
export interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  fullName?: string
  phoneNumber?: string
  company?: string
  role: 'admin' | 'client'
  verified: boolean
  permissions?: Record<string, boolean>
  _lastUpdated?: number
  _timestamp?: number
  _original?: any // For debugging only
}

export interface UserProfileUpdateData {
  firstName?: string
  lastName?: string
  email?: string
  phoneNumber?: string
  company?: string
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  phoneNumber?: string
  company?: string
  role?: string
  rememberMe?: boolean
}

export interface PasswordResetData {
  token: string
  email: string
  newPassword: string
}

export interface TokenResponse {
  access_token: string
  expires_in: number
  token_type: string
}

interface LoginResponse extends TokenResponse {
  success: boolean
  message: string
  user: {
    id: number
    email: string
    first_name: string
    last_name: string
    role: string
    verified: boolean
    phone_number?: string
    company?: string
  }
}

// Storage helpers
const getStorageType = (): Storage => {
  const useLocalStorage = localStorage.getItem(REMEMBER_ME_KEY) === 'true'
  return useLocalStorage ? localStorage : sessionStorage
}

const TokenStorage = {
  getToken: (): string | null => {
    // Try the primary storage first
    const storage = getStorageType()
    let token = storage.getItem(TOKEN_KEY)
    
    // If not found, try the alternate storage
    if (!token || token === 'null' || token === 'undefined') {
      const altStorage = storage === localStorage ? sessionStorage : localStorage
      token = altStorage.getItem(TOKEN_KEY)
      
      // If found in alternate storage, move it to primary
      if (token && token !== 'null' && token !== 'undefined') {
        console.log('[TokenStorage] Found token in alternate storage, moving to primary')
        storage.setItem(TOKEN_KEY, token)
      }
    }
    
    // Final sanity check
    if (token === 'null' || token === 'undefined') {
      return null
    }
    
    return token
  },

  getTokenExpiry: (): number | null => {
    // Try the primary storage first
    const storage = getStorageType()
    const expiry = storage.getItem(TOKEN_EXPIRY_KEY)
    
    // If expiry found in primary storage
    if (expiry) {
      try {
        const parsed = parseInt(expiry, 10)
        return isNaN(parsed) ? null : parsed
      } catch (e) {
        console.error('[TokenStorage] Error parsing token expiry:', e)
      }
    }
    
    // If not in primary storage, try the alternate
    const altStorage = storage === localStorage ? sessionStorage : localStorage
    const altExpiry = altStorage.getItem(TOKEN_EXPIRY_KEY)
    
    if (altExpiry) {
      try {
        // Move to primary storage for consistency
        const parsed = parseInt(altExpiry, 10)
        if (!isNaN(parsed)) {
          storage.setItem(TOKEN_EXPIRY_KEY, altExpiry)
          return parsed
        }
      } catch (e) {
        console.error('[TokenStorage] Error parsing alternate token expiry:', e)
      }
    }
    
    return null
  },

  storeToken: (token: string, expiresIn: number, rememberMe?: boolean): void => {
    const storage =
      rememberMe !== undefined ? (rememberMe ? localStorage : sessionStorage) : getStorageType()

    if (rememberMe !== undefined) {
      localStorage.setItem(REMEMBER_ME_KEY, rememberMe.toString())
    }

    const expiryTime = Date.now() + expiresIn * 1000
    storage.setItem(TOKEN_KEY, token)
    storage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString())

    // If switching storage types, clear the other storage
    const otherStorage = storage === localStorage ? sessionStorage : localStorage
    otherStorage.removeItem(TOKEN_KEY)
    otherStorage.removeItem(TOKEN_EXPIRY_KEY)
    
    // Log token storage for debugging
    console.log(`[TokenStorage] Token stored in ${storage === localStorage ? 'localStorage' : 'sessionStorage'}, expires: ${new Date(expiryTime).toISOString()}`)
  },

  storeUserData: (userData: User): void => {
    // Create a clean copy to avoid storing circular references
    const userToStore = { ...userData }

    // Always ensure timestamps are present, but NEVER overwrite existing ones
    const nowTimestamp = Date.now()

    if (!userToStore._timestamp) {
      userToStore._timestamp = nowTimestamp
    }

    if (!userToStore._lastUpdated) {
      userToStore._lastUpdated = userToStore._timestamp || nowTimestamp
    }

    // In development mode, log only non-sensitive information
    if (process.env.NODE_ENV === 'development') {
      console.log('[TokenStorage] Storing user data with timestamp:', userToStore._timestamp)
    }

    // Store as JSON with special handling for dates to ensure consistent serialization
    const userJSON = JSON.stringify(userToStore)
    getStorageType().setItem(USER_DATA_KEY, userJSON)

    // For debugging - verify data was stored correctly (safe version)
    const storedDataRaw = getStorageType().getItem(USER_DATA_KEY)
    if (storedDataRaw) {
      try {
        const storedData = JSON.parse(storedDataRaw)
        const timestampsMatch = storedData._timestamp === userToStore._timestamp

        if (process.env.NODE_ENV === 'development') {
          console.log('[TokenStorage] Storage verification - timestamps match:', timestampsMatch)
        }

        if (!timestampsMatch) {
          console.warn('[TokenStorage] Storage verification failed - timestamps do not match')

          // Try one more time with a direct approach
          getStorageType().setItem(USER_DATA_KEY, userJSON)
        }
      } catch (e) {
        console.error('[TokenStorage] Failed to verify stored data')
      }
    }
  },

  getUserData: (): User | null => {
    // Try the primary storage first
    const storage = getStorageType()
    let data = storage.getItem(USER_DATA_KEY)
    
    // If not found in primary, try alternate
    if (!data) {
      const altStorage = storage === localStorage ? sessionStorage : localStorage
      data = altStorage.getItem(USER_DATA_KEY)
      
      // If found in alternate, move to primary
      if (data) {
        console.log('[TokenStorage] Found user data in alternate storage, moving to primary')
        storage.setItem(USER_DATA_KEY, data)
      }
    }
    
    if (!data) return null

    try {
      const user = JSON.parse(data) as User

      // Always ensure the user object has timestamps
      const nowTimestamp = Date.now()

      if (!user._timestamp) {
        user._timestamp = nowTimestamp
      }

      if (!user._lastUpdated) {
        user._lastUpdated = nowTimestamp
      }

      // In development mode, log minimal information
      if (process.env.NODE_ENV === 'development') {
        console.log('[TokenStorage] Retrieved user data with timestamp:', user._timestamp)
      }

      return user
    } catch (e) {
      console.error('[TokenStorage] Failed to parse user data from storage')
      return null
    }
  },

  clearToken: (): void => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(TOKEN_EXPIRY_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_EXPIRY_KEY)
  },

  clearUserData: (): void => {
    localStorage.removeItem(USER_DATA_KEY)
    sessionStorage.removeItem(USER_DATA_KEY)
  },

  clearAllData: (): void => {
    ;[localStorage, sessionStorage].forEach((storage) => {
      storage.removeItem(TOKEN_KEY)
      storage.removeItem(REFRESH_TOKEN_KEY)
      storage.removeItem(TOKEN_EXPIRY_KEY)
      storage.removeItem(USER_DATA_KEY)
      storage.removeItem(RATE_LIMIT_KEY)
    })
  },
}

// Helper function to convert snake_case API response to camelCase
const transformUserData = (data: any): User => {
  if (!data) return data;
  
  const userData: User = {
    id: data.id || 0,
    email: data.email || '',
    firstName: data.first_name || data.firstName || '',
    lastName: data.last_name || data.lastName || '',
    role: data.role || 'client',
    verified: data.verified || false,
    // Optional fields
    phoneNumber: data.phone_number || data.phoneNumber || '',
    company: data.company || '',
    // Add timestamp for tracking  
    _timestamp: Date.now(),
  }
  
  // ENHANCEMENT: Log warning if critical fields are missing
  if (!userData.firstName || userData.firstName.trim() === '') {
    console.warn('[jwtApi] Warning: User data missing firstName, using placeholder');
    userData.firstName = userData.id ? `User ${userData.id}` : 'User';
  }
  
  if (!userData.lastName || userData.lastName.trim() === '') {
    console.warn('[jwtApi] Warning: User data missing lastName, using placeholder');
    userData.lastName = userData.id ? `${userData.id}` : 'Unknown';
  }
  
  if (!userData.email || userData.email.trim() === '') {
    console.warn('[jwtApi] Warning: User data missing email, using placeholder');
    userData.email = 'missing@example.com';
  }
  
  // Generate the fullName from firstName and lastName
  userData.fullName = `${userData.firstName} ${userData.lastName}`.trim()
  if (userData.fullName === '') {
    userData.fullName = `User ${userData.id || ''}` 
  }
  
  // Add the original data for debugging if needed
  if (process.env.NODE_ENV === 'development') {
    userData._original = data
  }
  
  return userData
}

// API client creation
const createApiClient = (): AxiosInstance => {
  const client = configureAxiosInstance(
    axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 30000,
      withCredentials: true, // Required for HTTP-only refresh token cookie
    })
  )

  // Request interceptor for adding auth token
  client.interceptors.request.use(
    (config) => {
      // Ensure URL path starts with / for proper baseURL resolution
      if (config.url && !config.url.startsWith('/')) {
        config.url = '/' + config.url
        console.log(`[API] Normalized URL path to: ${config.url}`)
      }
      
      const token = TokenStorage.getToken()
      // Don't send 'null' or 'undefined' string tokens
      if (token && token !== 'null' && token !== 'undefined') {
        config.headers.Authorization = `Bearer ${token}`
        if (DEVELOPMENT_MODE) {
          console.log(`[API] ${config.method?.toUpperCase()} ${config.url} - Token present (${token.substring(0, 10)}...)`)
        }
      } else {
        if (DEVELOPMENT_MODE) {
          console.log(`[API] ${config.method?.toUpperCase()} ${config.url} - No valid token available`)
        }
      }

      // Convert PUT/DELETE methods to POST with X-HTTP-Method-Override header
      // This avoids CORS preflight issues with PUT/DELETE methods
      if (config.method?.toUpperCase() === 'PUT' || config.method?.toUpperCase() === 'DELETE') {
        config.headers['X-HTTP-Method-Override'] = config.method.toUpperCase()
        config.method = 'post'
        console.log(
          `[API] Converting ${config.headers['X-HTTP-Method-Override']} to POST with override header`
        )
      }

      if (DEVELOPMENT_MODE) {
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
          headers: { 
            ...config.headers,
            Authorization: config.headers.Authorization ? 'Bearer [REDACTED]' : undefined
          },
          data: config.data,
        })
      }

      return config
    },
    (error) => {
      console.error('[API] Request interceptor error:', error)
      return Promise.reject(error)
    }
  )

  // Response interceptor for error handling and token refresh
  client.interceptors.response.use(
    (response) => {
      // Check if response is JSON format
      const contentType = response.headers['content-type'] || ''
      if (!contentType.includes('application/json')) {
        console.warn(`[API] Non-JSON response from ${response.config.url}: ${contentType}`)
        console.log(`Received non-JSON response: ${response.status} ${contentType}`)
        
        // For GET requests, try to parse the response as JSON anyway
        if (response.config.method?.toLowerCase() === 'get') {
          try {
            // If response is string but valid JSON, parse it
            if (typeof response.data === 'string') {
              const parsedData = JSON.parse(response.data)
              response.data = parsedData
              console.log('[API] Successfully parsed string response as JSON')
            }
          } catch (e) {
            console.error('[API] Failed to parse response as JSON:', e)
            throw new Error('API returned invalid format')
          }
        }
      }
      
      if (DEVELOPMENT_MODE) {
        console.log(`[API] Response from ${response.config.url}:`, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data,
        })
      }
      return response
    },
    async (error: AxiosError) => {
      // Enhanced error logging with network details
      const errorInfo = {
        url: error.config?.url,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        code: error.code,
      }
      
      console.error('[API] Response error:', error)
      
      // Specifically detect CORS and network errors for better user feedback
      if (error.message === 'Network Error' || 
          error.code === 'ERR_NETWORK' || 
          error.code === 'ECONNABORTED' ||
          error.code === 'ERR_CANCELED') {
        
        console.error('[API] Possible CORS or network error:', {
          message: error.message,
          url: error.config?.url,
          code: error.code,
        })
      }

      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

      // Skip refresh logic if:
      // 1. We're already attempting to refresh a token
      // 2. This is a refresh token endpoint that failed
      // 3. This request has already been retried
      if (
        !originalRequest ||
        originalRequest._retry ||
        originalRequest.url?.includes('refresh-token')
      ) {
        return Promise.reject(handleErrorResponse(error))
      }

      // Rest of the error handling logic...
      return Promise.reject(handleErrorResponse(error))
    }
  )

  return client
}

// Handle and transform API errors
const handleErrorResponse = (error: AxiosError): Error => {
  // Network errors
  if (!error.response) {
    return new ApiError(error.message || 'Network error occurred', 0, 'network_error')
  }

  const { status, data } = error.response

  // Server response with error details
  const errorData = (data as Record<string, any>) || {}

  const errorMessage =
    typeof data === 'object' && data !== null
      ? (errorData.message as string) || (errorData.error as string) || 'An error occurred'
      : 'An error occurred'

  const errorCode =
    typeof data === 'object' && data !== null
      ? (errorData.code as string) || `status_${status}`
      : `status_${status}`

  // Handle validation errors
  if (status === 422 && typeof data === 'object' && data !== null && 'errors' in errorData) {
    return new ValidationError(errorMessage, errorData.errors as Record<string, string[]>)
  }

  // Handle authentication errors
  if (status === 401) {
    return new AuthenticationError(errorMessage, errorCode)
  }

  // Generic API error
  return new ApiError(errorMessage, status, errorCode, errorData)
}

// Initialize the API client
const apiClient = createApiClient()

// API service
const jwtApi = {
  /**
   * Get the current user's profile
   * @param forceRefresh When true, always fetches from API regardless of cache
   */
  async getCurrentUser(forceRefresh = false): Promise<User> {
    try {
      // First check for a valid token
      const token = TokenStorage.getToken()
      if (!token) {
        console.log('[jwtApi] getCurrentUser - No token available, skipping request')
        return Promise.reject(new Error('No auth token available'))
      }
      
      // NEW: Check if we're within the refresh window and have cached user data
      // Skip this check if forceRefresh is true
      if (!forceRefresh) {
        try {
          const userData = TokenService.getUserData();
          const isWithinWindow = TokenService.isWithinAuthRefreshWindow();
          
          // FIXED: Only use cached data if it contains ALL essential user information
          // This ensures we're not just using a minimal auth object with only ID
          if (userData && 
              userData.id && 
              userData.email && 
              userData.firstName && 
              userData.lastName && 
              userData.role && 
              isWithinWindow) {
            console.log('[jwtApi] getCurrentUser - Using complete cached user data within refresh window');
            console.log('[jwtApi] getCurrentUser - Cached user data timestamp:', userData._timestamp || 'none');
            
            // Return the cached data to prevent API request cancellation issues
            return Promise.resolve(userData);
          } else if (userData && userData.id && isWithinWindow) {
            console.log('[jwtApi] getCurrentUser - Found incomplete user data, forcing refresh');
          }
        } catch (cacheError) {
          console.warn('[jwtApi] getCurrentUser - Error checking cached data:', cacheError);
          // Continue with API request if cache check fails
        }
      } else {
        console.log('[jwtApi] getCurrentUser - Force refresh requested, skipping cache');
      }

      console.log('[jwtApi] getCurrentUser - Making request to /auth/me.php with token')
      
      // Set a timeout for the request - helps avoid requests hanging indefinitely
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const response = await apiClient
        .get('/auth/me.php', {
          signal: controller.signal,
        })
        .finally(() => {
          clearTimeout(timeoutId)
        })

      console.log('[jwtApi] getCurrentUser response:', {
        status: response.status,
        headers: response.headers,
        data: response.data,
      })

      if (response.data && response.data.success && response.data.user) {
        // Get existing user data to preserve _lastUpdated timestamp if it exists
        const existingUserData = TokenStorage.getUserData()
        const userData = transformUserData(response.data.user)

        // Add timestamp to force UI updates - always use a new timestamp when fetching from API
        userData._lastUpdated = Date.now()
        userData._timestamp = Date.now()

        console.log(
          '[jwtApi] getCurrentUser - User data retrieved with timestamp:',
          userData._lastUpdated
        )
        
        // CRITICAL FIX: Store user data in both localStorage and sessionStorage
        // This ensures we don't lose user data during navigation
        try {
          // Store in TokenStorage which handles the primary storage type
          TokenStorage.storeUserData(userData)
          
          // Force synchronization to ensure data exists in both storage types
          TokenService.syncStorageData()
          
          // Manually store user ID and role in both storage types
          localStorage.setItem('auth_user_id', userData.id.toString())
          localStorage.setItem('auth_user_role', userData.role)
          sessionStorage.setItem('auth_user_id', userData.id.toString())
          sessionStorage.setItem('auth_user_role', userData.role)
          
          // Double-check that user_data exists in both storage types
          if (!localStorage.getItem(USER_DATA_KEY)) {
            localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData))
          }
          if (!sessionStorage.getItem(USER_DATA_KEY)) {
            sessionStorage.setItem(USER_DATA_KEY, JSON.stringify(userData))
          }
          
          console.log('[jwtApi] getCurrentUser - Verified user data stored in both storage types')
        } catch (storageError) {
          console.error('[jwtApi] getCurrentUser - Error while storing user data:', storageError)
        }

        // Dispatch an event to notify components that user data has been refreshed
        window.dispatchEvent(
          new CustomEvent('jwt:userDataRefreshed', {
            detail: { user: userData },
          })
        )

        return userData
      } else {
        console.error('[jwtApi] getCurrentUser - Invalid response format:', response.data)
        throw new ApiError('Invalid response format', 500)
      }
    } catch (error: any) {
      // Improved error handling
      if (error.name === 'AbortError' || error.name === 'CanceledError' || 
          error.code === 'ERR_CANCELED' || error.message === 'canceled') {
        console.log('[jwtApi] getCurrentUser - Request aborted or canceled during navigation');
        // Return a special error that will be ignored by the ErrorBoundary
        const cancelError = new ApiError('canceled', 499);
        cancelError.name = 'CanceledError';
        return Promise.reject(cancelError);
      }
      
      // Handle 401 errors more gracefully
      if (error.response && error.response.status === 401) {
        console.log('[jwtApi] getCurrentUser - Authentication failed (401)')
        // Clear invalid token data
        TokenStorage.clearAllData()
        // Notify of authentication failure
        window.dispatchEvent(new CustomEvent('jwt:authFailure'))
        throw new AuthenticationError('Authentication failed or token expired')
      } else {
        console.error('[jwtApi] getCurrentUser error:', error)
        // For other errors, don't clear tokens
        throw error
      }
    }
  },

  /**
   * Authenticate a user with email and password
   */
  async login(
    email: string,
    password: string,
    rememberMe = false,
    targetRole?: 'admin' | 'client'
  ): Promise<User> {
    try {
      // Mask email for logging (show first 2 chars and domain)
      let maskedEmail = '***@***.com'
      if (email && email.includes('@')) {
        const emailParts = email.split('@')
        if (emailParts.length === 2) {
          maskedEmail = `${emailParts[0].substring(0, 2)}***@${emailParts[1]}`
        }
      }

      console.log('[jwtApi] Login attempt started with:', {
        email: maskedEmail,
        rememberMe,
        targetRole,
      })

      // Determine which endpoint to use based on targetRole
      // This allows frontend to explicitly target admin or client-only login
      let loginEndpoint = '/auth/login.php' // Default endpoint

      if (targetRole === 'admin') {
        console.log('[jwtApi] Using admin-specific login endpoint')
        loginEndpoint = '/auth/admin-login.php'
      } else if (targetRole === 'client') {
        console.log('[jwtApi] Using client-specific login endpoint')
        loginEndpoint = '/auth/client-login.php'
      }

      // Make login request
      console.log(`[jwtApi] Sending login request to ${loginEndpoint}`)
      const response = await apiClient.post(loginEndpoint, {
        email: email,
        password: password,
        remember_me: rememberMe,
      })

      console.log('[jwtApi] Login response status:', response.status)

      // FIXED: Handle response data with access_token (backend) vs token (frontend) mismatch
      if (response.data.success && (response.data.token || response.data.access_token) && response.data.user) {
        // Extract token from response - handle both naming conventions (token and access_token)
        const token = response.data.token || response.data.access_token;
        const refreshToken = response.data.refreshToken;
        const { user } = response.data;

        // Calculate token expiry (default to 30 minutes if not provided)
        const expiresIn = response.data.expires_in || 30 * 60 // 30 minutes in seconds
        
        // Store the access token according to the rememberMe preference
        TokenStorage.storeToken(token, expiresIn, rememberMe)

        // CRITICAL FIX: Properly transform and store user data
        // Create complete user object with all required fields
        const userData = transformUserData(user)
        
        // Store both minimum auth data and complete user data
        const userId = userData.id.toString()
        const userRole = userData.role

        // Store minimal auth data in both storage types for auth checks
        localStorage.setItem('auth_user_id', userId)
        localStorage.setItem('auth_user_role', userRole)
        sessionStorage.setItem('auth_user_id', userId)
        sessionStorage.setItem('auth_user_role', userRole)

        // Store complete user profile data according to remember preference
        // This follows the documented token storage strategy
        if (rememberMe) {
          localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData))
        } else {
          sessionStorage.setItem(USER_DATA_KEY, JSON.stringify(userData))
        }

        // Force sync data between storage types to prevent data loss
        TokenService.syncStorageData()

        console.log('[jwtApi] User authenticated successfully:', {
          id: userData.id,
          role: userData.role,
          name: `${userData.firstName} ${userData.lastName}`,
        })

        // Record successful login
        const loginTimestamp = Date.now().toString()
        localStorage.setItem(LAST_LOGIN_KEY, loginTimestamp)
        sessionStorage.setItem(LAST_LOGIN_KEY, loginTimestamp)

        // Dispatch an event to notify components that the user has been authenticated
        window.dispatchEvent(
          new CustomEvent('jwt:authSuccess', {
            detail: { user: userData },
          })
        )

        // Return the user data
        return userData
      } else {
        // Debug log for login failure - show what's missing in the response
        const responseDataSummary = {
          success: !!response.data.success,
          hasToken: !!(response.data.token || response.data.access_token),
          hasUser: !!response.data.user,
          fields: Object.keys(response.data)
        };
        console.error('[jwtApi] Login response validation failed:', responseDataSummary);
        throw new AuthenticationError(response.data.message || 'Authentication failed')
      }
    } catch (error) {
      console.error('[jwtApi] Login error:', error)
      throw handleErrorResponse(error)
    }
  },

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<User> {
    try {
      // Ensure firstName and lastName are properly set
      if (!data.firstName || !data.lastName) {
        throw new ApiError('First name and last name are required', 400)
      }

      console.log('[jwtApi] Attempting simplified registration with minimal-register.php');

      // Preparing data for minimal registration endpoint
      const requestData = {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber || '', 
        company: data.company || '',
        role: data.role || 'client',
      };

      console.log('[jwtApi] Registering user with data:', {
        ...requestData,
        password: '******', // Don't log actual password
      });

      // Use the minimal-register.php endpoint
      const response = await apiClient.post('/auth/minimal-register.php', requestData);
      
      console.log('[jwtApi] Registration response:', response.data);

      if (response.data.success) {
        // SECURITY FIX: Never store tokens or authenticate after registration
        // Even if the backend returns a token, don't store it

        // Explicitly clear any existing tokens to prevent accidental login
        TokenStorage.clearAllData();

        // Skip verification completely - remove development verification token generation
        // Users are already verified in the database (verified=1)
        
        // Create a minimal user object from registration data
        // but don't store it in TokenStorage
        const userRole: 'admin' | 'client' =
          data.role === 'admin' || data.role === 'client' ? data.role : 'client';

        return {
          id: response.data.user_id || 0,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          fullName: `${data.firstName} ${data.lastName}`.trim(),
          phoneNumber: data.phoneNumber || '',
          company: data.company || '',
          role: userRole,
          verified: true, // User is automatically verified
          permissions: {},
        };
      }

      console.error('[jwtApi] Registration failed:', response.data);
      throw new ApiError(response.data.message || 'Registration failed', response.status || 500);
    } catch (error) {
      console.error('[jwtApi] Registration error details:', error);
      return Promise.reject(error);
    }
  },

  /**
   * Log out the current user
   */
  async logout(): Promise<void> {
    try {
      console.log('[jwtApi] Logout process started');
      
      // First, immediately clear local storage to give instant UI feedback
      TokenStorage.clearAllData();
      
      // Then attempt to notify the server (but don't wait for it)
      try {
        // Set a short timeout to prevent hanging on logout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second max
        
        console.log('[jwtApi] Sending logout request to server');
        await apiClient.post('/auth/logout.php', {}, {
          signal: controller.signal,
        }).finally(() => {
          clearTimeout(timeoutId);
        });
        
        console.log('[jwtApi] Logout API call completed successfully');
      } catch (apiError) {
        console.warn('[jwtApi] Logout API call failed, but continuing with local logout:', apiError);
        // Continue with local logout even if API call fails
      }
      
      // Double-check that all auth data is cleared from both storage types
      [localStorage, sessionStorage].forEach(storage => {
        storage.removeItem(TOKEN_KEY);
        storage.removeItem(REFRESH_TOKEN_KEY);
        storage.removeItem(TOKEN_EXPIRY_KEY);
        storage.removeItem(USER_DATA_KEY);
        storage.removeItem('auth_user_id');
        storage.removeItem('auth_user_role');
      });
      
      // Dispatch a logout event
      window.dispatchEvent(new CustomEvent('jwt:logout'));
      
      console.log('[jwtApi] Logout process completed');
    } catch (error) {
      console.error('[jwtApi] Error during logout:', error);
      
      // Ensure data is cleared even if there's an error
      TokenStorage.clearAllData();
      
      // Re-throw the error for the caller to handle
      throw error;
    }
  },

  /**
   * Request a password reset for a user
   */
  async forgotPassword(email: string): Promise<void> {
    try {
      const response = await apiClient.post('/auth/forgot-password.php', { email })

      if (!response.data.success) {
        throw new ApiError(response.data.message || 'Failed to request password reset', 500)
      }

      return
    } catch (error) {
      return Promise.reject(error)
    }
  },

  /**
   * Reset a user's password using a reset token
   */
  async resetPassword(data: PasswordResetData): Promise<void> {
    try {
      const response = await apiClient.post('/auth/reset-password.php', {
        token: data.token,
        email: data.email,
        new_password: data.newPassword,
      })

      if (!response.data.success) {
        throw new ApiError(response.data.message || 'Failed to reset password', 500)
      }

      return
    } catch (error) {
      return Promise.reject(error)
    }
  },

  /**
   * Verify a user's email address using a verification token
   */
  async verifyEmail(token: string, email?: string): Promise<void> {
    try {
      // Special handling for development tokens
      if (token.startsWith('dev-')) {
        console.log('[jwtApi] Development verification token detected:', token)

        // Check if the token matches what's in session storage
        const storedEmail = sessionStorage.getItem('dev_verification_email')
        const storedToken = sessionStorage.getItem('dev_verification_token')

        if (storedToken === token && (email === undefined || storedEmail === email)) {
          console.log('[jwtApi] Development token validated successfully')

          // Use the actual email from storage if not provided
          const emailToVerify = email || storedEmail

          if (!emailToVerify) {
            throw new ApiError('No email address available for verification', 400)
          }

          console.log('[jwtApi] Making development verification API call for:', emailToVerify)

          try {
            // Make an actual API call to the backend to mark the user as verified
            // This is critical for development testing to update the database
            const response = await apiClient.post('/auth/dev-verify-account.php', {
              email: emailToVerify,
              dev_token: token,
            })

            console.log('[jwtApi] Development verification API response:', response.data)

            if (!response.data.success) {
              throw new ApiError(response.data.message || 'Verification failed', 400)
            }

            // Update the local user data too
            const userData = TokenStorage.getUserData()
            if (userData) {
              userData.verified = true
              TokenStorage.storeUserData(userData)
              console.log('[jwtApi] Updated local user data with verified status:', userData)
            }

            return
          } catch (error: any) {
            console.error('[jwtApi] Development verification API call failed:', error)

            // If we get a 404, the endpoint doesn't exist, so fall back to the old method
            if (error.response?.status === 404) {
              console.log(
                '[jwtApi] Development verification endpoint not found, using fallback method'
              )

              // Fallback: Update only local data and show a warning
              console.warn(
                '[jwtApi] WARNING: Only updating local verification status. Backend database will NOT be updated.'
              )

              const userData = TokenStorage.getUserData()
              if (userData) {
                userData.verified = true
                TokenStorage.storeUserData(userData)
                console.log('[jwtApi] Updated local user data with verified status:', userData)
              }

              return
            }

            // For other errors, throw them to be handled
            throw error
          }
        } else {
          console.error('[jwtApi] Development token validation failed', {
            storedToken,
            providedToken: token,
            storedEmail,
            providedEmail: email,
          })
          throw new ApiError('Invalid verification token', 400)
        }
      }

      // Normal API verification for production tokens
      // Build the URL with token and optional email parameter
      let verificationUrl = `/auth/verify-email.php?token=${encodeURIComponent(token)}`

      // Include email parameter if provided
      if (email) {
        verificationUrl += `&email=${encodeURIComponent(email)}`
      }

      console.log('[jwtApi] Verifying email with URL:', verificationUrl)

      // Using GET for the verification endpoint
      const response = await apiClient.get(verificationUrl)

      if (!response.data.success) {
        throw new ApiError(response.data.message || 'Failed to verify email', 500)
      }

      return
    } catch (error) {
      console.error('[jwtApi] Email verification error:', error)
      return Promise.reject(error)
    }
  },

  /**
   * Update the current user's profile
   */
  async updateProfile(profileData: UserProfileUpdateData): Promise<User> {
    try {
      console.log('[jwtApi] updateProfile starting with data:', profileData)

      // Convert from camelCase to snake_case for API
      const requestData = {
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        email: profileData.email,
        phone_number: profileData.phoneNumber,
        company: profileData.company,
      }

      console.log('[jwtApi] updateProfile sending request:', requestData)

      // Check if token exists before making the request
      const token = TokenStorage.getToken()
      console.log('[jwtApi] updateProfile token exists:', !!token)

      const response = await apiClient.post('/auth/update-profile.php', requestData)
      console.log('[jwtApi] updateProfile received response:', response.data)

      if (response.data.success && response.data.user) {
        // If the email was changed, a new token was issued
        if (response.data.access_token) {
          console.log('[jwtApi] updateProfile storing new token due to email change')
          TokenStorage.storeToken(response.data.access_token, response.data.expires_in || 3600)
        }

        // Transform the user data from snake_case to camelCase
        const userData = transformUserData(response.data.user)

        // Important: Use a dedicated timestamp for this update
        const updateTimestamp = Date.now()

        // Get the existing user data to check for timestamps before applying the update
        const existingUserData = TokenStorage.getUserData()

        // If we have existing user data, preserve some fields that aren't returned by the API
        if (existingUserData) {
          console.log(
            '[jwtApi] Found existing user data with timestamp:',
            existingUserData._timestamp
          )

          // Preserve any extra fields that might be used by the frontend
          // But ensure we're using fresh data for the updated profile fields
          Object.keys(existingUserData).forEach((key) => {
            if (
              key !== 'firstName' &&
              key !== 'lastName' &&
              key !== 'email' &&
              key !== 'phoneNumber' &&
              key !== 'company' &&
              key !== 'fullName' &&
              !(key in userData)
            ) {
              // Use type assertion to treat the objects as Record<string, any>
              ;(userData as Record<string, any>)[key] = (existingUserData as Record<string, any>)[
                key
              ]
            }
          })
        }

        // Always update the timestamp to reflect this change
        userData._timestamp = updateTimestamp
        userData._lastUpdated = updateTimestamp

        console.log('[jwtApi] updateProfile final user data with timestamp:', userData._timestamp)

        // Store the updated user data
        TokenStorage.storeUserData(userData)
        return userData
      }

      console.error(
        '[jwtApi] updateProfile failed: Response success or user data missing',
        response.data
      )
      throw new ApiError('Failed to update profile', 500)
    } catch (error) {
      console.error('[jwtApi] updateProfile caught error:', error)
      return Promise.reject(error)
    }
  },

  /**
   * Change the current user's password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      console.log('[jwtApi] Attempting to change password')

      const response = await apiClient.post('/auth/change-password.php', {
        current_password: currentPassword,
        new_password: newPassword,
      })

      console.log('[jwtApi] Password change response:', response.data)

      // Check for PHP errors in the response (which might be HTML)
      if (typeof response.data === 'string') {
        console.error('[jwtApi] Unexpected string response:', response.data)

        if (
          response.data.includes('Fatal error') ||
          response.data.includes('Parse error') ||
          response.data.includes('Warning:')
        ) {
          console.error('[jwtApi] PHP error detected in response')
          throw new ApiError(
            'Server error: The password change endpoint has an implementation issue. Please contact support.',
            500
          )
        }

        // For any other unexpected string response
        throw new ApiError(
          'Server error: Received unexpected response format. Please try again later.',
          500
        )
      }

      // Check for success flag in response
      if (!response.data || !response.data.success) {
        // If the API returns a failure but not an HTTP error
        const errorMessage = response.data?.message || 'Failed to change password'
        console.error('[jwtApi] Password change failed:', errorMessage)
        throw new ApiError(errorMessage, response.data?.code || 400)
      }

      // If the password change was successful, update the token
      if (response.data.access_token) {
        console.log('[jwtApi] Updating token after password change')
        TokenStorage.storeToken(response.data.access_token, response.data.expires_in || 3600)
      }

      console.log('[jwtApi] Password changed successfully')
      return
    } catch (error: any) {
      console.error('[jwtApi] Password change error:', error)

      // Check for specific error responses
      if (error.response) {
        const status = error.response.status
        const data = error.response.data || {}

        // Detected HTML response (likely PHP error)
        if (
          typeof error.response.data === 'string' &&
          (error.response.data.includes('<!DOCTYPE html>') ||
            error.response.data.includes('Fatal error') ||
            error.response.data.includes('Parse error') ||
            error.response.data.includes('Warning:'))
        ) {
          console.error('[jwtApi] PHP error detected in response:', error.response.data)
          throw new ApiError(
            'Server error: The password change endpoint has an implementation issue. Please contact support.',
            500
          )
        }

        // Handle 401 Unauthorized (likely incorrect current password)
        if (status === 401) {
          throw new AuthenticationError(data.message || 'Current password is incorrect')
        }

        // Handle other API errors
        throw new ApiError(data.message || 'Failed to change password', status, data.code)
      }

      // Re-throw the original error if it's not an API response error
      return Promise.reject(error)
    }
  },

  /**
   * Check if the current authentication is valid
   */
  async verifyAuthentication(): Promise<boolean> {
    try {
      const response = await apiClient.get('/auth/is-authenticated.php')
      return response.data.success && response.data.authenticated === true
    } catch (error) {
      return false
    }
  },

  /**
   * Refresh the authentication tokens
   */
  async refreshTokens(): Promise<boolean> {
    try {
      // Check if a refresh token cookie should exist
      const refreshIndicator =
        localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY)
      if (!refreshIndicator) {
        console.log('[jwtApi] refreshTokens - No refresh token indicator, skipping refresh')
        return false
      }

      const response = await apiClient.post('/auth/refresh-token.php')

      // FIXED: Support both token naming conventions for consistency
      if (response.data.success && (response.data.token || response.data.access_token)) {
        const token = response.data.token || response.data.access_token;
        TokenStorage.storeToken(token, response.data.expires_in || 3600)
        
        // Log successful refresh
        console.log('[jwtApi] Token refresh successful, new token stored');

        // Update stored user data if available
        if (response.data.user) {
          const userData = transformUserData(response.data.user)
          TokenStorage.storeUserData(userData)
          console.log('[jwtApi] User data updated during token refresh');
        }

        return true
      }

      console.log('[jwtApi] Token refresh failed - response missing required data:', {
        success: !!response.data.success,
        hasToken: !!(response.data.token || response.data.access_token)
      });
      return false
    } catch (error: any) {
      // If we get a 401, the refresh token is invalid or expired
      if (error.response && error.response.status === 401) {
        console.log('[jwtApi] Token refresh failed (401) - clearing storage')
        // Clear all token data since refresh token is invalid
        TokenStorage.clearAllData()
      } else {
        console.error('Token refresh failed', error)
      }
      return false
    }
  },

  /**
   * Test CORS configuration
   * @returns Object with success status and message
   */
  async testCors(): Promise<{ success: boolean; message: string }> {
    try {
      const client = createApiClient();
      const response = await client.get('/api/test-cors');
      return {
        success: true,
        message: response.data.message || 'CORS test successful'
      };
    } catch (error) {
      console.error('[jwtApi] CORS test failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export the refreshTokens function for the interceptor
export const refreshTokens = jwtApi.refreshTokens

// Add a new function to validate token and user data
// This function can be used by other components to check auth status
export const validateAuthState = (): {
  isAuthenticated: boolean
  user: User | null
  tokenExists: boolean
  tokenExpired: boolean
} => {
  try {
    // Get token and token expiry with enhanced storage checks
    const token = TokenStorage.getToken()
    const tokenExpiry = TokenStorage.getTokenExpiry()
    const userData = TokenStorage.getUserData()

    const tokenExists = !!token && token !== 'null' && token !== 'undefined'

    // Improved token expiration check
    let tokenExpired = true
    if (tokenExists && tokenExpiry) {
      // Add 10-second safety margin for expiry
      const safetyMargin = 10000 // 10 seconds in milliseconds
      const now = Date.now()
      const expiryTime = tokenExpiry - safetyMargin

      // Log expiry times for debugging
      console.log('[jwtApi] Token expiry check:', {
        now: new Date(now).toISOString(),
        expiry: new Date(tokenExpiry).toISOString(),
        expiryWithSafetyMargin: new Date(expiryTime).toISOString(),
        hasExpired: now > expiryTime,
        timeRemainingMs: expiryTime - now,
      })

      tokenExpired = now > expiryTime
    }

    // Enhanced userExists check: Try both stored userData and re-fetch if needed
    let userExists = !!userData && !!userData.id
    
    // If token is valid but no user data, try to retrieve it from storage again
    // This helps with page refreshes where user data might not be immediately available
    if (tokenExists && !tokenExpired && !userExists) {
      // Attempt to get from storage one more time
      const retryUserData = TokenStorage.getUserData()
      userExists = !!retryUserData && !!retryUserData.id
      
      // Log the retry attempt
      console.log('[jwtApi] Token valid but no user data, retry retrieval:', { 
        success: userExists, 
        hasData: !!retryUserData 
      })
    }

    // If token is expired, trigger cleanup
    if (tokenExists && tokenExpired) {
      console.log('[jwtApi] Token is expired, triggering cleanup event')
      window.dispatchEvent(new CustomEvent('jwt:tokenExpired'))
    }

    const isAuthenticated = tokenExists && !tokenExpired && userExists
    
    // Log the final authentication state for debugging
    console.log('[jwtApi] Authentication state validation result:', {
      isAuthenticated,
      tokenExists,
      tokenExpired,
      userExists,
      tokenLength: token ? token.length : 0,
    })

    return {
      isAuthenticated,
      user: userExists ? userData : null,
      tokenExists,
      tokenExpired,
    }
  } catch (error) {
    console.error('[jwtApi] Error validating auth state:', error)
    // Default to unauthenticated state on error
    return {
      isAuthenticated: false,
      user: null,
      tokenExists: false,
      tokenExpired: true
    }
  }
}

// Export TokenStorage with this validation helper
export { TokenStorage }

export default jwtApi
