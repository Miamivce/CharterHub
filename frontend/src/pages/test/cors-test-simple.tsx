import React, { useState } from 'react'

/**
 * Simplified CORS Test Component
 *
 * This component tests CORS by making a direct fetch to the backend
 * without using any of the application's API utilities
 */
function CorsTestSimple() {
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const testEndpoint = async (endpoint) => {
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const response = await fetch(`http://localhost:8000/${endpoint}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      console.log(`CORS test for ${endpoint}:`, data)
      setResult(data)
    } catch (err) {
      console.error(`CORS test for ${endpoint} failed:`, err)
      setError(err.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Simple CORS Test</h1>
      <p className="mb-6 text-gray-600">
        This page tests CORS by making direct fetch requests to the backend.
      </p>

      <div className="space-y-4">
        <div>
          <button
            onClick={() => testEndpoint('test-cors.php')}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded mr-2"
          >
            Test CORS Endpoint
          </button>

          <button
            onClick={() => testEndpoint('auth/me.php')}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            Test Auth Endpoint
          </button>
        </div>

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

export default CorsTestSimple
