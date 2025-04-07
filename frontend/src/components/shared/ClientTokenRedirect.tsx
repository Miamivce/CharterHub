import React, { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import jwtApi, { TokenStorage } from '@/services/jwtApi'
import { LoadingScreen } from '@/components/shared/LoadingScreen'

interface ClientTokenRedirectProps {
  children: React.ReactNode
}

export const ClientTokenRedirect: React.FC<ClientTokenRedirectProps> = ({ children }) => {
  const [loading, setLoading] = useState(true)
  const [hasValidToken, setHasValidToken] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const verifyToken = async () => {
      setLoading(true)
      try {
        // Check if we have a token
        const token = TokenStorage.getToken()

        console.log('[ClientTokenRedirect] Checking token:', !!token)

        if (!token) {
          console.log('[ClientTokenRedirect] No token found, redirecting to login')
          window.location.href = '/login' // Use direct window location for clean redirect
          return
        }

        // Get user data from storage
        const userData = TokenStorage.getUserData()
        console.log('[ClientTokenRedirect] User data from storage:', userData)

        if (!userData || !userData.id || !userData.role) {
          console.log('[ClientTokenRedirect] Invalid user data, redirecting to login')
          window.location.href = '/login'
          return
        }

        // Check if user role is client
        if (userData.role !== 'client') {
          console.log(
            '[ClientTokenRedirect] User is not a client, redirecting to appropriate dashboard'
          )
          if (userData.role === 'admin') {
            window.location.href = '/admin/dashboard'
          } else {
            window.location.href = '/'
          }
          return
        }

        try {
          // Try to refresh user data from API for the most current information
          console.log('[ClientTokenRedirect] Attempting to refresh user data from API')
          const freshUserData = await jwtApi.getCurrentUser()
          console.log('[ClientTokenRedirect] Received fresh user data:', freshUserData)

          if (freshUserData && freshUserData.id) {
            // Update stored user data
            TokenStorage.storeUserData(freshUserData)
          }
        } catch (refreshError) {
          // If refresh fails, continue with stored data
          console.log('[ClientTokenRedirect] Could not refresh user data, using stored data')
        }

        // We have a valid token and client user
        console.log('[ClientTokenRedirect] Valid client token found, proceeding to dashboard')
        setHasValidToken(true)
      } catch (error) {
        console.error('[ClientTokenRedirect] Error verifying token:', error)
        window.location.href = '/login'
      } finally {
        setLoading(false)
      }
    }

    verifyToken()
  }, [navigate])

  if (loading) {
    return <LoadingScreen message="Loading your dashboard..." />
  }

  if (!hasValidToken) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default ClientTokenRedirect
