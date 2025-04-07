import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useJWTAuth } from '@/contexts/auth/JWTAuthContext'
import jwtApi from '@/services/jwtApi'
import { Button, Input } from '@/components/shared'
import { User } from '@/contexts/types'

// Asset imports
const backgroundImageUrl = '/images/adminbackground.jpg'
const logoImageUrl = '/images/Logo-Yachtstory-WHITE.png'

const adminLoginSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email address').required('Email is required'),
  password: Yup.string().required('Password is required'),
  rememberMe: Yup.boolean(),
})

export function AdminLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated, user, loading, errors, logout } = useJWTAuth()
  const [loginAttempt, setLoginAttempt] = useState(0)
  const [isNavigating, setIsNavigating] = useState(false)
  const navigationAttempted = useRef(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  // Get the redirect path from location state or default to /admin/dashboard
  const from = location.state?.from?.pathname || '/admin/dashboard'

  // Log authentication state changes for debugging
  useEffect(() => {
    console.log(
      `[Admin Login] Authentication state changed: isAuthenticated=${isAuthenticated}, user=${user ? 'present' : 'null'}, isNavigating=${isNavigating}`
    )

    if (user) {
      console.log(
        `[Admin Login] User details: id=${user.id}, role=${user.role}, name=${user.firstName} ${user.lastName}`
      )
    }
  }, [isAuthenticated, user, isNavigating])

  // Direct navigation function that uses window.location for reliable navigation
  const forceNavigate = useCallback((path: string) => {
    console.log(`[Admin Login] FORCE NAVIGATING to ${path}`)
    // Use direct location change for the most reliable navigation
    window.location.href = path
  }, [])

  // Simplified navigation approach to avoid race conditions
  const handleSuccessfulLogin = useCallback(
    (user: User) => {
      console.log('[Admin Login] Login successful, handling navigation for user role:', user.role)

      if (user.role !== 'admin' && user.role !== 'administrator') {
        console.log('[Admin Login] User is not an admin, showing error')
        setLoginError('You do not have admin privileges.')
        logout()
        return
      }

      // We have a verified admin user, navigate to admin dashboard
      console.log('[Admin Login] Admin user verified, navigating to dashboard')
      // Small delay to ensure all state is updated
      setTimeout(() => {
        forceNavigate(from)
      }, 50)
    },
    [from, forceNavigate, logout]
  )

  // Add a dedicated effect to watch for authentication state changes
  useEffect(() => {
    console.log(
      '[Admin Login] Auth state detector effect triggered, isAuthenticated:',
      isAuthenticated,
      'user:',
      user ? 'present' : 'null'
    )

    // If authenticated and we have user data, but navigation hasn't started yet, trigger it
    if (isAuthenticated && user && !isNavigating && !navigationAttempted.current) {
      console.log('[Admin Login] Authentication confirmed, handling navigation')
      navigationAttempted.current = true
      setIsNavigating(true)
      handleSuccessfulLogin(user)
    }
  }, [isAuthenticated, user, isNavigating, handleSuccessfulLogin])

  // Reset navigation state if the component remains mounted
  useEffect(() => {
    return () => {
      navigationAttempted.current = false
    }
  }, [])

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
    validationSchema: adminLoginSchema,
    onSubmit: async (values, { setSubmitting }) => {
      // Reset navigation flags at the start of a login attempt
      navigationAttempted.current = false

      // Increment attempt counter
      const attemptNumber = loginAttempt + 1
      setLoginAttempt(attemptNumber)
      setLoginError(null)
      setIsLoggingIn(true)

      try {
        console.log(`[Admin Login] Attempt #${attemptNumber} started for ${values.email}`)

        // Add a small delay to ensure state is updated
        await new Promise((resolve) => setTimeout(resolve, 100))

        // Use jwtApi directly with targetRole parameter to specify admin login
        // This bypasses the limitation of the context login function not accepting targetRole
        const user = await jwtApi.login(
          values.email,
          values.password,
          values.rememberMe,
          'admin' // Specify admin role
        )

        console.log('[Admin Login] Login successful with jwtApi, user:', user)

        // Now update the context state with the user data from jwtApi
        // This ensures the context state is properly updated to trigger the authentication effect
        await login(values.email, values.password, values.rememberMe)

        // Directly handle navigation after successful login
        handleSuccessfulLogin(user)

        console.log('[Admin Login] Login API call completed, navigation initiated')
      } catch (error: any) {
        console.log('[Admin Login] Error during login attempt:', error)

        // Extract and format the error message for display
        let errorMessage = 'Invalid email or password.'

        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          if (error.response.status === 401) {
            if (error.response.data?.code === 'account_not_verified') {
              errorMessage =
                'This admin account has not been verified. Please contact an existing administrator.'
            } else {
              errorMessage = 'Invalid email or password.'
            }
          } else if (error.response.status === 403) {
            errorMessage = 'You do not have admin privileges.'
          } else if (error.response.data?.message) {
            errorMessage = error.response.data.message
          }
        } else if (error.message) {
          // Something happened in setting up the request that triggered an Error
          if (error.message.includes('Network Error')) {
            errorMessage = 'Unable to connect to the server. Please check your internet connection.'
          } else if (error.message.includes('timeout')) {
            errorMessage = 'The request timed out. Please try again.'
          } else if (error.message.includes('verification') || error.message.includes('verified')) {
            errorMessage = error.message
          } else {
            errorMessage = error.message
          }
        }

        setLoginError(errorMessage)
      } finally {
        setSubmitting(false)
        setIsLoggingIn(false)
      }
    },
  })

  // Show a loading indicator if we're in a general loading state or explicitly submitting
  if (loading.login || isNavigating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-secondary">
            {isNavigating ? 'Redirecting to dashboard...' : 'Signing in...'}
          </p>
          {loginAttempt > 1 && !isNavigating && (
            <p className="mt-2 text-sm text-gray-500">
              This is taking longer than expected. Please wait...
            </p>
          )}
        </div>
      </div>
    )
  }

  // If already authenticated, show loading and redirect
  if (isAuthenticated) {
    // Trigger navigation again just to be safe
    if (user) {
      setTimeout(() => handleSuccessfulLogin(user), 0)
    }

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-secondary">Already signed in. Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Login form */}
      <div className="w-full md:w-1/2 px-4 py-8 md:px-8 flex flex-col justify-center bg-white">
        <div className="w-full max-w-md mx-auto space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold" style={{ color: '#000029' }}>
              CharterHub Admin
            </h2>
            <p className="mt-2" style={{ color: '#000029' }}>
              Manage your bookings, clients and documents
            </p>
          </div>

          <form onSubmit={formik.handleSubmit} className="space-y-6">
            <Input
              label="Email Address"
              type="email"
              id="email"
              placeholder="Enter your email address"
              {...formik.getFieldProps('email')}
              error={formik.touched.email ? formik.errors.email : undefined}
              disabled={formik.isSubmitting}
            />

            <Input
              label="Password"
              type="password"
              id="password"
              placeholder="Enter your password"
              {...formik.getFieldProps('password')}
              error={formik.touched.password ? formik.errors.password : undefined}
              disabled={formik.isSubmitting}
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  id="rememberMe"
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  {...formik.getFieldProps('rememberMe')}
                  disabled={formik.isSubmitting}
                />
                <span className="text-sm text-text-secondary">Keep me logged in for 30 days</span>
              </label>
            </div>

            {loginError && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded">
                <p className="font-medium">Login failed</p>
                <p>{loginError}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              isLoading={formik.isSubmitting || loading.login}
              disabled={formik.isSubmitting || loading.login}
            >
              {loading.login ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="text-center mt-4">
              <p className="text-xs" style={{ color: '#000029' }}>
                Use your admin credentials
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Right side - Background image */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0">
          <img
            className="h-full w-full object-cover"
            src={backgroundImageUrl}
            alt="Yacht background"
          />
          <div className="absolute inset-0 bg-black opacity-30"></div>
          <img
            src={logoImageUrl}
            alt="Charter Hub Logo"
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-[288px] w-auto"
          />
        </div>
      </div>
    </div>
  )
}
