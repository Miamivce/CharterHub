import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useJWTAuth } from '@/contexts/auth/JWTAuthContext'
import { LoadingScreen } from '@/components/shared/LoadingScreen'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
}

/**
 * UpdatedProtectedRoute - A component that protects routes requiring authentication
 *
 * This component uses the JWT authentication system to verify if a user
 * is authenticated and has the required roles before allowing access to a route.
 *
 * If the user is not authenticated, they are redirected to the login page.
 * If the user doesn't have the required roles, they are redirected to an unauthorized page.
 */
export const UpdatedProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = [],
}) => {
  const { isAuthenticated, user, isInitialized } = useJWTAuth()
  const location = useLocation()

  // Show loading screen while authentication status is being determined
  if (!isInitialized) {
    return <LoadingScreen message="Verifying your access..." />
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If roles are specified and user doesn't have any of the required roles
  if (allowedRoles.length > 0 && user && user.role && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  // User is authenticated and has required roles (or no roles required)
  return <>{children}</>
}

export default UpdatedProtectedRoute
