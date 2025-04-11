import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useJWTAuth } from '@/contexts/auth/JWTAuthContext'
import { LoadingScreen } from '@/components/shared/LoadingScreen'
import jwtApi, { TokenStorage, validateAuthState } from '@/services/jwtApi'
import { TokenService } from '@/services/tokenService'

// Local implementation of validateTokenStorage since it's not exported from jwtApi
const validateTokenStorage = () => {
  const token = TokenStorage.getToken()
  const userData = TokenStorage.getUserData()

  return {
    isValid: !!token && !!userData,
    message: token ? 'Token valid' : 'No token found',
    token,
    userData,
  }
}

type ProtectedRouteProps = {
  children: React.ReactNode
  allowedRoles?: string[]
  section?: 'admin' | 'client'
}

// Define role groups for consistent evaluation
const ADMIN_ROLES = ['admin', 'administrator']
const CLIENT_ROLES = ['client', 'user', 'customer']

/**
 * ProtectedRoute - A robust route guard component with predictable authentication behavior
 */
export const ProtectedRoute = ({
  children,
  allowedRoles = [],
  section = 'client',
}: ProtectedRouteProps) => {
  const { isAuthenticated, loading, user } = useJWTAuth()
  const location = useLocation()
  
  // ENHANCED: Direct session storage check for dashboard routes
  // This bypasses all React state and prevents render flicker
  if (location.pathname.includes('/dashboard')) {
    // Check directly in session storage first (fastest source of truth)
    const sessionToken = sessionStorage.getItem('auth_token');
    const sessionUserId = sessionStorage.getItem('auth_user_id');
    const sessionUserRole = sessionStorage.getItem('auth_user_role');
    
    // If critical auth data exists in session storage, we can render immediately
    if (sessionToken && sessionUserId && sessionUserRole) {
      console.log(`[ProtectedRoute ${section}] ULTRA-EARLY BYPASS: Found complete auth data in session storage`);
      
      // Check if this role has access to this section
      const userIsAdmin = ADMIN_ROLES.includes(sessionUserRole);
      const userIsClient = CLIENT_ROLES.includes(sessionUserRole);
      
      if ((section === 'admin' && userIsAdmin) || (section === 'client' && userIsClient)) {
        // Only if we aren't already authenticated in the context...
        if (!isAuthenticated || !user) {
          // Try to get the full user data
          const userData = sessionStorage.getItem('user_data');
          let parsedUserData = null;
          
          try {
            if (userData) parsedUserData = JSON.parse(userData);
          } catch (e) {
            // Silent parse error - we'll use the minimal data
          }
          
          // Create a minimal user object if parsing failed
          const userObject = parsedUserData || {
            id: parseInt(sessionUserId, 10),
            role: sessionUserRole,
            _restored: true,
            _timestamp: Date.now()
          };
          
          // Trigger an auth event to update the context 
          window.dispatchEvent(
            new CustomEvent('jwt:authSuccess', {
              detail: { user: userObject },
            })
          );
        }
        
        // Render children immediately without waiting for context update
        return <>{children}</>;
      }
    }
  }

  // Before any state or effect handling, immediately check if we should bypass the route protection
  // This is crucial for dashboard routes where we want to avoid loading screens and flickering
  if (location.pathname.includes('/dashboard')) {
    const userData = TokenService.getUserData();
    const hasValidToken = TokenService.hasValidAuth();
    
    if (hasValidToken && userData && userData.id && userData.role) {
      // Check if the user's role matches the section requirements
      const userIsAdmin = ADMIN_ROLES.includes(userData.role);
      const userIsClient = CLIENT_ROLES.includes(userData.role);
      
      if ((section === 'admin' && userIsAdmin) || (section === 'client' && userIsClient)) {
        console.log(`[ProtectedRoute ${section}] Early bypass: Valid auth for ${section} dashboard confirmed`);
        
        // If we have data but the auth context hasn't updated, trigger an update
        if (!isAuthenticated || !user) {
          window.dispatchEvent(
            new CustomEvent('jwt:authSuccess', {
              detail: { user: userData },
            })
          );
        }
        
        return <>{children}</>;
      }
    }
  }

  const [routeState, setRouteState] = useState<{
    accessChecked: boolean
    accessAllowed: boolean
    checkCount: number
    isVerifying: boolean
    verificationAttempts: number
    userRole?: string
    hasRequiredRole: boolean
    error?: string
  }>({
    accessChecked: false,
    accessAllowed: false,
    checkCount: 0,
    isVerifying: true,
    verificationAttempts: 0,
    hasRequiredRole: false,
  })

  // Create stable references to state values to avoid infinite loops
  const pathRef = useRef(location.pathname)
  const userRef = useRef(user)
  const processingRef = useRef(false)
  const routeStateRef = useRef(routeState)

  // Update the ref when state changes
  useEffect(() => {
    routeStateRef.current = routeState
    // No dependencies since we just want to update the ref
  }, [routeState])

  // Debug logging - keep this separate from the access checking logic
  useEffect(() => {
    console.log(`[ProtectedRoute ${section}] Route state updated:`, {
      isAuthenticated,
      userRole: user?.role,
      path: location.pathname,
      allowedRoles,
      accessChecked: routeState.accessChecked,
      accessAllowed: routeState.accessAllowed,
      checkCount: routeState.checkCount,
      isVerifying: routeState.isVerifying,
      verificationAttempts: routeState.verificationAttempts,
      loading,
    })
  }, [
    isAuthenticated,
    user,
    location.pathname,
    allowedRoles,
    routeState.accessChecked,
    routeState.accessAllowed,
    routeState.checkCount,
    routeState.isVerifying,
    routeState.verificationAttempts,
    loading,
    section,
  ])

  // Add this improved token verification logic that attempts API recovery
  const verifyToken = useCallback(async () => {
    try {
      // Check if we have a token in storage
      const token = TokenStorage.getToken() || TokenService.getToken()
      if (!token) {
        console.log(`[ProtectedRoute ${section}] No token found in storage`)
        return false
      }

      // First, check if we have valid user data in storage
      const userData = TokenService.getUserData() || TokenStorage.getUserData()
      if (userData && userData.id) {
        console.log(`[ProtectedRoute ${section}] Found valid user data with token, auth considered valid`)
        return true
      }

      console.log(`[ProtectedRoute ${section}] Token exists but no user data, attempting to retrieve from API`)

      // Try to get user data from API if we have a token but no user data
      try {
        const apiUser = await jwtApi.getCurrentUser()
        if (apiUser && apiUser.id) {
          console.log(`[ProtectedRoute ${section}] Successfully retrieved user data from API`)
          // Store the user data for future use
          TokenService.storeUserData(apiUser)
          return true
        }
      } catch (apiError) {
        console.error(`[ProtectedRoute ${section}] API user retrieval failed:`, apiError)
        // Continue with validation attempt even if API fails
      }

      // As a fallback, try the validation functions
      const validation = validateTokenStorage()
      if (validation.isValid) {
        console.log(`[ProtectedRoute ${section}] Token validation successful`)
        return true
      }

      console.log(`[ProtectedRoute ${section}] Token validation failed:`, validation)

      // Add a timeout to prevent infinite waiting
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => {
          console.log(`[ProtectedRoute ${section}] Verification timed out`)
          resolve(false)
        }, 5000) // 5 second timeout
      })

      // Race the API call against the timeout
      return Promise.race([jwtApi.verifyAuthentication(), timeoutPromise])
    } catch (error) {
      console.error(`[ProtectedRoute ${section}] Token verification error:`, error)
      return false
    }
  }, [section])

  // Centralized access check function with deterministic behavior
  // This function doesn't use routeState directly, using the ref instead
  const performAccessCheck = useCallback(async () => {
    // Skip if already processing an access check to prevent cascading updates
    if (processingRef.current) return

    // Mark processing started
    processingRef.current = true

    // Use currentRouteState from ref to avoid dependency on routeState
    const currentRouteState = routeStateRef.current

    // Start verification
    setRouteState((prev) => ({ ...prev, isVerifying: true }))

    console.log(
      `[ProtectedRoute ${section}] Performing access check #${currentRouteState.checkCount + 1}`,
      {
        path: location.pathname,
        isAuthenticated,
        user: user ? { id: user.id, role: user.role } : null,
        section,
      }
    )

    // If auth is still initializing, don't make access decision yet
    if (loading.login) {
      console.log(`[ProtectedRoute ${section}] Auth still loading, deferring access check`)
      processingRef.current = false
      return
    }
    
    // Use TokenService to check for valid authentication - this can help
    // handle race conditions where the auth context hasn't updated yet
    const hasValidAuthInStorage = TokenService.hasValidAuth()
    if (hasValidAuthInStorage && !isAuthenticated) {
      console.log(
        `[ProtectedRoute ${section}] Valid auth found in storage but context not updated yet`
      )
      
      // Get user data from storage to use while context updates
      const userData = TokenService.getUserData()
      if (userData && userData.id) {
        console.log(`[ProtectedRoute ${section}] Using user data from storage:`, userData.id)
        
        // Force an auth success event to update context
        window.dispatchEvent(
          new CustomEvent('jwt:authSuccess', {
            detail: { user: userData },
          })
        )
        
        // Early return - we'll let the auth context update trigger another check
        processingRef.current = false
        return
      }
    }

    // Check the most recent login data first
    const userId = sessionStorage.getItem('auth_user_id')
    const userRole = sessionStorage.getItem('auth_user_role')
    const redirectTimestamp = sessionStorage.getItem('auth_redirect_timestamp')
    const isRecentLogin = redirectTimestamp && Date.now() - parseInt(redirectTimestamp, 10) < 10000

    // For fresh logins, we can trust the session data
    if (isRecentLogin && userId && userRole) {
      console.log(`[ProtectedRoute ${section}] Found recent login data in session:`, {
        userId,
        userRole,
      })

      // Check for an authState that matches the session data
      const authState = validateAuthState()
      if (authState.isAuthenticated && authState.user) {
        console.log(`[ProtectedRoute ${section}] Auth validation confirms data is valid`)

        // Dispatch global event to update app state
        window.dispatchEvent(
          new CustomEvent('jwt:authSuccess', {
            detail: { user: authState.user },
          })
        )

        // Immediately grant access for the correct role/section
        const isInCorrectSection =
          (section === 'admin' && userRole === 'admin') ||
          (section === 'client' && (userRole === 'client' || userRole === 'customer'))

        const hasRequiredRole = allowedRoles.length === 0 || allowedRoles.includes(userRole)

        if (isInCorrectSection && hasRequiredRole) {
          console.log(`[ProtectedRoute ${section}] Fast path access granted for ${section} route`)

          setRouteState({
            accessChecked: true,
            accessAllowed: true,
            checkCount: currentRouteState.checkCount + 1,
            isVerifying: false,
            verificationAttempts: 0,
            hasRequiredRole: true,
            userRole,
          })

          processingRef.current = false
          return
        }
      }
    }

    // Continue with regular flow...
    // If local state says we're not authenticated, verify with token storage as a double-check
    if (!isAuthenticated || !user) {
      console.log(
        `[ProtectedRoute ${section}] Local auth state is not authenticated, verifying token`
      )

      // Use our new validation helper for a comprehensive check
      const authState = validateAuthState()

      // If our validation helper confirms authentication, but the context doesn't reflect it
      if (authState.isAuthenticated && authState.user) {
        console.log(
          `[ProtectedRoute ${section}] Auth state validation found valid authentication that's not reflected in context`,
          {
            tokenExists: authState.tokenExists,
            tokenExpired: authState.tokenExpired,
            userId: authState.user.id,
            role: authState.user.role,
          }
        )

        // Trigger an auth success event to force state update
        window.dispatchEvent(
          new CustomEvent('jwt:authSuccess', {
            detail: { user: authState.user },
          })
        )

        // End this check cycle and wait for state update
        setRouteState((prev) => ({
          ...prev,
          isVerifying: false,
          checkCount: prev.checkCount + 1,
        }))
        processingRef.current = false
        return
      }

      // Limit verification attempts to prevent infinite loops
      if (currentRouteState.verificationAttempts >= 3) {
        console.log(
          `[ProtectedRoute ${section}] Maximum verification attempts reached, denying access`
        )
        setRouteState((prev) => ({
          accessChecked: true,
          accessAllowed: false,
          checkCount: prev.checkCount + 1,
          isVerifying: false,
          verificationAttempts: prev.verificationAttempts,
          hasRequiredRole: false,
          userRole: user?.role,
        }))
        processingRef.current = false
        return
      }

      // Increment verification attempts
      setRouteState((prev) => ({
        ...prev,
        verificationAttempts: prev.verificationAttempts + 1,
      }))

      const tokenIsValid = await verifyToken()

      if (!tokenIsValid) {
        console.log(`[ProtectedRoute ${section}] Token verification failed, denying access`)
        setRouteState((prev) => ({
          accessChecked: true,
          accessAllowed: false,
          checkCount: prev.checkCount + 1,
          isVerifying: false,
          verificationAttempts: prev.verificationAttempts,
          hasRequiredRole: false,
          userRole: user?.role,
        }))
        processingRef.current = false
        return
      } else {
        console.log(
          `[ProtectedRoute ${section}] Token verification succeeded, proceeding with access check`
        )

        // If token is valid, manually refresh the user data to try to fix state issues
        try {
          console.log(`[ProtectedRoute ${section}] Manually refreshing user data`)
          const userData = await jwtApi.getCurrentUser()
          if (userData) {
            console.log(`[ProtectedRoute ${section}] Successfully refreshed user data:`, {
              id: userData.id,
              role: userData.role,
            })

            // Manually update route state with the refreshed user data
            setRouteState((prev) => ({
              ...prev,
              isVerifying: false,
              hasRequiredRole: allowedRoles.length === 0 || allowedRoles.includes(userData.role),
              userRole: userData.role,
            }))
          }
        } catch (error) {
          console.error(`[ProtectedRoute ${section}] Error refreshing user data:`, error)
        }

        // If token is valid but state doesn't reflect it, wait for state to update
        setRouteState((prev) => ({
          ...prev,
          isVerifying: false,
          hasRequiredRole: prev.hasRequiredRole,
        }))
        processingRef.current = false
        return
      }
    }

    // Store current user reference
    userRef.current = user

    // Determine role compatibility
    let hasRequiredRole = true
    if (allowedRoles.length > 0) {
      hasRequiredRole = allowedRoles.some((role) => {
        // Handle role group matching
        if (role === 'admin' && ADMIN_ROLES.includes(user.role)) return true
        if (role === 'client' && CLIENT_ROLES.includes(user.role)) return true
        return role === user.role
      })
    } else {
      // If no specific roles required, default to section-based access
      hasRequiredRole =
        section === 'admin' ? ADMIN_ROLES.includes(user.role) : CLIENT_ROLES.includes(user.role)
    }

    // Check section compatibility
    const isInCorrectSection =
      (section === 'admin' && ADMIN_ROLES.includes(user.role)) ||
      (section === 'client' && CLIENT_ROLES.includes(user.role))

    // Log additional details for debugging
    console.log(`[ProtectedRoute ${section}] Access check details:`, {
      userRole: user.role,
      allowedRoles,
      hasRequiredRole,
      isInCorrectSection,
      path: location.pathname,
      section,
    })

    // User needs both the required role AND must be in the correct section
    const hasAccess = hasRequiredRole && isInCorrectSection

    // Update component state with access decision
    setRouteState((prev) => ({
      accessChecked: true,
      accessAllowed: hasAccess,
      checkCount: prev.checkCount + 1,
      isVerifying: false,
      verificationAttempts: 0, // Reset verification attempts on successful check
      hasRequiredRole, // Add the missing hasRequiredRole property
      userRole: user?.role,
    }))

    // Mark processing completed
    processingRef.current = false
  }, [isAuthenticated, user, loading.login, location.pathname, section, allowedRoles, verifyToken]) // Removed routeState dependencies

  // Perform access check when relevant dependencies change
  useEffect(() => {
    // Check if this might be a fresh login redirect
    const redirectTimestamp = sessionStorage.getItem('auth_redirect_timestamp')
    const isRecentRedirect =
      redirectTimestamp && Date.now() - parseInt(redirectTimestamp, 10) < 5000 // Within 5 seconds

    if (isRecentRedirect) {
      console.log(`[ProtectedRoute ${section}] Detected recent authentication redirect`, {
        redirectTimestamp,
        elapsedMs: Date.now() - parseInt(redirectTimestamp, 10),
      })
    }

    // Only trigger a new check when a meaningful change occurs
    const shouldRecheck =
      !routeStateRef.current.accessChecked || // Initial check
      pathRef.current !== location.pathname || // Path changed
      userRef.current !== user || // User changed
      loading.login === false // Auth loading just completed

    if (shouldRecheck) {
      pathRef.current = location.pathname

      // If we detect this is a fresh login redirect, AND we have valid tokens in storage
      // immediately update local state to prevent double loading screens
      if (isRecentRedirect) {
        const authState = validateAuthState()

        if (authState.isAuthenticated && authState.user) {
          console.log(
            `[ProtectedRoute ${section}] Recent login detected with valid auth state, using storage data`,
            {
              userId: authState.user.id,
              role: authState.user.role,
            }
          )

          setRouteState((prev) => ({
            ...prev,
            userRole: authState.user?.role,
            hasRequiredRole:
              allowedRoles.length === 0 ||
              (!!authState.user?.role && allowedRoles.includes(authState.user.role)),
            accessChecked: true,
            accessAllowed: true,
            isVerifying: false,
          }))

          // Force the auth success event again to ensure context is updated
          window.dispatchEvent(
            new CustomEvent('jwt:authSuccess', {
              detail: { user: authState.user },
            })
          )

          // Clear the redirect timestamp to avoid reprocessing
          sessionStorage.removeItem('auth_redirect_timestamp')
        }
      }

      // Still do the normal check
      if (isAuthenticated && user && user.role) {
        console.log(
          `[ProtectedRoute ${section}] User is authenticated with role ${user.role}, updating state immediately`
        )
        setRouteState((prev) => ({
          ...prev,
          userRole: user.role,
          hasRequiredRole: allowedRoles.length === 0 || allowedRoles.includes(user.role),
          accessChecked: true,
          accessAllowed: true,
          isVerifying: false,
        }))
      }

      performAccessCheck()
    }
  }, [isAuthenticated, user, loading.login, location.pathname, performAccessCheck])

  // Show loading screen during initial access check or auth loading
  if (routeState.isVerifying || !routeState.accessChecked || loading.login) {
    // First, try to use TokenService for immediate validation in dashboard routes
    if (location.pathname.includes('/dashboard')) {
      // Double check with TokenService to ensure we have valid tokens
      if (TokenService.hasValidAuth()) {
        const userData = TokenService.getUserData();
        
        // If the user role matches the section, render immediately
        if (userData && userData.role) {
          const userIsAdmin = ADMIN_ROLES.includes(userData.role);
          const userIsClient = CLIENT_ROLES.includes(userData.role);
          
          if ((section === 'admin' && userIsAdmin) || (section === 'client' && userIsClient)) {
            console.log(
              `[ProtectedRoute ${section}] Bypassing loading for dashboard - TokenService validation successful`
            );
            
            // If not already in authenticated state, trigger the auth event
            if (!isAuthenticated || !user) {
              window.dispatchEvent(
                new CustomEvent('jwt:authSuccess', {
                  detail: { user: userData },
                })
              );
            }
            
            return <>{children}</>;
          }
        }
      }
    }
    
    // Check if this is direct URL access after login
    const authState = validateAuthState()

    // If we already have valid auth data in storage, we can skip the loading screen
    if (authState.isAuthenticated && authState.user) {
      // For dashboard routes, check if the user role matches the section
      const isCorrectSection =
        section === 'admin'
          ? ADMIN_ROLES.includes(authState.user.role)
          : CLIENT_ROLES.includes(authState.user.role)

      const isDashboardRoute = location.pathname.includes('/dashboard')

      // If this is a dashboard route and user role matches section, render immediately
      if (isDashboardRoute && isCorrectSection) {
        console.log(
          `[ProtectedRoute ${section}] Bypassing loading screen - valid auth found for ${section} dashboard`
        )
        return <>{children}</>
      }
    }

    return <LoadingScreen />
  }

  // Handle non-authenticated users - redirect to correct login page
  if (!isAuthenticated) {
    console.log(
      `[ProtectedRoute ${section}] User not authenticated, redirecting to:`,
      section === 'admin' ? '/admin/login' : '/login'
    )

    // Redirect to the appropriate login page based on section
    const loginPath = section === 'admin' ? '/admin/login' : '/login'
    return <Navigate to={loginPath} state={{ from: location }} replace />
  }

  // Handle authenticated users who don't have access to this route
  if (!routeState.accessAllowed && user) {
    // Determine appropriate redirect based on user role
    const isAdminUser = ADMIN_ROLES.includes(user.role)
    const redirectPath = isAdminUser ? '/admin/dashboard' : '/client/dashboard'

    // Only redirect if we're not already on the target dashboard
    if (location.pathname === redirectPath) {
      console.log(
        `[ProtectedRoute ${section}] Already on dashboard ${redirectPath}, allowing access to prevent loop`
      )
      return <>{children}</>
    }

    // Also allow access to current path if we're in the right section
    // to prevent redirect loops during login transitions
    const isInCorrectSection =
      (section === 'admin' && ADMIN_ROLES.includes(user.role)) ||
      (section === 'client' && CLIENT_ROLES.includes(user.role))

    if (
      isInCorrectSection &&
      ((location.pathname.startsWith('/admin/') && ADMIN_ROLES.includes(user.role)) ||
        (location.pathname.startsWith('/client/') && CLIENT_ROLES.includes(user.role)))
    ) {
      console.log(`[ProtectedRoute ${section}] User is in correct section, allowing access`)
      return <>{children}</>
    }

    console.log(
      `[ProtectedRoute ${section}] User (role: ${user.role}) does not have required access, redirecting to:`,
      redirectPath
    )

    // Special case for admin settings
    if (location.pathname === '/admin/settings' && ADMIN_ROLES.includes(user.role)) {
      console.log(
        `[ProtectedRoute ${section}] SPECIAL CASE: Admin settings access override for debugging`
      )
      return <>{children}</>
    }

    return <Navigate to={redirectPath} replace />
  }

  // User has access, render the protected content
  console.log(
    `[ProtectedRoute ${section}] Access granted for ${section} route: ${location.pathname}`
  )
  return <>{children}</>
}

export default ProtectedRoute
