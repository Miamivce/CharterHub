import React from 'react'
import { useJWTAuth } from '@/contexts/auth/JWTAuthContext'

/**
 * Migration Test Component
 *
 * This component demonstrates the JWT authentication system.
 * It was previously using the legacy auth context API through the compatibility layer,
 * but has now been fully migrated to use the JWT authentication system directly.
 */
export const MigrationTest: React.FC = () => {
  const { user, isAuthenticated, loading, login, logout } = useJWTAuth()
  const isLoading = loading?.login || loading?.logout || false

  const handleLogin = async () => {
    try {
      await login('test@example.com', 'password')
    } catch (error) {
      console.error('Login error:', error)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">Authentication Migration Test</h1>

        <div className="mb-6 bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Auth State:</h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="font-medium">Authenticated:</div>
            <div>{isAuthenticated ? 'Yes ✅' : 'No ❌'}</div>

            <div className="font-medium">Loading:</div>
            <div>{isLoading ? 'Yes ⏳' : 'No ✅'}</div>
          </div>
        </div>

        {user ? (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">User Information:</h2>
            <div className="bg-gray-100 p-4 rounded">
              <pre className="whitespace-pre-wrap overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
            <button
              onClick={() => logout()}
              className="mt-4 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Login Test:</h2>
            <button
              onClick={handleLogin}
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Test Login with Legacy API
            </button>
          </div>
        )}

        <div className="mt-8 border-t pt-4">
          <h2 className="text-lg font-semibold mb-2">How This Works:</h2>
          <p className="mb-2">
            This component uses the <code className="bg-gray-200 px-1 rounded">useJWTAuth</code>{' '}
            hook from the JWT authentication context, but behind the scenes, it's now powered by the
            JWT authentication system.
          </p>
          <p>
            The <code className="bg-gray-200 px-1 rounded">JWTAuthContext</code> creates a
            compatibility layer that allows existing components to continue working without
            modification while leveraging the improved security of JWT tokens.
          </p>
        </div>
      </div>
    </div>
  )
}

export default MigrationTest
