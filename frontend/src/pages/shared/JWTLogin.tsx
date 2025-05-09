import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useJWTAuth } from '@/contexts/auth/JWTAuthContext'
import { TokenStorage } from '@/services/jwtApi'
import { TokenService } from '@/services/tokenService'

// Debug logging
console.log('[JWTLogin] Component initialized, using JWTAuthContext')

// Manually check and log token state
const checkTokenState = () => {
  try {
    const token = TokenStorage.getToken()
    const tokenExpiry = TokenStorage.getTokenExpiry()
    const userData = TokenStorage.getUserData()

    console.log('[JWTLogin] Manual token check:', {
      hasToken: !!token,
      expiresIn: tokenExpiry ? new Date(tokenExpiry) : 'No expiry',
      tokenLength: token ? token.length : 0,
      userData: userData,
    })
  } catch (error) {
    console.error('[JWTLogin] Error checking token state:', error)
  }
}

// Basic Login component that uses our new JWT auth system
export const JWTLogin: React.FC = () => {
  const jwtAuth = useJWTAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  // IMMEDIATE CHECK: Add a synchronous check that bypasses login screen completely
  // This is the first thing that runs, before any state updates or effects
  React.useLayoutEffect(() => {
    try {
      console.log('[JWTLogin] Performing immediate auth check before rendering login form');
      
      // Direct check for valid token
      const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
      if (!token) {
        console.log('[JWTLogin] No token found, showing login form');
        return;
      }
      
      // Check if within refresh window (from TokenService)
      const lastLoginStr = localStorage.getItem('last_successful_login') || sessionStorage.getItem('last_successful_login');
      if (!lastLoginStr) {
        console.log('[JWTLogin] No last login timestamp found, proceeding with normal login flow');
        return;
      }
      
      const lastLogin = parseInt(lastLoginStr, 10);
      const now = Date.now();
      const refreshWindow = 60 * 60 * 1000; // 1 hour
      const isWithinWindow = now - lastLogin < refreshWindow;
      
      if (!isWithinWindow) {
        console.log('[JWTLogin] Outside refresh window, proceeding with normal login flow');
        return;
      }
      
      console.log('[JWTLogin] Valid token exists and within refresh window, bypassing login screen');
      
      // Get any stored user data
      const userDataStr = sessionStorage.getItem('user_data') || localStorage.getItem('user_data');
      if (!userDataStr) {
        console.log('[JWTLogin] No user data found, proceeding with normal login flow');
        return;
      }
      
      try {
        const userData = JSON.parse(userDataStr);
        // FIXED: Only bypass login if we have COMPLETE user data
        if (!userData || 
            !userData.id || 
            !userData.email || 
            !userData.firstName || 
            !userData.lastName || 
            !userData.role) {
          console.log('[JWTLogin] Incomplete user data found, proceeding with normal login flow:',
                     {id: !!userData?.id, email: !!userData?.email, 
                      firstName: !!userData?.firstName, lastName: !!userData?.lastName,
                      role: !!userData?.role});
          return;
        }
        
        // We have valid token, within refresh window, and COMPLETE user data
        // IMMEDIATELY navigate to dashboard without waiting for any API calls
        console.log('[JWTLogin] IMMEDIATE BYPASS: Valid auth found, redirecting to dashboard directly');
        
        // Dispatch auth success event
        window.dispatchEvent(new CustomEvent('jwt:authSuccess', { 
          detail: { user: userData }
        }));
        
        // Navigate to dashboard IMMEDIATELY
        navigate('/client/dashboard');
      } catch (err) {
        console.warn('[JWTLogin] Error parsing user data:', err);
      }
    } catch (e) {
      console.error('[JWTLogin] Error in immediate auth check:', e);
    }
  }, [navigate]);

  // Get isLoading and error values from the context's loading and errors objects
  const isLoading = jwtAuth.loading?.login || false

  // Self-healing mechanism - check if token exists but auth state doesn't reflect it
  useEffect(() => {
    const healAuthState = async () => {
      try {
        console.log('[JWTLogin] Running auth state healing check')
        const token = TokenStorage.getToken()
        const userData = TokenStorage.getUserData()

        // If we have token and user data but auth state says we're not authenticated
        if (token && userData && userData.id && !jwtAuth.isAuthenticated) {
          console.log(
            '[JWTLogin] Auth state healing: token and user data exist but auth state is not authenticated'
          )

          // Force a refresh of user data in both auth providers
          try {
            await jwtAuth.refreshUserData()
            console.log('[JWTLogin] Auth state healing: JWT user data refreshed')
          } catch (e) {
            console.error('[JWTLogin] Auth state healing: JWT refresh failed:', e)
          }

          // Recheck auth state after refresh attempts
          if (!jwtAuth.isAuthenticated && token) {
            console.log(
              '[JWTLogin] Auth state healing: Still not authenticated after refresh, forcing auth state'
            )
            // Consider implementing a direct way to force auth state if needed
          }
        }
      } catch (e) {
        console.error('[JWTLogin] Error in auth state healing:', e)
      }
    }

    healAuthState()
  }, [jwtAuth.isAuthenticated])

  // Log current authentication state for both auth providers
  console.log('[JWTLogin] Current auth state:', {
    jwt: {
      user: jwtAuth.user ? `User exists: ${jwtAuth.user.email}` : 'No user',
      isAuthenticated: jwtAuth.isAuthenticated,
      isInitialized: jwtAuth.isInitialized,
      isLoading,
      error,
    },
  })

  // Check token state on component mount
  useEffect(() => {
    console.log('[JWTLogin] Component mounted')
    checkTokenState()
    
    const token = TokenStorage.getToken()
    
    // If token exists but not authenticated, try to heal the state
    if (token && !jwtAuth.isAuthenticated) {
      console.log('[JWTLogin] Token exists but not authenticated, attempting to heal state')
      const userData = TokenStorage.getUserData()

      if (userData && userData.id) {
        console.log('[JWTLogin] User data exists in storage, refreshing both auth providers')

        // Try to refresh both providers
        Promise.all([
          jwtAuth
            .refreshUserData()
            .catch((e) => console.error('[JWTLogin] JWT refresh failed:', e)),
        ]).then(() => {
          console.log('[JWTLogin] Auth providers refreshed, checking if redirect needed')

          // Check if redirect is needed after refresh
          if (jwtAuth.isAuthenticated) {
            console.log('[JWTLogin] Authentication confirmed after refresh, redirecting')
            navigate('/dashboard')
          }
        })
      }
    }
  }, [])

  // Handle redirect if already authenticated
  useEffect(() => {
    if (jwtAuth.isAuthenticated && jwtAuth.user) {
      console.log('[JWTLogin] JWT Auth: User is already authenticated, redirecting to dashboard')
      setTimeout(() => {
        try {
          navigate('/dashboard')
        } catch (error) {
          console.error('[JWTLogin] Navigation error:', error)
          window.location.href = '/dashboard'
        }
      }, 300)
    }
  }, [jwtAuth.isAuthenticated, jwtAuth.user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      console.log('[JWTLogin] Attempting login with JWT auth system')
      await jwtAuth.login(email, password, rememberMe)
      console.log('[JWTLogin] JWT login successful')

      // Check token state after login
      checkTokenState()
      
      // Explicitly synchronize storage to prevent data loss during navigation
      console.log('[JWTLogin] Synchronizing authentication data between storage types');
      const syncResult = TokenService.syncStorageData();
      console.log('[JWTLogin] Storage synchronization result:', syncResult ? 'success' : 'failed');
      
      // Double-check that critical data was stored properly
      setTimeout(() => {
        const sessionToken = sessionStorage.getItem('auth_token');
        const localToken = localStorage.getItem('auth_token');
        const sessionUserId = sessionStorage.getItem('auth_user_id');
        const localUserId = localStorage.getItem('auth_user_id');
        
        console.log('[JWTLogin] Storage validation after login:', {
          session: {
            token: sessionToken ? `exists (${sessionToken.length} chars)` : 'missing',
            userId: sessionUserId || 'missing',
          },
          local: {
            token: localToken ? `exists (${localToken.length} chars)` : 'missing',
            userId: localUserId || 'missing',
          }
        });
        
        // If any critical data is missing, try to recover it
        if (sessionToken === null && localToken !== null) {
          console.log('[JWTLogin] Recovering missing session token from localStorage');
          sessionStorage.setItem('auth_token', localToken);
        }
        
        if (localToken === null && sessionToken !== null) {
          console.log('[JWTLogin] Recovering missing local token from sessionStorage');
          localStorage.setItem('auth_token', sessionToken);
        }
      }, 100);

      console.log('[JWTLogin] Login successful, awaiting redirection')

      // Redirect will happen automatically via the useEffect that watches isAuthenticated
    } catch (error) {
      console.error('[JWTLogin] Login error:', error)
      setError(error instanceof Error ? error.message : 'Login failed. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Login form */}
      <div className="w-full md:w-1/2 p-8 flex flex-col justify-center bg-white">
        <div className="max-w-md w-full mx-auto space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-center">JWT Authentication Login</h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Using the new JWT authentication system
            </p>
          </div>

          <div className="flex bg-gray-100 rounded-lg p-1">
            <Link
              to="/login"
              className="flex-1 py-2 px-4 text-center text-gray-600 hover:text-[#fdba6b] transition-colors"
            >
              Legacy Login
            </Link>
            <button className="flex-1 py-2 px-4 rounded-md bg-white text-center shadow-sm font-medium">
              JWT Login
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#fdba6b] focus:border-[#fdba6b] sm:text-sm"
                placeholder="Enter your email"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#fdba6b] focus:border-[#fdba6b] sm:text-sm"
                placeholder="Enter your password"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="rememberMe" className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 border-gray-300 rounded text-indigo-600 focus:ring-indigo-500"
                  disabled={isLoading}
                />
                <span className="ml-2 text-sm text-gray-900">Remember me</span>
              </label>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Login failed</h3>
                    <div className="mt-2 text-sm text-red-700">{error}</div>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isLoading
                  ? 'bg-[#fdba6b]/70 cursor-not-allowed'
                  : 'bg-[#fdba6b] hover:bg-[#fdba6b]/90'
              }`}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>

            <div className="flex items-center justify-between">
              <Link
                to="/forgot-password"
                className="text-sm text-[#fdba6b] hover:text-[#fdba6b]/80"
              >
                Forgot password?
              </Link>
            </div>

            <div className="mt-4">
              <Link
                to="/auth-debug"
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Debug Authentication
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Right side - Background image */}
      <div className="hidden md:block md:w-1/2 relative">
        <div className="absolute inset-0">
          <img
            className="h-full w-full object-cover"
            src="/images/Sasta-YachtShot-H022.jpg"
            alt="Yacht background"
          />
          <div className="absolute inset-0 bg-black opacity-30"></div>
          <img
            src="/images/Logo-Yachtstory-WHITE.png"
            alt="Charter Hub Logo"
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-[288px] w-auto"
          />
        </div>
      </div>
    </div>
  )
}
