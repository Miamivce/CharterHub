import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useJWTAuth } from '@/contexts/auth/JWTAuthContext'

interface JWTProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: ('admin' | 'client')[]
  redirectTo?: string
}

/**
 * JWTProtectedRoute - A route guard component that uses JWT authentication
 *
 * This component checks if the user is authenticated and has the required role
 * before rendering its children. If not, it redirects to the login page or
 * another specified location.
 *
 * @param {React.ReactNode} children - The content to render if authenticated
 * @param {('admin' | 'client')[]} allowedRoles - Optional roles that are allowed to access this route
 * @param {string} redirectTo - Optional redirect path, defaults to /login
 */
export const JWTProtectedRoute: React.FC<JWTProtectedRouteProps> = ({
  children,
  allowedRoles,
  redirectTo = '/login',
}) => {
  const { isAuthenticated, isInitialized, user } = useJWTAuth()
  const location = useLocation()

  // Show loading state while initializing auth
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  // Check role access if roles are specified and user exists
  if (allowedRoles && allowedRoles.length > 0 && user) {
    const hasRequiredRole = allowedRoles.includes(user.role as 'admin' | 'client')

    if (!hasRequiredRole) {
      // Redirect to dashboard or access denied page based on user role
      const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/dashboard'
      return <Navigate to={redirectPath} replace />
    }
  }

  // User is authenticated and has required role (if specified)
  return <>{children}</>
}

export default JWTProtectedRoute
