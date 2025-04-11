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
import { TokenService } from '@/services/tokenService'

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
  refreshUserData: (forceRefresh?: boolean) => Promise<User | null>
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
      TokenService.clearTokens()

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
      TokenService.clearTokens()

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
        
        // ENHANCED: First, sync storage to prevent data loss
        TokenService.syncStorageData();
        
        // NEW: Add quickInit to prevent API call cancellation during refresh
        const quickInit = () => {
          // Check if we have all the necessary elements for quick initialization
          const token = TokenService.getToken();
          const userData = TokenService.getUserData();
          const isWithinWindow = TokenService.isWithinAuthRefreshWindow();
          
          // FIXED: Only use quick initialization if we have COMPLETE user data
          // This prevents showing partial user objects with just ID
          if (token && 
              userData && 
              userData.id && 
              userData.email && 
              userData.firstName && 
              userData.lastName && 
              userData.role && 
              isWithinWindow) {
            console.log('[JWTAuthContext] Quick initialization criteria met:');
            console.log(`- Valid token: ${!!token} (length: ${token ? token.length : 0})`);
            console.log(`- Complete user data: ${!!userData} (ID: ${userData?.id || 'none'}, Name: ${userData?.firstName || 'missing'} ${userData?.lastName || 'missing'})`);
            console.log(`- Within refresh window: ${isWithinWindow}`);
            
            if (isMounted.current) {
              // Immediately set authenticated state with the cached user data
              dispatch({
                type: AUTH_TYPES.INITIALIZE,
                payload: {
                  isAuthenticated: true,
                  user: userData,
                },
              });
              
              // Also ensure correct login success state
              dispatch({
                type: AUTH_TYPES.LOGIN_SUCCESS,
                payload: {
                  user: userData,
                },
              });
              
              // Broadcast the event for other components
              window.dispatchEvent(new CustomEvent('jwt:authSuccess', { 
                detail: { user: userData }
              }));
              
              // Still refresh user data in the background for eventual consistency
              setTimeout(() => {
                try {
                  jwtApi.getCurrentUser()
                    .then(freshUserData => {
                      if (freshUserData && freshUserData.id) {
                        TokenService.storeUserData(freshUserData);
                        
                        // Do NOT disrupt the existing authentication state if this fails
                        // Only update data if successful
                        if (isMounted.current) {
                          dispatch({
                            type: AUTH_TYPES.USER_DATA_UPDATED,
                            payload: {
                              user: freshUserData,
                            },
                          });
                          
                          window.dispatchEvent(new CustomEvent('jwt:userDataRefreshed', { 
                            detail: { user: freshUserData }
                          }));
                        }
                      }
                    })
                    .catch(err => {
                      // Just log errors, but don't disrupt authentication
                      console.warn('[JWTAuthContext] Background user refresh failed, continuing with cached data:', err);
                    });
                } catch (refreshError) {
                  // Just log errors, don't disrupt authentication
                  console.warn('[JWTAuthContext] Error setting up background refresh, continuing with cached data:', refreshError);
                }
              }, 1000); // Longer delay to prioritize UI rendering
              
              return true; // Indicate successful quick initialization
            }
          }
          
          if (token && userData && userData.id && isWithinWindow) {
            console.log('[JWTAuthContext] Quick initialization FAILED - incomplete user data, will fetch from API');
          }
          
          console.log('[JWTAuthContext] Quick initialization criteria NOT met, proceeding with normal flow');
          return false; // Proceed with normal initialization
        };
        
        // Try quick initialization first, only proceed with normal flow if it fails
        if (quickInit()) {
          console.log('[JWTAuthContext] Quick initialization successful, skipping API validation');
          return; // Exit early since we're already authenticated
        }
        
        // Continue with the normal initialization flow
        // ENHANCED: First check for token without waiting for API
        const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
        
        // Always log out the raw storage state for debugging
        console.log(`[JWTAuthContext] Raw storage state check: 
          session.auth_token: ${sessionStorage.getItem('auth_token') ? 'exists' : 'missing'}
          session.auth_user_id: ${sessionStorage.getItem('auth_user_id') ? 'exists' : 'missing'}
          session.user_data: ${sessionStorage.getItem('user_data') ? 'exists' : 'missing'}
          local.auth_token: ${localStorage.getItem('auth_token') ? 'exists' : 'missing'}
          local.auth_user_id: ${localStorage.getItem('auth_user_id') ? 'exists' : 'missing'}
          local.user_data: ${localStorage.getItem('user_data') ? 'exists' : 'missing'}
        `);

        // First, directly check if we have cached user data and a valid token
        // This is a direct check to avoid the race condition where token exists but user data isn't found
        const userDataFromStorage = TokenService.getUserData();
        
        if (token && userDataFromStorage && userDataFromStorage.id) {
          console.log('[JWTAuthContext] Found valid token and user data in storage, initializing as authenticated');
          
          // NEW: Add a page load timestamp check
          // This prevents excessive API calls on rapid page refreshes
          const isWithinRefreshWindow = TokenService.isWithinAuthRefreshWindow();
          const pageLoadDelay = 2000; // 2 seconds
          
          // Get page load timestamp or create one
          let pageLoadTimestamp = parseInt(sessionStorage.getItem('page_load_timestamp') || '0', 10);
          const now = Date.now();
          
          if (!pageLoadTimestamp) {
            // First page load in this session, record it
            pageLoadTimestamp = now;
            sessionStorage.setItem('page_load_timestamp', pageLoadTimestamp.toString());
          }
          
          // Determine if this is within a rapid refresh window (2 seconds)
          const isRapidPageRefresh = (now - pageLoadTimestamp) < pageLoadDelay;
          
          // Log checks for debugging
          console.log('[JWTAuthContext] Refresh window checks:', {
            isWithinAuthWindow: isWithinRefreshWindow,
            timeSincePageLoad: now - pageLoadTimestamp,
            isRapidRefresh: isRapidPageRefresh
          });
          
          // Update the page load timestamp for future checks
          sessionStorage.setItem('page_load_timestamp', now.toString());
          
          // Populate extra fields if this is a restored minimal object
          if (userDataFromStorage._restored) {
            // Add default values for required fields
            userDataFromStorage.firstName = userDataFromStorage.firstName || 'User';
            userDataFromStorage.lastName = userDataFromStorage.lastName || userDataFromStorage.id.toString();
            userDataFromStorage.email = userDataFromStorage.email || '';
            userDataFromStorage.fullName = `${userDataFromStorage.firstName} ${userDataFromStorage.lastName}`;
          }
          
          if (isMounted.current) {
            dispatch({
              type: AUTH_TYPES.INITIALIZE,
              payload: {
                isAuthenticated: true,
                user: userDataFromStorage,
              },
            });
            
            // Also ensure correct login success state
            dispatch({
              type: AUTH_TYPES.LOGIN_SUCCESS,
              payload: {
                user: userDataFromStorage,
              },
            });
            
            // Broadcast the event for other components
            window.dispatchEvent(new CustomEvent('jwt:authSuccess', { 
              detail: { user: userDataFromStorage }
            }));
            
            // Refresh user data in the background to ensure it's current
            setTimeout(() => {
              try {
                jwtApi.getCurrentUser().then(freshUserData => {
                  if (freshUserData && freshUserData.id) {
                    // Update with fresh data if available
                    TokenService.storeUserData(freshUserData);
                    
                    if (isMounted.current) {
                      dispatch({
                        type: AUTH_TYPES.USER_DATA_UPDATED,
                        payload: {
                          user: freshUserData,
                        },
                      });
                      
                      // Broadcast refresh event
                      window.dispatchEvent(new CustomEvent('jwt:userDataRefreshed', { 
                        detail: { user: freshUserData }
                      }));
                    }
                  }
                }).catch(err => {
                  console.error('[JWTAuthContext] Background refresh failed:', err);
                  // Continue with cached data, we already initialized as authenticated
                });
              } catch (refreshError) {
                console.error('[JWTAuthContext] Background refresh setup failed:', refreshError);
              }
            }, 500); // Slight delay to prioritize UI rendering first
            
            return; // Exit early since we're already authenticated
          }
        }

        // Continue with the normal validation if the direct check didn't succeed
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
              
              // NEW: Record successful login timestamp
              TokenService.setLastSuccessfulLogin()
              console.log('[JWTAuthContext] Recorded login timestamp for refresh protection')

              // Ensure user data is stored properly in both storage services
              if (user && user.id) {
                // ENHANCEMENT: Validate user data completeness and log warning if incomplete
                const isCompleteUserData = 
                  user.id && 
                  user.email && 
                  user.firstName && 
                  user.lastName && 
                  user.role;
                
                if (!isCompleteUserData) {
                  console.warn('[JWTAuthContext] WARNING: Incomplete user data after login', {
                    id: !!user.id,
                    email: !!user.email,
                    firstName: !!user.firstName,
                    lastName: !!user.lastName,
                    role: !!user.role
                  });
                } else {
                  console.log('[JWTAuthContext] Complete user data verified and stored after login');
                }
                
                // Store a quick reference for ProtectedRoute to use during redirects
                TokenService.markLoginRedirect(user.id.toString(), user.role)
                
                // Explicitly store user data in both services
                TokenService.storeUserData(user)
                TokenStorage.storeUserData(user)
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
            TokenService.clearTokens()

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
      
      // NEW: Record successful login timestamp
      TokenService.setLastSuccessfulLogin()
      console.log('[JWTAuthContext] Recorded login timestamp for refresh protection')

      // Ensure user data is stored properly in both storage services
      if (user && user.id) {
        // ENHANCEMENT: Validate user data completeness and log warning if incomplete
        const isCompleteUserData = 
          user.id && 
          user.email && 
          user.firstName && 
          user.lastName && 
          user.role;
        
        if (!isCompleteUserData) {
          console.warn('[JWTAuthContext] WARNING: Incomplete user data after login', {
            id: !!user.id,
            email: !!user.email,
            firstName: !!user.firstName,
            lastName: !!user.lastName,
            role: !!user.role
          });
        } else {
          console.log('[JWTAuthContext] Complete user data verified and stored after login');
        }
        
        // Store a quick reference for ProtectedRoute to use during redirects
        TokenService.markLoginRedirect(user.id.toString(), user.role)
        
        // Explicitly store user data in both services
        TokenService.storeUserData(user)
        TokenStorage.storeUserData(user)
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
        TokenService.clearTokens()
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
        TokenService.storeUserData(deepClonedUser)

        // 6. Wait a tiny bit to ensure state propagation
        await new Promise((resolve) => setTimeout(resolve, 100))

        // 7. Verify the update was successful by checking TokenStorage
        const storedUser = TokenService.getUserData()
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
  const handleRefreshUserData = async (forceRefresh = false) => {
    updateLoading('refreshUserData', true)
    updateError('refreshUserData', null)

    try {
      // First check if a token exists to avoid unnecessary API calls
      const hasToken = TokenService.getToken()
      if (!hasToken) {
        console.log('[JWTAuthContext] No token available, skipping user data refresh')
        // Early return without error when no token exists
        updateLoading('refreshUserData', false)
        return null
      }

      console.log(`[JWTAuthContext] Fetching current user data from API${forceRefresh ? ' (FORCE REFRESH)' : ''}`)
      const userFromApi = await jwtApi.getCurrentUser(forceRefresh)
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
        TokenService.storeUserData(deepClonedUser)

        // Small delay to ensure state propagation
        await new Promise((resolve) => setTimeout(resolve, 100))

        // Verify the update actually took effect
        const storedUser = TokenService.getUserData()
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

  // Add synchronization call in login success handler
  const handleLoginSuccess = useCallback(
    (user: any) => {
      try {
        // Extract essential user data
        if (!user || !user.id) {
          console.error('[JWTAuthContext] Invalid user data in login success handler');
          return;
        }
        
        // Ensure the storage is synchronized
        TokenService.syncStorageData();
        
        // Update authentication state with user info
        if (isMounted.current) {
          dispatch({
            type: AUTH_TYPES.LOGIN_SUCCESS,
            payload: {
              user,
            },
          })
        }
      } catch (error) {
        console.error('[JWTAuthContext] Error in login success handler:', error);
      }
    },
    [dispatch]
  );

  // Add synchronization on component mount
  // Use effect for storage synchronization on mount
  useEffect(() => {
    // Synchronize storage on component mount
    TokenService.syncStorageData();
    
    // Listen for page visibility changes to sync on tab focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[JWTAuthContext] Tab became visible, synchronizing storage');
        TokenService.syncStorageData();
      }
    };
    
    // Also sync before page unload to ensure data is preserved
    const handleBeforeUnload = () => {
      console.log('[JWTAuthContext] Page unloading, synchronizing storage');
      TokenService.syncStorageData();
    };
    
    // Set up event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Clean up
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

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
