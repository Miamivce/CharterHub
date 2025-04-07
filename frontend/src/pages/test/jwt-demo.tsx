import React from 'react'
import { Routes, Route, Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useJWTAuth } from '@/contexts/auth/JWTAuthContext'
import { JWTLogin } from '@/pages/shared/JWTLogin'
import { JWTProfile } from '@/pages/shared/JWTProfile'

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isInitialized } = useJWTAuth()
  const location = useLocation()

  // If auth is not initialized yet, show loading
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/jwt-demo/login" state={{ from: location }} replace />
  }

  // If authenticated, render the children
  return <>{children}</>
}

// Navigation
const Navigation: React.FC = () => {
  const { isAuthenticated, logout, user } = useJWTAuth()

  return (
    <nav className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-xl font-bold">JWT Auth Demo</div>

        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <span>Welcome, {user?.firstName || 'User'}</span>
              <Link to="/jwt-demo/profile" className="hover:underline">
                Profile
              </Link>
              <button
                onClick={() => logout()}
                className="bg-white text-blue-600 px-3 py-1 rounded hover:bg-blue-100"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/jwt-demo/login" className="hover:underline">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

// Home page
const Home: React.FC = () => {
  const { user } = useJWTAuth()

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4">JWT Authentication Demo</h1>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">User Information</h2>
          {user ? (
            <div className="bg-gray-50 p-4 rounded">
              <p>
                <strong>ID:</strong> {user.id}
              </p>
              <p>
                <strong>Email:</strong> {user.email}
              </p>
              <p>
                <strong>Name:</strong> {user.firstName} {user.lastName}
              </p>
              <p>
                <strong>Role:</strong> {user.role}
              </p>
            </div>
          ) : (
            <p className="text-gray-500">Not logged in</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded">
            <h3 className="font-medium mb-2">Features Implemented</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>JWT Authentication with HTTP-only refresh token</li>
              <li>Role-based authorization</li>
              <li>Automatic token refresh</li>
              <li>Token storage based on "Remember Me" preference</li>
              <li>User profile management</li>
            </ul>
          </div>

          <div className="bg-green-50 p-4 rounded">
            <h3 className="font-medium mb-2">API Endpoints Used</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>/auth/login.php</li>
              <li>/auth/logout.php</li>
              <li>/auth/refresh-token.php</li>
              <li>/auth/me.php</li>
              <li>/auth/update-profile.php</li>
              <li>/auth/change-password.php</li>
              <li>/auth/is-authenticated.php</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

// Demo App - export as named export for clarity
export const JWTDemoApp: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />

      <Routes>
        <Route path="/login" element={<JWTLogin />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <JWTProfile />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/jwt-demo" replace />} />
      </Routes>
    </div>
  )
}

export default JWTDemoApp
