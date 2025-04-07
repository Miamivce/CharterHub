import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useJWTAuth } from '@/contexts/auth/JWTAuthContext'
import { useDocument } from '@/contexts/document/DocumentContext'
import React, { useState, useEffect, useRef } from 'react'
import {
  HomeIcon,
  BookmarkIcon,
  DocumentTextIcon,
  UserIcon,
  GlobeAltIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

// Custom sailing boat icon component
function SailingBoatIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Hull */}
      <path d="M3 18h18" />
      <path d="M4 18c0-1 2-3 8-3s8 2 8 3" />
      {/* Mast */}
      <line x1="12" y1="18" x2="12" y2="6" />
      {/* Triangular Sail */}
      <path d="M12 6L20 15H12V6Z" />
    </svg>
  )
}

const navigationItems = [
  { name: 'Dashboard', path: '/client/dashboard', icon: HomeIcon },
  { name: 'My Bookings', path: '/client/bookings', icon: BookmarkIcon },
  { name: 'Documents', path: '/client/documents', icon: DocumentTextIcon },
  { name: 'Yachts', path: '/client/yachts', icon: SailingBoatIcon },
  { name: 'Destinations', path: '/client/destinations', icon: GlobeAltIcon },
  { name: 'Profile', path: '/client/profile', icon: UserIcon },
]

interface ClientLayoutProps {
  children: React.ReactNode
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, refreshUserData, logout } = useJWTAuth()
  const { documents } = useDocument()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [userName, setUserName] = useState(user ? `${user.firstName} ${user.lastName}` : 'User')

  // Add a ref to track initial mount
  const initialMountRef = useRef(true)
  // Add a ref to prevent unnecessary refreshes
  const isRefreshingRef = useRef(false)
  // Add a ref to track the last seen user timestamp
  const lastUserTimestampRef = useRef<number | undefined>(user?._timestamp)

  // Refresh user data only on initial mount, not on every auth change
  useEffect(() => {
    // Only run on first mount, not on every re-render or auth change
    if (initialMountRef.current && !isRefreshingRef.current) {
      initialMountRef.current = false

      async function refreshUserDataOnMount() {
        console.log('ClientLayout: Initial user data refresh on mount')
        try {
          isRefreshingRef.current = true
          const refreshedUser = await refreshUserData()
          // Check user data after refresh
          if (refreshedUser) {
            console.log(
              'ClientLayout: Initial user data refresh successful with timestamp:',
              refreshedUser._timestamp
            )
            setUserName(`${refreshedUser.firstName} ${refreshedUser.lastName}`)
            lastUserTimestampRef.current = refreshedUser._timestamp
          }
        } catch (error) {
          console.error('ClientLayout: Error refreshing user data:', error)
        } finally {
          isRefreshingRef.current = false
        }
      }

      refreshUserDataOnMount()
    }
  }, [refreshUserData])

  // Update userName whenever user data changes
  useEffect(() => {
    if (user) {
      // Always check if the user data has changed by comparing the entire user object
      const hasChanged = user._timestamp !== lastUserTimestampRef.current

      console.log(
        'ClientLayout: User data check - firstName:',
        user.firstName,
        'lastName:',
        user.lastName,
        'timestamp:',
        user._timestamp,
        'lastTimestamp:',
        lastUserTimestampRef.current,
        'changed:',
        hasChanged ? 'YES' : 'NO'
      )

      // Always update the userName when user changes to ensure UI consistency
      console.log('ClientLayout: Updating userName with new user data, timestamp:', user._timestamp)
      setUserName(`${user.firstName} ${user.lastName}`)
      lastUserTimestampRef.current = user._timestamp
    }
  }, [user])

  // Check if user has passport documents
  const hasPassport = documents.some(
    (doc) => doc.category === 'passport_details' || doc.metadata?.tags?.includes('passport')
  )

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col min-h-screen z-10">
        {/* Logo */}
        <div className="h-16 border-b border-gray-200 flex items-center px-4">
          <Link to="/dashboard" className="flex items-center space-x-1">
            <div className="h-16 w-16 flex-shrink-0">
              <img
                src="/images/BLUE HQ.png"
                alt="Charter Hub Logo"
                className="h-full w-full object-contain"
              />
            </div>
            <span className="text-xl font-bold text-gray-900">CharterHub</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#fdba6b]/10 text-[#fdba6b]'
                    : 'text-gray-600 hover:bg-[#fdba6b]/10 hover:text-[#fdba6b]'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* User section - Always visible */}
        <div className="p-4 border-t border-gray-200 sticky bottom-0 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="ml-2 p-2 text-gray-500 hover:text-orange-600 rounded-lg hover:bg-gray-50 transition-colors"
              title="Logout"
            >
              <ArrowLeftOnRectangleIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
        {/* Page header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8">
          <h1 className="text-xl font-semibold text-gray-900">
            {navigationItems.find((item) => item.path === location.pathname)?.name ||
              (location.pathname === '/documents' ? 'Documents' : 'Dashboard')}
          </h1>
        </header>

        {/* Page content */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
