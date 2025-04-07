import { useState, useEffect, useRef } from 'react'
import { AdminUserManagement } from '@/components/admin/AdminUserManagement'
import { useLocation } from 'react-router-dom'
import { useJWTAuth } from '@/contexts/auth/JWTAuthContext'
import LoginDebugHelper from '@/components/admin/LoginDebugHelper'

function Settings() {
  const location = useLocation()
  const { user, isAuthenticated } = useJWTAuth()
  const mountedRef = useRef(false)

  // Log only on initial mount for debugging
  useEffect(() => {
    // Handle StrictMode double-mount by tracking if we've already mounted
    if (mountedRef.current) return
    mountedRef.current = true

    console.log('[ADMIN SETTINGS] Component mounted', {
      timestamp: new Date().toISOString(),
      path: location.pathname,
      isAuthenticated,
      userRole: user?.role,
    })

    // Only log unmount
    return () => {
      console.log('[ADMIN SETTINGS] Component unmounted', {
        timestamp: new Date().toISOString(),
      })
    }
  }, [])

  const [activeTab, setActiveTab] = useState('users')

  // Log when the active tab changes
  useEffect(() => {
    console.log('[ADMIN SETTINGS] Active tab changed to:', activeTab)
  }, [activeTab])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Admin Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure application settings and manage admin users
        </p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`${
              activeTab === 'users'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Admin Users
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`${
              activeTab === 'general'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            General Settings
          </button>
          <button
            onClick={() => setActiveTab('debug')}
            className={`${
              activeTab === 'debug'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Debug Tools
          </button>
        </nav>
      </div>

      <div>
        {activeTab === 'users' && <AdminUserManagement />}
        {activeTab === 'general' && (
          <div className="mt-4 p-6 bg-white rounded-lg shadow">
            <h2 className="text-lg font-medium text-gray-900">General Settings</h2>
            <p className="mt-1 text-sm text-gray-500">
              Additional settings will be added here in the future.
            </p>
          </div>
        )}
        {activeTab === 'debug' && (
          <div className="mt-4 p-6 bg-white rounded-lg shadow">
            <h2 className="text-lg font-medium text-gray-900">Authentication Debugging</h2>
            <p className="mt-1 text-sm text-gray-500 mb-4">
              Use these tools to diagnose authentication issues with the admin API.
            </p>
            <LoginDebugHelper />
          </div>
        )}
      </div>
    </div>
  )
}

// Export the component directly as the default export
export default Settings
