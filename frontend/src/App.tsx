import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/react-query'
import { RootProvider } from './contexts'
import { NotificationProvider } from './contexts/notification/NotificationContext'
import { BookingProvider } from './contexts/booking/BookingContext'
import { AdminBookingProvider } from './contexts/booking/AdminBookingContext'
import { DocumentProvider } from './contexts/document/DocumentContext'
import { ComponentsShowcase } from './pages/shared/ComponentsShowcase'
import { Login } from './pages/shared/Login'
import { Register } from './pages/shared/Register'
import { ForgotPassword } from './pages/shared/ForgotPassword'
import { ResetPassword } from './pages/shared/ResetPassword'
import { EmailVerification } from './pages/shared/EmailVerification'
import { JWTLogin } from './pages/shared/JWTLogin'
import { ProtectedRoute } from './components/shared/ProtectedRoute'
import { AdminLayout } from './components/admin/AdminLayout'
import { AdminDashboard } from './pages/admin/Dashboard'
import { AdminLogin } from './pages/admin/Login'
import { AdminDocuments } from './pages/admin/Documents'
import { AdminBookings } from './pages/admin/Bookings'
import { BookingDetails } from './pages/admin/BookingDetails'
import { Customers } from './pages/admin/Customers'
import { CustomerDetails } from './pages/admin/CustomerDetails'
import { ClientLayout } from '@/components/client/ClientLayout'
import { ClientDashboard } from '@/pages/client/Dashboard'
import { ClientBookings } from '@/pages/client/Bookings'
import { BookingDetail } from '@/pages/client/BookingDetail'
import { Documents } from '@/pages/client/Documents'
import { Profile } from '@/pages/client/Profile'
import { Destinations } from '@/pages/client/Destinations'
import { DestinationDetail as ClientDestinationDetail } from '@/pages/client/DestinationDetail'
import { Yachts } from './pages/admin/Yachts'
import { YachtDetail } from './pages/admin/YachtDetail'
import { ErrorBoundary } from './components/shared/ErrorBoundary'
import WordPressTestPage from './pages/test/wordpress'
import { AdminDestinations } from './pages/admin/Destinations'
import { DestinationDetail as AdminDestinationDetail } from './pages/admin/DestinationDetail'
import { JWTDemoApp as NamedJWTDemoApp } from './pages/test/jwt-demo'
import MigrationTest from './pages/test/migration-test'
import AuthDebugPage from './pages/test/auth-debug'
import { ClientTokenRedirect } from './components/shared/ClientTokenRedirect'
import Settings from './pages/admin/Settings'
// Import domain utilities
import { isAdminDomain, isClientDomain, ADMIN_DOMAIN, CLIENT_DOMAIN } from '@/utils/domainUtils'

// Early domain detection component
const DomainRouter = () => {
  const [domainChecked, setDomainChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [currentDomain, setCurrentDomain] = useState('');
  
  // Run domain detection on mount
  useEffect(() => {
    // Log current hostname for debugging
    const hostname = window.location.hostname;
    console.log('[DomainRouter] Current hostname:', hostname);
    setCurrentDomain(hostname);
    
    // Check domain
    const adminDomain = isAdminDomain();
    const clientDomain = isClientDomain();
    
    console.log('[DomainRouter] Domain detection results:', {
      adminDomain,
      clientDomain,
      isProduction: process.env.NODE_ENV === 'production',
      hostname
    });
    
    setIsAdmin(adminDomain);
    setIsClient(clientDomain);
    setDomainChecked(true);
    
    // Force redirect to correct domain in production if on wrong domain
    if (process.env.NODE_ENV === 'production') {
      if (hostname !== ADMIN_DOMAIN && hostname !== CLIENT_DOMAIN) {
        // Default to client domain if hostname doesn't match either domain
        console.log('[DomainRouter] Unknown domain, redirecting to client domain');
        window.location.href = `https://${CLIENT_DOMAIN}`;
        return;
      }
    }
  }, []);
  
  if (!domainChecked) {
    // Show loading while checking domain
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <div className="ml-4">Loading application...</div>
      </div>
    );
  }
  
  // For development, allow multiple domains by path prefix routing
  if (process.env.NODE_ENV === 'development') {
    return <AppRoutes />;
  }
  
  // In production, route based on the detected domain
  if (isAdmin) {
    console.log('[DomainRouter] Rendering admin interface');
    return <AdminRoutes />;
  }
  
  if (isClient) {
    console.log('[DomainRouter] Rendering client interface');
    return <ClientRoutes />;
  }
  
  // Fallback - redirect to login page on appropriate domain
  console.log('[DomainRouter] No specific domain detected, using default client interface');
  return <ClientRoutes />;
};

// Admin-specific routes
const AdminRoutes = () => (
  <Routes>
    {/* Admin routes */}
    <Route path="/" element={<Navigate to="/admin/login" replace />} />
    <Route path="/login" element={<AdminLogin />} />
    <Route path="/admin/login" element={<AdminLogin />} />
    <Route
      element={
        <ProtectedRoute allowedRoles={['admin']} section="admin">
          <Outlet />
        </ProtectedRoute>
      }
    >
      <Route
        element={
          <NotificationProvider>
            <DocumentProvider>
              <AdminBookingProvider>
                <BookingProvider>
                  <AdminLayout>
                    <Outlet />
                  </AdminLayout>
                </BookingProvider>
              </AdminBookingProvider>
            </DocumentProvider>
          </NotificationProvider>
        }
      >
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/bookings" element={<AdminBookings />} />
        <Route path="/admin/bookings/:id" element={<BookingDetails />} />
        <Route path="/admin/customers" element={<Customers />} />
        <Route path="/admin/customers/:id" element={<CustomerDetails />} />
        <Route path="/admin/yachts" element={<Yachts />} />
        <Route path="/admin/yachts/:id" element={<YachtDetail />} />
        <Route path="/admin/destinations" element={<AdminDestinations />} />
        <Route path="/admin/destinations/:id" element={<AdminDestinationDetail />} />
        <Route path="/admin/documents" element={<AdminDocuments />} />
        <Route path="/admin/settings" element={<Settings />} />
      </Route>
    </Route>
    
    {/* Catch all - redirect to admin login */}
    <Route path="*" element={<Navigate to="/admin/login" replace />} />
  </Routes>
);

// Client-specific routes
const ClientRoutes = () => (
  <Routes>
    {/* Public routes */}
    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route path="login" element={<Login />} />
    <Route path="jwt-login" element={<JWTLogin />} />
    <Route path="register" element={<Register />} />
    <Route path="forgot-password" element={<ForgotPassword />} />
    <Route path="reset-password" element={<ResetPassword />} />
    <Route path="verify-email" element={<EmailVerification />} />
    
    {/* Dashboard redirect */}
    <Route path="/dashboard" element={<Navigate to="/client/dashboard" replace />} />
    
    {/* Client routes */}
    <Route
      path="/client"
      element={
        <ProtectedRoute allowedRoles={['client']} section="client">
          <ClientLayout>
            <Outlet />
          </ClientLayout>
        </ProtectedRoute>
      }
    >
      <Route path="" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<ClientDashboard />} />
      <Route path="bookings" element={<ClientBookings />} />
      <Route path="bookings/:id" element={<BookingDetail />} />
      <Route path="documents" element={<Documents />} />
      <Route path="profile" element={<Profile />} />
      <Route path="yachts" element={<Yachts />} />
      <Route path="yachts/:id" element={<YachtDetail />} />
      <Route path="destinations" element={<Destinations />} />
      <Route path="destinations/:id" element={<ClientDestinationDetail />} />
    </Route>
    
    {/* Catch all - redirect to login */}
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
);

// Full app routes for development mode
const AppRoutes = () => (
  <Routes>
    {/* JWT Demo Route */}
    <Route path="/jwt-demo/*" element={<NamedJWTDemoApp />} />

    {/* Migration Test Route */}
    <Route path="/migration-test" element={<MigrationTest />} />

    {/* Auth Debug Route */}
    <Route path="/auth-debug" element={<AuthDebugPage />} />

    {/* Direct dashboard access with client token check (keep for backward compatibility) */}
    <Route path="/direct-dashboard" element={<Navigate to="/dashboard" replace />} />

    {/* Admin routes - Updated to use JWT authentication */}
    <Route path="/admin/login" element={<AdminLogin />} />
    <Route
      element={
        <ProtectedRoute allowedRoles={['admin']} section="admin">
          <Outlet />
        </ProtectedRoute>
      }
    >
      <Route
        element={
          <NotificationProvider>
            <DocumentProvider>
              <AdminBookingProvider>
                <BookingProvider>
                  <AdminLayout>
                    <Outlet />
                  </AdminLayout>
                </BookingProvider>
              </AdminBookingProvider>
            </DocumentProvider>
          </NotificationProvider>
        }
      >
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/bookings" element={<AdminBookings />} />
        <Route path="/admin/bookings/:id" element={<BookingDetails />} />
        <Route path="/admin/customers" element={<Customers />} />
        <Route path="/admin/customers/:id" element={<CustomerDetails />} />
        <Route path="/admin/yachts" element={<Yachts />} />
        <Route path="/admin/yachts/:id" element={<YachtDetail />} />
        <Route path="/admin/destinations" element={<AdminDestinations />} />
        <Route path="/admin/destinations/:id" element={<AdminDestinationDetail />} />
        <Route path="/admin/documents" element={<AdminDocuments />} />
        <Route path="/admin/settings" element={<Settings />} />
      </Route>
    </Route>

    {/* Public routes */}
    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route path="login" element={<Login />} />
    <Route path="jwt-login" element={<JWTLogin />} />
    <Route path="register" element={<Register />} />
    <Route path="forgot-password" element={<ForgotPassword />} />
    <Route path="reset-password" element={<ResetPassword />} />
    <Route path="verify-email" element={<EmailVerification />} />

    {/* Development routes */}
    <Route path="components" element={<ComponentsShowcase />} />
    <Route path="test/wordpress" element={<WordPressTestPage />} />

    {/* Main dashboard redirect */}
    <Route path="/dashboard" element={<Navigate to="/client/dashboard" replace />} />

    {/* FIX: Client routes using proper nested structure with Outlet */}
    <Route
      path="/client"
      element={
        <ProtectedRoute allowedRoles={['client']} section="client">
          <ClientLayout>
            <Outlet />
          </ClientLayout>
        </ProtectedRoute>
      }
    >
      <Route path="" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<ClientDashboard />} />
      <Route path="bookings" element={<ClientBookings />} />
      <Route path="bookings/:id" element={<BookingDetail />} />
      <Route path="documents" element={<Documents />} />
      <Route path="profile" element={<Profile />} />
      <Route path="yachts" element={<Yachts />} />
      <Route path="yachts/:id" element={<YachtDetail />} />
      <Route path="destinations" element={<Destinations />} />
      <Route path="destinations/:id" element={<ClientDestinationDetail />} />
    </Route>

    {/* Catch all */}
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
);

function App() {
  return (
    <ErrorBoundary>
      <RootProvider>
        <DomainRouter />
      </RootProvider>
    </ErrorBoundary>
  )
}

export default App
