import React, { useState } from 'react'

/**
 * Direct CORS Test Component
 *
 * This component tests CORS by making a direct fetch to the login endpoint
 */
function CorsDirectTest() {
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const testLogin = async () => {
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const response = await fetch('http://localhost:8000/auth/login.php', {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
          rememberMe: false,
        }),
      })

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`)
      }

      const data = await response.json()
      console.log('CORS test response:', data)
      setResult(data)
    } catch (err: any) {
      console.error('CORS test failed:', err)
      setError(err.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Direct CORS Login Test</h1>
      <p className="mb-6 text-gray-600">
        This page tests CORS by making a direct fetch request to the login endpoint.
      </p>

      <div className="space-y-4">
        <button
          onClick={testLogin}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          {loading ? 'Testing...' : 'Test Login API'}
        </button>

        {loading && <div className="text-gray-500">Loading...</div>}

        {error && (
          <div className="p-4 bg-red-100 border border-red-300 rounded">
            <h3 className="font-bold text-red-700">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="p-4 bg-green-100 border border-green-300 rounded">
            <h3 className="font-bold text-green-700">Success</h3>
            <pre className="mt-2 overflow-auto bg-white p-2 rounded text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default CorsDirectTest
