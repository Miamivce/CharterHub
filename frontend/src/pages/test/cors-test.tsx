import React, { useState } from 'react'
import jwtApi from '@/services/jwtApi'

/**
 * CORS Test Page
 *
 * Tests CORS configuration with various API endpoints
 */
function CorsTestPage() {
  const [results, setResults] = useState<{ [key: string]: any }>({})
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({})
  const [error, setError] = useState<{ [key: string]: any }>({})

  const runTest = async (name: string, testFn: () => Promise<any>) => {
    setLoading((prev) => ({ ...prev, [name]: true }))
    setError((prev) => ({ ...prev, [name]: null }))

    try {
      const result = await testFn()
      setResults((prev) => ({ ...prev, [name]: result }))
    } catch (err: any) {
      console.error(`Test ${name} failed:`, err)
      setError((prev) => ({
        ...prev,
        [name]: {
          message: err.message,
          status: err.status,
          details: err.details || {},
        },
      }))
    } finally {
      setLoading((prev) => ({ ...prev, [name]: false }))
    }
  }

  const testCors = () => runTest('corsTest', () => jwtApi.testCors())

  const testLogin = () =>
    runTest('login', () => jwtApi.login('test@example.com', 'password123', false))

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">API CORS Test Page</h1>

      <div className="space-y-6">
        <div className="border rounded p-4">
          <h2 className="text-xl font-semibold mb-3">CORS Test Endpoint</h2>
          <button
            onClick={testCors}
            disabled={loading.corsTest}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading.corsTest ? 'Testing...' : 'Run CORS Test'}
          </button>

          {results.corsTest && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
              <h3 className="font-semibold text-green-700">Success!</h3>
              <pre className="mt-2 text-sm bg-white p-2 rounded overflow-auto">
                {JSON.stringify(results.corsTest, null, 2)}
              </pre>
            </div>
          )}

          {error.corsTest && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
              <h3 className="font-semibold text-red-700">Error</h3>
              <pre className="mt-2 text-sm bg-white p-2 rounded overflow-auto">
                {JSON.stringify(error.corsTest, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="border rounded p-4">
          <h2 className="text-xl font-semibold mb-3">Login API Test</h2>
          <button
            onClick={testLogin}
            disabled={loading.login}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading.login ? 'Testing...' : 'Test Login API'}
          </button>

          <p className="mt-2 text-sm text-gray-500">
            Note: This uses test credentials and will likely fail with auth errors, but we're
            testing CORS, not auth.
          </p>

          {error.login && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
              <h3 className="font-semibold text-red-700">Error</h3>
              <pre className="mt-2 text-sm bg-white p-2 rounded overflow-auto">
                {JSON.stringify(error.login, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CorsTestPage
