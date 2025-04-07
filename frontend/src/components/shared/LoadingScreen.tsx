import React, { useEffect, useState } from 'react'
import { CircleLoader } from 'react-spinners'
import { validateAuthState } from '@/services/jwtApi'

interface LoadingScreenProps {
  message?: string
}

/**
 * A consistent loading screen component that can be used throughout the app
 *
 * @param props Component properties
 * @param props.message Optional custom loading message
 */
export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = 'Loading...' }) => {
  const [isBypassing, setIsBypassing] = useState(false)

  // Check if we should bypass the loading screen (for dashboard routes)
  useEffect(() => {
    // If we're on a dashboard route and have auth data, we should force a reload
    const isDashboardRoute = window.location.pathname.includes('/dashboard')
    const redirectTimestamp = sessionStorage.getItem('auth_redirect_timestamp')
    const isRecentLogin = redirectTimestamp && Date.now() - parseInt(redirectTimestamp, 10) < 10000

    if (isDashboardRoute) {
      const authState = validateAuthState()

      // If we have valid auth data but are still seeing a loading screen on the dashboard
      if (authState.isAuthenticated && authState.user && isRecentLogin) {
        console.log('[LoadingScreen] Valid auth data detected on dashboard route, forcing reload')
        setIsBypassing(true)
        // Force reload the page to initialize with correct auth state
        window.location.reload()
      }
    }
  }, [])

  if (isBypassing) {
    return null // Don't show anything while bypassing
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="p-4 bg-white rounded-lg shadow-md text-center">
        <CircleLoader size={50} color="#fdba6b" />
        <p className="mt-4 text-gray-600">{message}</p>
      </div>
    </div>
  )
}

export default LoadingScreen
