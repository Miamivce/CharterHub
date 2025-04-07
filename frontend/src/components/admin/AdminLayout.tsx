import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useJWTAuth } from '@/contexts/auth/JWTAuthContext'
import { useMemo, useCallback } from 'react'
import {
  HomeIcon,
  DocumentTextIcon,
  BookmarkIcon,
  UsersIcon,
  MapIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline'

interface AdminLayoutProps {
  children: React.ReactNode
}

// Memoize navigation items to prevent recreation on each render
const navigationItems = [
  { name: 'Dashboard', path: '/admin', icon: HomeIcon },
  { name: 'Bookings', path: '/admin/bookings', icon: BookmarkIcon },
  { name: 'Customers', path: '/admin/customers', icon: UsersIcon },
  { name: 'Yachts', path: '/admin/yachts', icon: HomeIcon },
  { name: 'Destinations', path: '/admin/destinations', icon: MapIcon },
  { name: 'Documents', path: '/admin/documents', icon: DocumentTextIcon },
  { name: 'Settings', path: '/admin/settings', icon: Cog6ToothIcon },
] as const

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, loading } = useJWTAuth()

  // Memoize the current page title
  const currentPageTitle = useMemo(() => {
    return navigationItems.find((item) => item.path === location.pathname)?.name || 'Dashboard'
  }, [location.pathname])

  // Memoize logout handler
  const handleLogout = useCallback(async () => {
    try {
      await logout()
      // Use window.location.href instead of navigate for more reliable redirection
      window.location.href = '/admin/login'
    } catch (error) {
      console.error('Logout failed:', error)
      // Add fallback redirect even on error
      window.location.href = '/admin/login'
    }
  }, [logout])

  // Memoize navigation items with their active states
  const navigationWithState = useMemo(() => {
    return navigationItems.map((item) => ({
      ...item,
      isActive: location.pathname === item.path,
    }))
  }, [location.pathname])

  // Memoize admin display info
  const adminInfo = useMemo(
    () => ({
      fullName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
      email: user?.email || '',
      // The lastLogin property is not available in the User type from JWT auth context
      // Show a default value since we don't have this information
      lastLoginDisplay: 'Not available',
    }),
    [user?.firstName, user?.lastName, user?.email]
  )

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col min-h-screen z-10">
        {/* Logo */}
        <div className="h-16 border-b border-gray-200 flex items-center px-6">
          <h1 className="text-xl font-bold">Admin Portal</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigationWithState.map(({ name, path, icon: Icon, isActive }) => {
            // Debug log for the current navigation item
            if (name === 'Settings') {
              console.log(
                `[AdminLayout] Settings nav item - path: ${path}, isActive: ${isActive}, current location: ${location.pathname}`
              )
            }

            return (
              <Link
                key={path}
                to={path}
                onClick={(e) => {
                  // Only log for the Settings link
                  if (name === 'Settings') {
                    console.log(
                      `[AdminLayout] Settings link clicked - navigating to ${path}, time: ${new Date().toISOString()}`
                    )
                    // Add href attribute check
                    const href = (e.currentTarget as HTMLAnchorElement).href
                    console.log(`[AdminLayout] Link href attribute:`, href)

                    // Manually log navigation attempt for Settings
                    console.log(`[AdminLayout] Will navigate from ${location.pathname} to ${path}`)
                  }
                }}
                className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {name}
              </Link>
            )
          })}
        </nav>

        {/* Admin section - Always visible */}
        <div className="p-4 border-t border-gray-200 sticky bottom-0 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{adminInfo.fullName}</p>
              <p className="text-xs text-gray-500">{adminInfo.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-primary rounded-lg hover:bg-gray-50 transition-colors"
              title="Logout"
              disabled={loading.logout}
            >
              <ArrowLeftOnRectangleIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
        {/* Page header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <h1 className="text-xl font-semibold">{currentPageTitle}</h1>
          <div className="flex items-center space-x-4">
            {/* Remove the last login display since we don't have that information */}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
