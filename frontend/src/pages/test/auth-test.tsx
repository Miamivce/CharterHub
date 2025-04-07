import React, { useState, useEffect } from 'react'
import axios from 'axios'
import wpApi, { localApi } from '../../services/wpApi'

const AuthTest: React.FC = () => {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [authType, setAuthType] = useState<'basic' | 'bearer'>('basic')
  const [useJwt, setUseJwt] = useState<boolean>(false)
  const [jwtToken, setJwtToken] = useState<string>('')
  const [appPassword, setAppPassword] = useState<string>('')

  const [connectionResult, setConnectionResult] = useState<string | null>(null)
  const [authResult, setAuthResult] = useState<string | null>(null)
  const [authEndpointResult, setAuthEndpointResult] = useState<string | null>(null)
  const [jwtResult, setJwtResult] = useState<string | null>(null)
  const [allTestsResult, setAllTestsResult] = useState<Record<string, any> | null>(null)

  const [loading, setLoading] = useState({
    connection: false,
    auth: false,
    authEndpoint: false,
    jwt: false,
    allTests: false,
  })

  const [error, setError] = useState({
    connection: null as string | null,
    auth: null as string | null,
    authEndpoint: null as string | null,
    jwt: null as string | null,
    allTests: null as string | null,
  })

  // Check if JWT mode is enabled from environment variable
  useEffect(() => {
    const isJwtMode = localStorage.getItem('wp_jwt_token') !== null
    setUseJwt(isJwtMode)
    if (isJwtMode) {
      setJwtToken(localStorage.getItem('wp_jwt_token') || '')
    }

    // Check for stored credentials
    const storedCredentials = localStorage.getItem('wp_user_credentials')
    if (storedCredentials) {
      try {
        const decodedCreds = atob(storedCredentials)
        const [user, pass] = decodedCreds.split(':')
        if (user) setUsername(user)
        if (pass) setAppPassword(pass)
      } catch (e) {
        console.error('Failed to decode stored credentials', e)
      }
    }

    // Show environment variables
    console.log('Environment variables:', {
      VITE_USE_JWT: import.meta.env.VITE_USE_JWT,
      VITE_WP_API_URL: import.meta.env.VITE_WP_API_URL,
      VITE_WP_LIVE_API_URL: import.meta.env.VITE_WP_LIVE_API_URL,
      VITE_WORDPRESS_USERNAME: import.meta.env.VITE_WORDPRESS_USERNAME,
      // Don't log the actual password
      VITE_WORDPRESS_APPLICATION_PASSWORD: import.meta.env.VITE_WORDPRESS_APPLICATION_PASSWORD
        ? '[REDACTED]'
        : 'undefined',
    })
  }, [])

  const testConnection = async () => {
    setLoading((prev) => ({ ...prev, connection: true }))
    setConnectionResult(null)
    setError((prev) => ({ ...prev, connection: null }))

    try {
      const result = await wpApi.testConnection()
      setConnectionResult(JSON.stringify(result, null, 2))
    } catch (err: any) {
      setError((prev) => ({
        ...prev,
        connection:
          err.message +
          (err.response ? ` (${err.response.status}: ${err.response.statusText})` : ''),
      }))
    } finally {
      setLoading((prev) => ({ ...prev, connection: false }))
    }
  }

  const testBasicAuth = async () => {
    setLoading((prev) => ({ ...prev, auth: true }))
    setAuthResult(null)
    setError((prev) => ({ ...prev, auth: null }))

    try {
      // Create Basic Auth header
      const credentials = btoa(`${username}:${password}`)
      const headers = {
        Authorization: `Basic ${credentials}`,
      }

      console.log('Using Basic Auth headers:', headers)

      // Use localApi instance which will route through our proxy
      const response = await localApi.get('/wp/v2/users/me', { headers })
      setAuthResult(JSON.stringify(response.data, null, 2))

      // Store credentials for future use
      localStorage.setItem('wp_user_credentials', credentials)
    } catch (err: any) {
      setError((prev) => ({
        ...prev,
        auth:
          err.message +
          (err.response ? ` (${err.response.status}: ${err.response.statusText})` : ''),
      }))
      console.error('Auth error:', err)
      if (err.response) {
        console.error('Response data:', err.response.data)
        console.error('Response headers:', err.response.headers)
      }
    } finally {
      setLoading((prev) => ({ ...prev, auth: false }))
    }
  }

  const testBearerAuth = async () => {
    setLoading((prev) => ({ ...prev, auth: true }))
    setAuthResult(null)
    setError((prev) => ({ ...prev, auth: null }))

    try {
      // Use JWT token if available, otherwise use password as token
      let token

      if (jwtToken) {
        token = jwtToken
        console.log('Using stored JWT token for Bearer auth')
      } else {
        // Format password - remove any spaces if it's an application password
        token = password.replace(/\s+/g, '')
        console.log('Using formatted password as Bearer token')
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      }

      console.log('Using Bearer headers:', {
        Authorization: `Bearer ${token.substring(0, 10)}...`,
      })

      // Use localApi instance which will route through our proxy
      const response = await localApi.get('/wp/v2/users/me', { headers })
      setAuthResult(JSON.stringify(response.data, null, 2))
    } catch (err: any) {
      setError((prev) => ({
        ...prev,
        auth:
          err.message +
          (err.response ? ` (${err.response.status}: ${err.response.statusText})` : ''),
      }))
      console.error('Auth error:', err)
      if (err.response) {
        console.error('Response data:', err.response.data)
        console.error('Response headers:', err.response.headers)
      }
    } finally {
      setLoading((prev) => ({ ...prev, auth: false }))
    }
  }

  const testAuthEndpoint = async () => {
    setLoading((prev) => ({ ...prev, authEndpoint: true }))
    setAuthEndpointResult(null)
    setError((prev) => ({ ...prev, authEndpoint: null }))

    try {
      let headers = {}

      if (authType === 'basic') {
        // Create Basic Auth header
        const credentials = btoa(`${username}:${password}`)
        headers = {
          Authorization: `Basic ${credentials}`,
        }
      } else {
        // Use Bearer token auth
        const token = jwtToken || password.replace(/\s+/g, '')
        headers = {
          Authorization: `Bearer ${token}`,
        }
      }

      console.log(`Using ${authType} auth headers for custom endpoint:`, headers)

      // Use localApi instance which will route through our proxy
      const response = await localApi.get('/charterhub/v1/auth-test', { headers })
      setAuthEndpointResult(JSON.stringify(response.data, null, 2))
    } catch (err: any) {
      setError((prev) => ({
        ...prev,
        authEndpoint:
          err.message +
          (err.response ? ` (${err.response.status}: ${err.response.statusText})` : ''),
      }))
      console.error('Auth endpoint error:', err)
      if (err.response) {
        console.error('Response data:', err.response.data)
        console.error('Response headers:', err.response.headers)
      }
    } finally {
      setLoading((prev) => ({ ...prev, authEndpoint: false }))
    }
  }

  const testJwtAuth = async () => {
    setLoading((prev) => ({ ...prev, jwt: true }))
    setJwtResult(null)
    setError((prev) => ({ ...prev, jwt: null }))

    try {
      // Format password - remove any spaces
      const formattedPassword = password.replace(/\s+/g, '')

      console.log('Requesting JWT token with credentials:', {
        username,
        password: formattedPassword.substring(0, 3) + '...', // Log only first 3 chars for security
      })

      // Request a JWT token
      console.log('Making request to: /jwt-auth/v1/token')
      const response = await localApi.post('/jwt-auth/v1/token', {
        username,
        password: formattedPassword,
      })

      console.log('JWT Response:', response.status, response.statusText)

      // Store the token
      const token = response.data.token
      setJwtToken(token)
      localStorage.setItem('wp_jwt_token', token)

      console.log('Token received and stored. Token starts with:', token?.substring(0, 10) + '...')

      setJwtResult(JSON.stringify(response.data, null, 2))

      // Automatically test the token
      console.log('Validating JWT token')
      const validateResponse = await localApi.post('/jwt-auth/v1/token/validate', null, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log('Token validated successfully:', validateResponse.data)

      setJwtResult(
        (prev) =>
          (prev ? prev + '\n\n' : '') +
          'Token Validation:\n' +
          JSON.stringify(validateResponse.data, null, 2)
      )

      // Test accessing a protected endpoint using the token
      console.log('Testing protected endpoint access with token')
      const protectedResponse = await localApi.get('/wp/v2/users/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log('Protected endpoint accessed successfully')

      setJwtResult(
        (prev) =>
          (prev ? prev + '\n\n' : '') +
          'Protected Endpoint Test:\n' +
          JSON.stringify(protectedResponse.data, null, 2)
      )
    } catch (err: any) {
      console.error('JWT error:', err)
      if (err.response) {
        console.error('Response data:', err.response.data)
        console.error('Response headers:', err.response.headers)
        console.error('Response status:', err.response.status, err.response.statusText)
      }

      setError((prev) => ({
        ...prev,
        jwt:
          err.message +
          (err.response ? ` (${err.response.status}: ${err.response.statusText})` : ''),
      }))
    } finally {
      setLoading((prev) => ({ ...prev, jwt: false }))
    }
  }

  const testAllMethods = async () => {
    setLoading((prev) => ({ ...prev, allTests: true }))
    setAllTestsResult(null)
    setError((prev) => ({ ...prev, allTests: null }))

    try {
      // Save the entered password for the tests
      if (password) {
        if (authType === 'basic') {
          // Save as basic auth credentials
          const credentials = btoa(`${username}:${password}`)
          localStorage.setItem('wp_user_credentials', credentials)
        }
      }

      const results = await wpApi.testAuthMethods()
      setAllTestsResult(results)
    } catch (err: any) {
      setError((prev) => ({
        ...prev,
        allTests: err.message,
      }))
    } finally {
      setLoading((prev) => ({ ...prev, allTests: false }))
    }
  }

  const clearTokens = () => {
    localStorage.removeItem('wp_jwt_token')
    localStorage.removeItem('wp_user_credentials')
    setJwtToken('')
    setJwtResult(null)
    setAuthResult(null)
    setAuthEndpointResult(null)
    setAllTestsResult(null)
    alert('All authentication tokens cleared')
  }

  const login = async () => {
    setLoading((prev) => ({ ...prev, auth: true }))
    setAuthResult(null)
    setError((prev) => ({ ...prev, auth: null }))

    try {
      const result = await wpApi.login({ email: username, password })
      setAuthResult(JSON.stringify(result, null, 2))
    } catch (err: any) {
      setError((prev) => ({
        ...prev,
        auth:
          err.message +
          (err.response ? ` (${err.response.status}: ${err.response.statusText})` : ''),
      }))
    } finally {
      setLoading((prev) => ({ ...prev, auth: false }))
    }
  }

  // Helper to render results with status indicators
  const renderTestResults = (results: Record<string, any>) => {
    return (
      <div className="space-y-4">
        {Object.entries(results).map(([key, result]) => (
          <div
            key={key}
            className={`p-4 border rounded ${result.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}
          >
            <h4 className="font-bold text-lg capitalize">{key} Authentication</h4>
            <div className="flex items-center mt-1">
              <span
                className={`inline-block w-3 h-3 rounded-full mr-2 ${result.success ? 'bg-green-500' : 'bg-red-500'}`}
              ></span>
              <span className={result.success ? 'text-green-700' : 'text-red-700'}>
                {result.success ? 'Success' : 'Failed'}
              </span>
            </div>
            <p className="mt-2">{result.message}</p>
            {result.error && <p className="text-red-600 mt-1">{result.error}</p>}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">WordPress API Authentication Test</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Authentication Settings</h2>
        <div className="flex flex-col space-y-4 mb-4">
          <div>
            <label className="block mb-1">Username:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="border p-2 w-full rounded"
            />
          </div>
          <div>
            <label className="block mb-1">Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border p-2 w-full rounded"
              placeholder="Enter password or application password"
            />
            <p className="text-sm text-gray-600 mt-1">
              For local development, use an Application Password format: xxxx xxxx xxxx xxxx xxxx
              xxxx
            </p>
          </div>
          <div>
            <label className="block mb-1">Authentication Type:</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={authType === 'basic'}
                  onChange={() => setAuthType('basic')}
                  className="mr-2"
                />
                Basic Auth
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={authType === 'bearer'}
                  onChange={() => setAuthType('bearer')}
                  className="mr-2"
                />
                Bearer Token
              </label>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={login}
            disabled={loading.auth}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading.auth ? 'Logging in...' : 'Login with wpApi.login()'}
          </button>

          <button
            onClick={testConnection}
            disabled={loading.connection}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            {loading.connection ? 'Testing...' : 'Test Connection'}
          </button>

          <button
            onClick={authType === 'basic' ? testBasicAuth : testBearerAuth}
            disabled={loading.auth}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400"
          >
            {loading.auth ? 'Testing...' : `Test ${authType === 'basic' ? 'Basic' : 'Bearer'} Auth`}
          </button>

          <button
            onClick={testJwtAuth}
            disabled={loading.jwt}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:bg-gray-400"
          >
            {loading.jwt ? 'Testing...' : 'Get JWT Token'}
          </button>

          <button
            onClick={testAuthEndpoint}
            disabled={loading.authEndpoint}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {loading.authEndpoint ? 'Testing...' : 'Test Custom Endpoint'}
          </button>

          <button
            onClick={testAllMethods}
            disabled={loading.allTests}
            className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 disabled:bg-gray-400"
          >
            {loading.allTests ? 'Testing All Methods...' : 'Test All Auth Methods'}
          </button>

          <button
            onClick={clearTokens}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Clear Stored Tokens
          </button>
        </div>
      </div>

      {/* New comprehensive test results section */}
      {allTestsResult && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">All Authentication Tests</h3>
          {renderTestResults(allTestsResult)}
        </div>
      )}

      {connectionResult && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Connection Test Result</h3>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto">{connectionResult}</pre>
          {error.connection && <p className="text-red-600 mt-2">{error.connection}</p>}
        </div>
      )}

      {authResult && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Authentication Test Result</h3>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto">{authResult}</pre>
          {error.auth && <p className="text-red-600 mt-2">{error.auth}</p>}
        </div>
      )}

      {jwtResult && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">JWT Authentication Result</h3>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto whitespace-pre-wrap">
            {jwtResult}
          </pre>
          {error.jwt && <p className="text-red-600 mt-2">{error.jwt}</p>}
        </div>
      )}

      {authEndpointResult && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Custom Endpoint Result</h3>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto">{authEndpointResult}</pre>
          {error.authEndpoint && <p className="text-red-600 mt-2">{error.authEndpoint}</p>}
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="text-lg font-semibold mb-2">Environment & Authentication Info</h3>
        <div className="space-y-2">
          <p>
            <strong>JWT Mode:</strong>{' '}
            {import.meta.env.VITE_USE_JWT === 'true' ? 'Enabled' : 'Disabled'}
          </p>
          <p>
            <strong>Local API URL:</strong>{' '}
            {import.meta.env.VITE_WP_API_URL || 'http://localhost:8888/wp-json'}
          </p>
          <p>
            <strong>Live API URL:</strong>{' '}
            {import.meta.env.VITE_WP_LIVE_API_URL || 'https://yachtstory.com/wp-json'}
          </p>
          <p>
            <strong>Application Password:</strong>{' '}
            {import.meta.env.VITE_WORDPRESS_APPLICATION_PASSWORD ? 'Configured' : 'Not configured'}
          </p>
          <p>
            <strong>JWT Token:</strong>{' '}
            {localStorage.getItem('wp_jwt_token') ? 'Stored in localStorage' : 'None'}
          </p>
          <p>
            <strong>Basic Auth Credentials:</strong>{' '}
            {localStorage.getItem('wp_user_credentials') ? 'Stored in localStorage' : 'None'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default AuthTest
