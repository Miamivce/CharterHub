import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useJWTAuth } from '@/contexts/auth/JWTAuthContext'

const AuthDebugPage: React.FC = () => {
  const jwtAuth = useJWTAuth()
  const [tokenData, setTokenData] = useState<Record<string, any>>({})

  // Fetch token data from localStorage on mount
  useEffect(() => {
    const localStorageData: Record<string, any> = {}

    // Check for common auth token keys
    const keys = [
      'auth_token',
      'refresh_token',
      'token_expiry',
      'user_data',
      'csrf_token',
      'csrf_token_timestamp',
    ]

    keys.forEach((key) => {
      try {
        const value = localStorage.getItem(key)
        if (value) {
          try {
            // Try to parse JSON
            localStorageData[key] = JSON.parse(value)
          } catch (e) {
            // If not JSON, store as string
            localStorageData[key] = value
          }
        }
      } catch (error) {
        console.error(`Error reading ${key} from localStorage:`, error)
      }
    })

    setTokenData(localStorageData)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h1 className="text-2xl font-bold mb-6">Authentication Debug Page</h1>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="flex space-x-4">
              <Link
                to="/login"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Legacy Login
              </Link>
              <Link
                to="/jwt-login"
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
              >
                JWT Login
              </Link>
              <Link
                to="/dashboard"
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
              >
                Go to Dashboard
              </Link>
              <button
                onClick={() => {
                  localStorage.clear()
                  sessionStorage.clear()
                  window.location.reload()
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
              >
                Clear All Storage
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">JWT Auth Provider</h2>
              <div className="space-y-2">
                <div>
                  <strong>Initialized:</strong> {jwtAuth.isInitialized ? 'Yes' : 'No'}
                </div>
                <div>
                  <strong>Authenticated:</strong> {jwtAuth.isAuthenticated ? 'Yes' : 'No'}
                </div>
                <div>
                  <strong>Loading:</strong> {JSON.stringify(jwtAuth.loading || {})}
                </div>
                <div>
                  <strong>Errors:</strong> {JSON.stringify(jwtAuth.errors || {})}
                </div>
                <div className="mt-4">
                  <strong>User:</strong>
                  <pre className="bg-gray-100 p-2 rounded mt-2 overflow-x-auto">
                    {JSON.stringify(jwtAuth.user, null, 2) || 'No user data'}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">Local Storage Tokens</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
              {JSON.stringify(tokenData, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthDebugPage
