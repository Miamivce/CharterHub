import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useJWTAuth } from '@/contexts/auth/JWTAuthContext'
import { ensureStateSync } from '@/utils/state-sync'

/**
 * Hook to handle authentication-based redirects with proper state synchronization
 * Use this in protected route components to ensure reliable access control
 *
 * @param redirectPath Path to redirect to if not authenticated
 * @param requiredRole Optional role required to access the route
 */
export function useAuthRedirect(redirectPath = '/login', requiredRole?: string) {
  const { isAuthenticated, isInitialized, user } = useJWTAuth()
  const navigate = useNavigate()
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    let mounted = true

    // Function to check auth and redirect
    const checkAuthAndRedirect = async () => {
      // Only proceed if component is still mounted
      if (!mounted) return

      // Wait for auth to initialize
      if (!isInitialized) return

      // Ensure state updates have propagated
      await ensureStateSync(20)

      // Redirect if not authenticated
      if (!isAuthenticated) {
        console.log('[useAuthRedirect] Not authenticated, redirecting to', redirectPath)
        navigate(redirectPath, { replace: true })
        return
      }

      // Check role access if specified
      if (requiredRole && user && user.role !== requiredRole) {
        console.log(
          `[useAuthRedirect] User role '${user.role}' does not match required role '${requiredRole}'`
        )

        // Redirect based on user's role
        const rolePath = user.role === 'admin' ? '/admin/dashboard' : '/dashboard'
        navigate(rolePath, { replace: true })
        return
      }

      // Mark auth as checked to unblock rendering if needed
      if (mounted) {
        setAuthChecked(true)
      }
    }

    // Add a small delay to ensure auth state has propagated
    const timeoutId = setTimeout(checkAuthAndRedirect, 50)

    return () => {
      mounted = false
      clearTimeout(timeoutId)
    }
  }, [isAuthenticated, isInitialized, user, navigate, redirectPath, requiredRole])

  return { authChecked, isAuthenticated, isInitialized }
}
