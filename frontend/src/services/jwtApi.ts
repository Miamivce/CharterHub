import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { configureAxiosInstance } from '@/utils/axios-config'

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
    return getStorageType().getItem(TOKEN_KEY)
  },

  getTokenExpiry: (): number | null => {
    const expiry = getStorageType().getItem(TOKEN_EXPIRY_KEY)
    if (!expiry) return null

    try {
      return parseInt(expiry, 10)
    } catch (e) {
      console.error('[TokenStorage] Error parsing token expiry:', e)
      return null
    }
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
    const data = getStorageType().getItem(USER_DATA_KEY)
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
    getStorageType().removeItem(TOKEN_KEY)
    getStorageType().removeItem(TOKEN_EXPIRY_KEY)
  },

  clearUserData: (): void => {
    getStorageType().removeItem(USER_DATA_KEY)
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
  if (!data) {
    console.error('[jwtApi] transformUserData received null or undefined data')
    return {} as User
  }

  // Don't log sensitive user data in production
  // In development, mask email and other sensitive fields
  if (process.env.NODE_ENV === 'development') {
    // Create a sanitized version for logging by masking sensitive fields
    const sanitizedData = { ...data }
    if (sanitizedData.email) {
      // Mask email (show first 2 chars and domain)
      const emailParts = sanitizedData.email.split('@')
      if (emailParts.length === 2) {
        sanitizedData.email = `${emailParts[0].substring(0, 2)}***@${emailParts[1]}`
      } else {
        sanitizedData.email = '***@***.com'
      }
    }
    if (sanitizedData.phone_number || sanitizedData.phoneNumber) {
      // Mask phone number (show only last 4 digits)
      const phone = sanitizedData.phone_number || sanitizedData.phoneNumber
      sanitizedData.phone_number = sanitizedData.phoneNumber = `****${phone.slice(-4)}`
    }
    console.log('[jwtApi] Processing user data with masked fields')
  }

  const result = {
    id: data.id,
    email: data.email,
    firstName: data.first_name || data.firstName || '',
    lastName: data.last_name || data.lastName || '',
    fullName:
      data.full_name ||
      `${data.first_name || data.firstName || ''} ${data.last_name || data.lastName || ''}`.trim(),
    phoneNumber: data.phone_number || data.phoneNumber || '',
    company: data.company || '',
    role: (data.role as 'admin' | 'client') || 'client',
    verified: !!data.verified,
    permissions: data.permissions || {},
  }

  // Only log non-sensitive information in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[jwtApi] User data processed successfully')
  }

  return result
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
      const token = TokenStorage.getToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
        if (DEVELOPMENT_MODE) {
          console.log(`[API] ${config.method?.toUpperCase()} ${config.url} - Token present`)
        }
      } else {
        if (DEVELOPMENT_MODE) {
          console.log(`[API] ${config.method?.toUpperCase()} ${config.url} - No token available`)
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
          headers: config.headers,
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
      console.error('[API] Response error:', {
        url: error.config?.url,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      })

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

      // Handle 401 Unauthorized errors by attempting to refresh the token
      if (error.response?.status === 401) {
        try {
          originalRequest._retry = true

          // Attempt to refresh the token
          const refreshSuccess = await refreshTokens()

          if (!refreshSuccess) {
            console.log('[API] Token refresh failed, clearing auth data and redirecting to login')
            // Clear all auth data
            TokenStorage.clearAllData()

            // Signal that authentication has failed
            window.dispatchEvent(
              new CustomEvent('jwt:authFailure', {
                detail: { reason: 'token_expired' },
              })
            )

            // Force redirect to login page after a short delay
            setTimeout(() => {
              const isAdminPage = window.location.pathname.includes('/admin')
              const loginPath = isAdminPage ? '/admin/login' : '/login'

              // Try React Router navigation first
              try {
                // Direct navigation as fallback
                window.location.href = loginPath
              } catch (e) {
                console.error('[API] Navigation error, using direct location change', e)
                window.location.href = loginPath
              }
            }, 100)

            return Promise.reject(new AuthenticationError('Session expired. Please log in again.'))
          }

          // If token refresh succeeds, update the Authorization header and retry
          const newToken = TokenStorage.getToken()
          if (newToken && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
          }

          // Retry the original request
          return axios(originalRequest)
        } catch (refreshError) {
          // If token refresh fails, clear auth data and reject with original error
          TokenStorage.clearAllData()

          // Signal that authentication has failed completely
          window.dispatchEvent(
            new CustomEvent('jwt:authFailure', {
              detail: { reason: 'refresh_failed' },
            })
          )

          // Force redirect to login page after a short delay
          setTimeout(() => {
            const isAdminPage = window.location.pathname.includes('/admin')
            const loginPath = isAdminPage ? '/admin/login' : '/login'
            window.location.href = loginPath
          }, 100)

          return Promise.reject(handleErrorResponse(error))
        }
      }

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
   */
  async getCurrentUser(): Promise<User> {
    try {
      // Check if token exists before making the request
      const token = TokenStorage.getToken()
      if (!token) {
        console.log('[jwtApi] getCurrentUser - No token available, skipping request')
        return Promise.reject(new AuthenticationError('Not authenticated'))
      }

      // Log before making the request
      console.log('[jwtApi] getCurrentUser - Making request to /auth/me.php with token')

      // Add a timeout to prevent the request from hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

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
        TokenStorage.storeUserData(userData)

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
      if (error.name === 'AbortError') {
        console.error('[jwtApi] getCurrentUser - Request timed out')
        throw new ApiError('Request timed out', 408)
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

      // Using the appropriate login endpoint
      const response = await apiClient.post<LoginResponse>(loginEndpoint, {
        email,
        password,
      })

      // Log only status without exposing tokens or user data
      console.log(`[jwtApi] Login response status: ${response.status}`, {
        success: response.data.success,
        hasToken: !!response.data.access_token,
        hasUserData: !!response.data.user,
      })

      if (response.data.success && response.data.access_token) {
        console.log('[jwtApi] Login successful, storing authentication data')

        // Store the access token (refresh token is stored as HTTP-only cookie)
        TokenStorage.storeToken(response.data.access_token, response.data.expires_in, rememberMe)

        // Store the user data
        const userData = transformUserData(response.data.user)

        // Sanitized log of user data (no token or personal details)
        if (process.env.NODE_ENV === 'development') {
          console.log('[jwtApi] User data processed', {
            id: userData.id,
            role: userData.role,
            isVerified: userData.verified,
          })
        }

        TokenStorage.storeUserData(userData)

        // Verify the storage (without logging the actual values)
        const storedToken = TokenStorage.getToken()
        const storedUser = TokenStorage.getUserData()
        console.log('[jwtApi] Storage verification:', {
          hasToken: !!storedToken,
          tokenLength: storedToken?.length || 0,
          hasUser: !!storedUser,
        })

        return userData
      } else {
        throw new Error(response.data.message || 'Login failed: Invalid response from server')
      }
    } catch (error) {
      console.error('[jwtApi] Login error:', error)
      return Promise.reject(error)
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
      // Call the logout endpoint to invalidate tokens
      await apiClient.post('/auth/logout.php')
    } catch (error) {
      console.error('Logout API call failed', error)
      // Continue with local logout even if the API call fails
    } finally {
      // Clear all local auth data
      TokenStorage.clearAllData()
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

      if (response.data.success && response.data.access_token) {
        TokenStorage.storeToken(response.data.access_token, response.data.expires_in || 3600)

        // Update stored user data if available
        if (response.data.user) {
          const userData = transformUserData(response.data.user)
          TokenStorage.storeUserData(userData)
        }

        return true
      }

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
  const token = TokenStorage.getToken()
  const tokenExpiry = TokenStorage.getTokenExpiry()
  const userData = TokenStorage.getUserData()

  const tokenExists = !!token

  // Improved token expiration check
  let tokenExpired = true
  if (tokenExpiry) {
    // Add 10-second safety margin (tokenExpiry is already a number from getTokenExpiry)
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

  const userExists = !!userData && !!userData.id

  // If token is expired, trigger cleanup
  if (tokenExists && tokenExpired) {
    console.log('[jwtApi] Token is expired, triggering cleanup event')
    window.dispatchEvent(new CustomEvent('jwt:tokenExpired'))
  }

  return {
    isAuthenticated: tokenExists && !tokenExpired && userExists,
    user: userExists ? userData : null,
    tokenExists,
    tokenExpired,
  }
}

// Export TokenStorage with this validation helper
export { TokenStorage }

export default jwtApi
