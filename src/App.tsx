import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { JWTAuthProvider, useJWTAuth } from '../frontend/src/contexts/auth/JWTAuthContext';
import { BookingProvider } from './contexts/BookingContext';
import { DocumentProvider } from './contexts/DocumentContext';
import { JWTLogin } from '../frontend/src/pages/shared/JWTLogin';
import { envConfig } from './services/envValidator';

// Lazy load components
const Dashboard = React.lazy(() => import('./components/dashboard/Dashboard'));
const BookingList = React.lazy(() => import('./components/bookings/BookingList'));
const BookingDetails = React.lazy(() => import('./components/bookings/BookingDetails'));
const DocumentList = React.lazy(() => import('./components/documents/DocumentList'));
const Profile = React.lazy(() => import('./components/profile/Profile'));
const AdminDashboard = React.lazy(() => import('./components/admin/AdminDashboard'));

/**
 * Custom protected route implementation for JWT authentication
 */
const ProtectedRoute = ({ 
  children, 
  allowedRoles = ['client', 'admin'] 
}: { 
  children: React.ReactNode, 
  allowedRoles?: string[] 
}) => {
  const { isAuthenticated, isInitialized, user } = useJWTAuth();
  
  // Show loading state while initializing auth
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role access if roles are specified and user exists
  if (allowedRoles.length > 0 && user) {
    const hasRequiredRole = allowedRoles.includes(user.role as string);
    
    if (!hasRequiredRole) {
      // Redirect to dashboard or access denied page based on user role
      const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
      return <Navigate to={redirectPath} replace />;
    }
  }

  // User is authenticated and has required role (if specified)
  return <>{children}</>;
};

function AppContent() {
  const { isInitialized } = useJWTAuth();

  useEffect(() => {
    // Log environment configuration for development debugging
    if (envConfig.ENV === 'development') {
      console.log('App initialized with API URL:', envConfig.AUTH_API_URL);
    }
  }, []);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<JWTLogin />} />
      
      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['client', 'admin']}>
            <React.Suspense fallback={<div>Loading...</div>}>
              <Dashboard />
            </React.Suspense>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/bookings"
        element={
          <ProtectedRoute allowedRoles={['client', 'admin']}>
            <React.Suspense fallback={<div>Loading...</div>}>
              <BookingList />
            </React.Suspense>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/bookings/:id"
        element={
          <ProtectedRoute allowedRoles={['client', 'admin']}>
            <React.Suspense fallback={<div>Loading...</div>}>
              <BookingDetails />
            </React.Suspense>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/documents"
        element={
          <ProtectedRoute allowedRoles={['client', 'admin']}>
            <React.Suspense fallback={<div>Loading...</div>}>
              <DocumentList />
            </React.Suspense>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={['client', 'admin']}>
            <React.Suspense fallback={<div>Loading...</div>}>
              <Profile />
            </React.Suspense>
          </ProtectedRoute>
        }
      />
      
      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <React.Suspense fallback={<div>Loading...</div>}>
              <AdminDashboard />
            </React.Suspense>
          </ProtectedRoute>
        }
      />
      
      {/* Redirect root to dashboard or login */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <JWTAuthProvider>
        <BookingProvider>
          <DocumentProvider>
            <AppContent />
          </DocumentProvider>
        </BookingProvider>
      </JWTAuthProvider>
    </Router>
  );
}

export default App; 