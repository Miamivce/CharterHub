import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'
import jwtApi, {
  User,
  TokenStorage,
  ApiError,
  AuthenticationError,
  UserProfileUpdateData,
  RegisterData,
  PasswordResetData,
  validateAuthState,
} from '@/services/jwtApi'

// Auth state interface
export interface AuthState {
  isInitialized: boolean
  isAuthenticated: boolean
  user: User | null
}

// Loading states type definition
export type LoadingStates = {
  login: boolean
  logout: boolean
  register: boolean
  forgotPassword: boolean
  resetPassword: boolean
  verifyEmail: boolean
  updateProfile: boolean
  changePassword: boolean
  refreshUserData: boolean
}

// Auth error states type definition
export type AuthErrors = {
  login: Error | null
  logout: Error | null
  register: Error | null
  forgotPassword: Error | null
  resetPassword: Error | null
  verifyEmail: Error | null
  updateProfile: Error | null
  changePassword: Error | null
  refreshUserData: Error | null
}

// Auth context interface
export interface JWTAuthContextType extends AuthState {
  // Auth methods
  login: (
    email: string,
    password: string,
    rememberMe?: boolean,
    targetRole?: 'admin' | 'client'
  ) => Promise<User>
  logout: () => Promise<void>
  register: (data: RegisterData) => Promise<User>
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (data: PasswordResetData) => Promise<void>
  verifyEmail: (token: string, email?: string) => Promise<boolean>
  updateProfile: (
    data: UserProfileUpdateData,
    onUpdateSuccess?: (user: User) => void
  ) => Promise<User>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  refreshUserData: () => Promise<User | null>
  // Aliases for backward compatibility
  refreshUser: () => Promise<User | null> // Alias for refreshUserData
  // Loading and error states
  loading: LoadingStates
  errors: AuthErrors
  // Simplified loading and error accessors
  isLoading: boolean // Overall loading state
  error: string | null // Latest error message
}

// Create auth context
export const JWTAuthContext = createContext<JWTAuthContextType | null>(null)

// Auth types
export const AUTH_TYPES = {
  INITIALIZE: 'INITIALIZE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  REGISTER: 'REGISTER',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  USER_DATA_UPDATED: 'USER_DATA_UPDATED',
}

// Initial auth state
const initialAuthState: AuthState = {
  isInitialized: false,
  isAuthenticated: false,
  user: null,
}

// Auth reducer
const authReducer = (state: AuthState, action: any) => {
  switch (action.type) {
    case AUTH_TYPES.INITIALIZE: {
      const { isAuthenticated, user } = action.payload
      // Create a deep clone of the user object with a timestamp
      const deepClonedUser = user
        ? {
            ...JSON.parse(JSON.stringify(user)),
            _timestamp: Date.now(),
          }
        : null

      return {
        ...state,
        isInitialized: true,
        isAuthenticated,
        user: deepClonedUser,
      }
    }
    case AUTH_TYPES.LOGIN: {
      const { user } = action.payload
      // Create a deep clone of the user object with a timestamp
      const deepClonedUser = user
        ? {
            ...JSON.parse(JSON.stringify(user)),
            _timestamp: Date.now(),
          }
        : null

      return {
        ...state,
        isAuthenticated: true,
        user: deepClonedUser,
      }
    }
    case AUTH_TYPES.LOGOUT: {
      return {
        ...state,
        isAuthenticated: false,
        user: null,
      }
    }
    case AUTH_TYPES.REGISTER: {
      // Modified to NOT authenticate users after registration
      // Users must verify their email first
      return {
        ...state,
        isAuthenticated: false, // Keep this false - users need to verify and login
        user: null, // Don't store user data after registration
      }
    }
    case AUTH_TYPES.UPDATE_PROFILE: {
      const { user } = action.payload

      // Create a deep clone of the user object with a timestamp
      const deepClonedUser = user
        ? {
            ...JSON.parse(JSON.stringify(user)),
            _timestamp: Date.now(),
          }
        : null

      return {
        ...state,
        user: deepClonedUser,
      }
    }
    case AUTH_TYPES.LOGIN_SUCCESS: {
      const { user } = action.payload
      return {
        ...state,
        isAuthenticated: true,
        user: user,
      }
    }
    case AUTH_TYPES.USER_DATA_UPDATED: {
      const { user } = action.payload
      return {
        ...state,
        user: user,
      }
    }
    default: {
      return { ...state }
    }
  }
}

// Props for the auth provider
export interface AuthProviderProps {
  children: React.ReactNode
}

export const JWTAuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialAuthState)
  const [loading, setLoading] = useState<LoadingStates>({
    login: false,
    logout: false,
    register: false,
    forgotPassword: false,
    resetPassword: false,
    verifyEmail: false,
    updateProfile: false,
    changePassword: false,
    refreshUserData: false,
  })
  const [errors, setErrors] = useState<AuthErrors>({
    login: null,
    logout: null,
    register: null,
    forgotPassword: null,
    resetPassword: null,
    verifyEmail: null,
    updateProfile: null,
    changePassword: null,
    refreshUserData: null,
  })

  const isMounted = useRef(true)

  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  // Listen for authentication events
  useEffect(() => {
    const handleAuthFailure = (event: Event) => {
      console.log('[JWTAuthContext] Auth failure event received')

      // Extract the reason from the event if available
      const customEvent = event as CustomEvent<{ reason?: string }>
      const reason = customEvent.detail?.reason || 'unknown'

      console.log('[JWTAuthContext] Auth failure reason:', reason)

      // Clear auth data
      TokenStorage.clearAllData()

      if (isMounted.current) {
        dispatch({
          type: AUTH_TYPES.LOGOUT,
        })
      }

      // Redirect to login page based on current URL path
      const isAdminPage = window.location.pathname.includes('/admin')
      const loginPath = isAdminPage ? '/admin/login' : '/login'

      // Delay redirect slightly to allow state to update
      setTimeout(() => {
        console.log('[JWTAuthContext] Redirecting to login page:', loginPath)
        window.location.href = loginPath
      }, 100)
    }

    const handleTokenExpired = () => {
      console.log('[JWTAuthContext] Token expired event received')

      // Clear auth data
      TokenStorage.clearAllData()

      if (isMounted.current) {
        dispatch({
          type: AUTH_TYPES.LOGOUT,
        })
      }

      // Redirect to login page based on current URL path
      const isAdminPage = window.location.pathname.includes('/admin')
      const loginPath = isAdminPage ? '/admin/login' : '/login'

      // Delay redirect slightly to allow state to update
      setTimeout(() => {
        console.log('[JWTAuthContext] Redirecting to login page after token expiration:', loginPath)
        window.location.href = loginPath
      }, 100)
    }

    const handleAuthSuccess = (e: CustomEvent<{ user: User }>) => {
      if (isMounted.current) {
        console.log('[JWTAuthContext] Auth success event received with user data')

        dispatch({
          type: AUTH_TYPES.LOGIN_SUCCESS,
          payload: {
            user: e.detail.user,
          },
        })
      }
    }

    const handleUserDataRefreshed = (e: CustomEvent<{ user: User }>) => {
      if (isMounted.current) {
        console.log('[JWTAuthContext] User data refreshed event received')

        dispatch({
          type: AUTH_TYPES.USER_DATA_UPDATED,
          payload: {
            user: e.detail.user,
          },
        })
      }
    }

    // Add event listeners
    window.addEventListener('jwt:authFailure', handleAuthFailure)
    window.addEventListener('jwt:tokenExpired', handleTokenExpired)
    window.addEventListener('jwt:authSuccess', handleAuthSuccess as EventListener)
    window.addEventListener('jwt:userDataRefreshed', handleUserDataRefreshed as EventListener)

    // Clean up
    return () => {
      window.removeEventListener('jwt:authFailure', handleAuthFailure)
      window.removeEventListener('jwt:tokenExpired', handleTokenExpired)
      window.removeEventListener('jwt:authSuccess', handleAuthSuccess as EventListener)
      window.removeEventListener('jwt:userDataRefreshed', handleUserDataRefreshed as EventListener)
    }
  }, [])

  // Initialize authentication
  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('[JWTAuthContext] Initializing authentication')

        // Use our comprehensive auth state validation helper
        const authState = validateAuthState()
        console.log('[JWTAuthContext] Auth state validation result:', {
          isAuthenticated: authState.isAuthenticated,
          tokenExists: authState.tokenExists,
          tokenExpired: authState.tokenExpired,
          hasUser: !!authState.user,
        })

        // Special handling for token exists but no user data scenario
        if (authState.tokenExists && !authState.tokenExpired && !authState.user) {
          console.log('[JWTAuthContext] Valid token exists but no user data, attempting to fetch user data')
          try {
            // Try to get user data from API since we have a valid token
            const user = await jwtApi.getCurrentUser()
            if (user && user.id) {
              console.log('[JWTAuthContext] Successfully retrieved user data with valid token')
              // Store the user data
              TokenStorage.storeUserData(user)
              
              if (isMounted.current) {
                dispatch({
                  type: AUTH_TYPES.INITIALIZE,
                  payload: {
                    isAuthenticated: true,
                    user,
                  },
                })
                return
              }
            }
          } catch (userError) {
            console.error('[JWTAuthContext] Failed to fetch user data despite valid token:', userError)
          }
        }

        // If not authenticated according to our validation, initialize as unauthenticated
        if (!authState.isAuthenticated) {
          if (isMounted.current) {
            console.log('[JWTAuthContext] Not authenticated, initializing as unauthenticated')
            dispatch({
              type: AUTH_TYPES.INITIALIZE,
              payload: {
                isAuthenticated: false,
                user: null,
              },
            })
          }
          return
        }

        // We have valid auth state, initialize with the user from storage
        if (isMounted.current && authState.user) {
          console.log('[JWTAuthContext] Authenticated with valid user data, initializing')
          dispatch({
            type: AUTH_TYPES.INITIALIZE,
            payload: {
              isAuthenticated: true,
              user: authState.user,
            },
          })
        }

        // Then try to refresh from API as a background operation
        try {
          console.log('[JWTAuthContext] Fetching fresh user data from API')
          const user = await jwtApi.getCurrentUser()

          if (isMounted.current) {
            console.log('[JWTAuthContext] User data refreshed from API:', user)
            // Force isAuthenticated to true when we get successful user data
            dispatch({
              type: AUTH_TYPES.INITIALIZE,
              payload: {
                isAuthenticated: true,
                user,
              },
            })

            // Dispatch an explicit login success event to ensure proper state update
            dispatch({
              type: AUTH_TYPES.LOGIN_SUCCESS,
              payload: {
                user,
              },
            })

            // Trigger a global event to notify other components
            window.dispatchEvent(new CustomEvent('jwt:authSuccess', { detail: { user } }))
          }
        } catch (refreshError: unknown) {
          console.error('[JWTAuthContext] Failed to fetch user data from API:', refreshError)

          // Check if the error is an Axios error with a 401 status
          const axiosError = refreshError as { response?: { status?: number } }
          if (axiosError?.response?.status === 401) {
            console.log('[JWTAuthContext] Token rejected (401) - clearing auth data')
            // Clear any tokens since they're invalid
            TokenStorage.clearAllData()

            if (isMounted.current) {
              dispatch({
                type: AUTH_TYPES.INITIALIZE,
                payload: {
                  isAuthenticated: false,
                  user: null,
                },
              })
            }
            // Return early after clearing auth data
            return
          }

          // If we couldn't refresh but we have stored user data, that's okay - keep the stored data
          if (authState.user && authState.user.id) {
            console.log('[JWTAuthContext] Using cached user data due to API error')

            // Dispatch an explicit login success event to ensure proper state update
            if (isMounted.current) {
              dispatch({
                type: AUTH_TYPES.LOGIN_SUCCESS,
                payload: {
                  user: authState.user,
                },
              })
            }

            // No need to dispatch anything - we've already initialized with stored data above
            // Just return to prevent any further processing
            return
          }

          // If we have no stored data and API failed, reset to unauthenticated
          console.log('[JWTAuthContext] No valid user data available, logging out')
          await jwtApi.logout()

          if (isMounted.current) {
            dispatch({
              type: AUTH_TYPES.INITIALIZE,
              payload: {
                isAuthenticated: false,
                user: null,
              },
            })
          }
        }
      } catch (error) {
        console.error('[JWTAuthContext] Failed to initialize auth', error)

        // Clear any invalid tokens
        await jwtApi.logout()

        if (isMounted.current) {
          dispatch({
            type: AUTH_TYPES.INITIALIZE,
            payload: {
              isAuthenticated: false,
              user: null,
            },
          })
        }
      }
    }

    initialize()
  }, [])

  // Update loading state helper
  const updateLoading = (key: keyof LoadingStates, value: boolean) => {
    if (isMounted.current) {
      setLoading((prev) => ({ ...prev, [key]: value }))
    }
  }

  // Update error state helper
  const updateError = (key: keyof AuthErrors, error: Error | null) => {
    if (isMounted.current) {
      setErrors((prev) => ({ ...prev, [key]: error }))
    }
  }

  // Login handler
  const handleLogin = async (
    email: string,
    password: string,
    rememberMe = false,
    targetRole?: 'admin' | 'client'
  ) => {
    updateLoading('login', true)
    updateError('login', null)
    console.log('[JWTAuthContext] Login attempt started:', { email, targetRole })

    try {
      const user = await jwtApi.login(email, password, rememberMe, targetRole)
      console.log('[JWTAuthContext] Login successful, user data received:', user)

      // Perform a complete validation after login to ensure we're in a consistent state
      const authState = validateAuthState()
      if (!authState.isAuthenticated && authState.tokenExists) {
        console.warn(
          '[JWTAuthContext] Token exists but validation failed. Possible inconsistent state.'
        )
      }

      // If we have the user data, ensure state is updated
      if (user && user.id) {
        if (isMounted.current) {
          console.log('[JWTAuthContext] Dispatching LOGIN with user:', user)
          dispatch({
            type: AUTH_TYPES.LOGIN,
            payload: {
              user,
            },
          })

          // Also explicitly dispatch a LOGIN_SUCCESS action to ensure state is updated
          dispatch({
            type: AUTH_TYPES.LOGIN_SUCCESS,
            payload: {
              user,
            },
          })

          // Force a global event for other components to catch
          window.dispatchEvent(
            new CustomEvent('jwt:authSuccess', {
              detail: { user },
            })
          )
        }
      } else {
        console.error('[JWTAuthContext] No user data available after login')
        throw new Error('Failed to get user data after login')
      }

      // Return the user data after successful login
      console.log('[JWTAuthContext] Login completed successfully, returning user data:', user)
      return user
    } catch (error) {
      console.error('[JWTAuthContext] Login failed:', error)
      updateError('login', error as Error)
      throw error
    } finally {
      updateLoading('login', false)
    }
  }

  // Register handler
  const handleRegister = async (data: RegisterData) => {
    updateLoading('register', true)
    updateError('register', null)

    try {
      const user = await jwtApi.register(data)

      if (isMounted.current) {
        // Dispatch register action but don't authenticate
        dispatch({
          type: AUTH_TYPES.REGISTER,
          payload: {
            user,
          },
        })

        // Remove any stored auth tokens to ensure user needs to log in properly
        TokenStorage.clearToken()
      }

      // Return the user data for showing verification link but don't authenticate
      return user
    } catch (error) {
      updateError('register', error as Error)
      throw error
    } finally {
      updateLoading('register', false)
    }
  }

  // Logout handler
  const handleLogout = async () => {
    updateLoading('logout', true)
    updateError('logout', null)

    try {
      await jwtApi.logout()

      if (isMounted.current) {
        dispatch({ type: AUTH_TYPES.LOGOUT })
      }
    } catch (error) {
      updateError('logout', error as Error)
      throw error
    } finally {
      updateLoading('logout', false)
    }
  }

  // Forgot password handler
  const handleForgotPassword = async (email: string) => {
    updateLoading('forgotPassword', true)
    updateError('forgotPassword', null)

    try {
      await jwtApi.forgotPassword(email)
    } catch (error) {
      updateError('forgotPassword', error as Error)
      throw error
    } finally {
      updateLoading('forgotPassword', false)
    }
  }

  // Reset password handler
  const handleResetPassword = async (data: PasswordResetData) => {
    updateLoading('resetPassword', true)
    updateError('resetPassword', null)

    try {
      await jwtApi.resetPassword(data)
    } catch (error) {
      updateError('resetPassword', error as Error)
      throw error
    } finally {
      updateLoading('resetPassword', false)
    }
  }

  // Verify email handler
  const handleVerifyEmail = async (token: string, email?: string) => {
    updateLoading('verifyEmail', true)
    updateError('verifyEmail', null)

    try {
      console.log(
        '[JWTAuthContext] Verifying email with token:',
        token,
        'and email:',
        email || 'not provided'
      )
      // Pass both token and email to the API
      await jwtApi.verifyEmail(token, email)

      // Refresh user data after email verification
      await handleRefreshUserData()
      return true
    } catch (error) {
      console.error('[JWTAuthContext] Verification failed:', error)
      updateError('verifyEmail', error as Error)
      return false
    } finally {
      updateLoading('verifyEmail', false)
    }
  }

  // Update profile handler
  const handleUpdateProfile = async (
    data: UserProfileUpdateData,
    onUpdateSuccess?: (user: User) => void
  ) => {
    updateLoading('updateProfile', true)
    updateError('updateProfile', null)

    try {
      console.log('[JWTAuthContext] Starting profile update with data:', data)

      // 1. Call the API to update the profile
      const updatedUser = await jwtApi.updateProfile(data)
      console.log('[JWTAuthContext] Profile update API call succeeded, received data:', updatedUser)

      // 2. Force full clone to ensure reference change
      const deepClonedUser = JSON.parse(JSON.stringify(updatedUser))

      // 3. ALWAYS add fresh timestamp on updates - this is critical for UI updates
      const updateTimestamp = Date.now()
      deepClonedUser._timestamp = updateTimestamp
      deepClonedUser._lastUpdated = updateTimestamp
      console.log(
        '[JWTAuthContext] Added new timestamps for update:',
        'timestamp:',
        deepClonedUser._timestamp,
        'lastUpdated:',
        deepClonedUser._lastUpdated
      )

      if (isMounted.current) {
        // 4. Dispatch the update action to update context state
        console.log('[JWTAuthContext] Dispatching UPDATE_PROFILE action')
        dispatch({
          type: AUTH_TYPES.UPDATE_PROFILE,
          payload: {
            user: deepClonedUser,
          },
        })

        // 5. Explicitly update TokenStorage to ensure consistency
        console.log('[JWTAuthContext] Updating TokenStorage with latest user data')
        TokenStorage.storeUserData(deepClonedUser)

        // 6. Wait a tiny bit to ensure state propagation
        await new Promise((resolve) => setTimeout(resolve, 100))

        // 7. Verify the update was successful by checking TokenStorage
        const storedUser = TokenStorage.getUserData()
        if (storedUser && storedUser._timestamp === deepClonedUser._timestamp) {
          console.log(
            '[JWTAuthContext] Verified TokenStorage update success:',
            deepClonedUser._timestamp
          )
        } else {
          console.warn('[JWTAuthContext] TokenStorage user data mismatch or missing after update')
          console.log('Expected timestamp:', deepClonedUser._timestamp)
          console.log('Stored user data timestamp:', storedUser?._timestamp)
        }

        // 8. Call the success callback with updated user data if provided
        if (onUpdateSuccess && deepClonedUser) {
          console.log('[JWTAuthContext] Calling onUpdateSuccess callback with updated user data')
          onUpdateSuccess(deepClonedUser)
        }

        // Return the updated user for promise chaining
        updateLoading('updateProfile', false)
        return deepClonedUser
      }

      // If component unmounted, still return the user data
      updateLoading('updateProfile', false)
      return updatedUser
    } catch (error) {
      console.error('[JWTAuthContext] Profile update error:', error)

      if (isMounted.current) {
        updateError('updateProfile', error instanceof Error ? error : new Error(String(error)))
      }

      updateLoading('updateProfile', false)
      throw error
    }
  }

  // Change password handler
  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    updateLoading('changePassword', true)
    updateError('changePassword', null)

    try {
      console.log('[JWTAuthContext] Attempting to change password')
      await jwtApi.changePassword(currentPassword, newPassword)
      console.log('[JWTAuthContext] Password changed successfully')
    } catch (error) {
      console.error('[JWTAuthContext] Password change failed:', error)

      // Create a more descriptive error if possible
      let enhancedError: Error

      if (error instanceof Error) {
        // Check if it's an API error with a specific message
        if ('status' in error && error.status === 401) {
          enhancedError = new Error('Current password is incorrect')
        } else {
          enhancedError = error
        }
      } else {
        enhancedError = new Error('Failed to change password')
      }

      updateError('changePassword', enhancedError)
      throw enhancedError
    } finally {
      updateLoading('changePassword', false)
    }
  }

  // Refresh user data handler
  const handleRefreshUserData = async () => {
    updateLoading('refreshUserData', true)
    updateError('refreshUserData', null)

    try {
      // First check if a token exists to avoid unnecessary API calls
      const hasToken = TokenStorage.getToken()
      if (!hasToken) {
        console.log('[JWTAuthContext] No token available, skipping user data refresh')
        // Early return without error when no token exists
        updateLoading('refreshUserData', false)
        return null
      }

      console.log('[JWTAuthContext] Fetching current user data from API')
      const userFromApi = await jwtApi.getCurrentUser()
      console.log('[JWTAuthContext] Received user data from API:', userFromApi)

      if (isMounted.current) {
        // Create a clean, deep-cloned object to ensure reference change
        const deepClonedUser = JSON.parse(JSON.stringify(userFromApi))

        // ALWAYS add a fresh timestamp - this is critical for UI updates
        const now = Date.now()
        deepClonedUser._timestamp = now
        deepClonedUser._lastUpdated = now

        console.log(
          '[JWTAuthContext] Set fresh timestamps:',
          'timestamp:',
          deepClonedUser._timestamp,
          'lastUpdated:',
          deepClonedUser._lastUpdated
        )

        // Dispatch the update action
        console.log('[JWTAuthContext] Dispatching UPDATE_PROFILE action for user refresh')
        dispatch({
          type: AUTH_TYPES.UPDATE_PROFILE,
          payload: {
            user: deepClonedUser,
          },
        })

        // Ensure TokenStorage is also updated to maintain consistency
        console.log('[JWTAuthContext] Updating TokenStorage with refreshed user data')
        TokenStorage.storeUserData(deepClonedUser)

        // Small delay to ensure state propagation
        await new Promise((resolve) => setTimeout(resolve, 100))

        // Verify the update actually took effect
        const storedUser = TokenStorage.getUserData()
        if (storedUser && storedUser._timestamp === deepClonedUser._timestamp) {
          console.log(
            '[JWTAuthContext] Verified TokenStorage update for refresh:',
            deepClonedUser._timestamp
          )
          updateLoading('refreshUserData', false)
          return deepClonedUser // Return the updated user data for promise chaining
        } else {
          console.warn('[JWTAuthContext] TokenStorage update verification failed for refresh')
          console.log('Expected timestamp:', deepClonedUser._timestamp)
          console.log('Stored user timestamp:', storedUser?._timestamp)
          // Still return the data even if verification failed
          updateLoading('refreshUserData', false)
          return deepClonedUser
        }
      }

      // If we get here, component was unmounted, but still return data for promise chaining
      updateLoading('refreshUserData', false)
      return userFromApi
    } catch (error) {
      console.error('[JWTAuthContext] Error refreshing user data:', error)

      if (isMounted.current) {
        updateError('refreshUserData', error instanceof Error ? error : new Error(String(error)))
      }

      updateLoading('refreshUserData', false)
      throw error
    }
  }

  return (
    <JWTAuthContext.Provider
      value={{
        ...state,
        login: handleLogin,
        logout: handleLogout,
        register: handleRegister,
        forgotPassword: handleForgotPassword,
        resetPassword: handleResetPassword,
        verifyEmail: handleVerifyEmail,
        updateProfile: handleUpdateProfile,
        changePassword: handleChangePassword,
        refreshUserData: handleRefreshUserData,
        refreshUser: handleRefreshUserData,
        loading,
        errors,
        isLoading: Object.values(loading).some(Boolean),
        error: Object.values(errors).find((err) => err !== null)?.message || null,
      }}
    >
      {children}
    </JWTAuthContext.Provider>
  )
}

export const useJWTAuth = () => {
  const context = useContext(JWTAuthContext)

  if (!context) {
    throw new Error('useJWTAuth must be used within a JWTAuthProvider')
  }

  return context
}

export default JWTAuthContext
