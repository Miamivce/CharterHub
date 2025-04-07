import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useJWTAuth } from '../../contexts/auth/JWTAuthContext'
// import { useAuth } from '@/auth'; // Import the optimized auth system
import wpApi from '../../services/wpApi'
import { CircleLoader } from 'react-spinners'
// import { LoadingScreen } from '@/components/shared/LoadingScreen';
import jwtApi, { TokenStorage, validateAuthState } from '../../services/jwtApi'
// import { toast } from '@/components/ui/use-toast';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Card } from '@/components/ui/Card';

// Browser support hook
const useBrowserSupport = () => {
  const [isSupported, setIsSupported] = useState(true)

  useEffect(() => {
    // Simple browser feature detection
    const checkBrowserSupport = () => {
      // Check for localStorage
      const hasLocalStorage = typeof localStorage !== 'undefined'
      // Check for fetch API
      const hasFetch = typeof fetch !== 'undefined'
      // Check for modern JS features
      const hasPromise = typeof Promise !== 'undefined'

      setIsSupported(hasLocalStorage && hasFetch && hasPromise)
    }

    checkBrowserSupport()
  }, [])

  return { isSupported }
}

// Debug logging
const debugLogin = false

// Register form interface
interface RegisterFormData {
  firstName: string
  lastName: string
  email: string
  password: string
  phone?: string
  companyName?: string
  rememberMe: boolean
}

interface RegisterResponse {
  success: boolean
  message: string
  verificationLink?: string
}

// Password strength calculation
const calculatePasswordStrength = (password: string): { score: number; feedback: string } => {
  // Default values
  let score = 0
  let feedback = 'Too weak'

  if (!password) {
    return { score, feedback }
  }

  // Length check
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1

  // Complexity checks
  if (/[A-Z]/.test(password)) score += 1 // Has uppercase
  if (/[a-z]/.test(password)) score += 1 // Has lowercase
  if (/[0-9]/.test(password)) score += 1 // Has number
  if (/[^A-Za-z0-9]/.test(password)) score += 1 // Has special char

  // Determine feedback based on score
  if (score <= 2) {
    feedback = 'Too weak'
  } else if (score <= 4) {
    feedback = 'Could be stronger'
  } else if (score <= 5) {
    feedback = 'Strong password'
  } else {
    feedback = 'Very strong password'
  }

  return { score: Math.min(score, 6), feedback }
}

const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  const { score, feedback } = calculatePasswordStrength(password)

  // Calculate percentage for the progress bar
  const percentage = (score / 6) * 100

  // Determine color based on score
  let color = 'bg-red-500'
  if (score > 4) color = 'bg-green-500'
  else if (score > 2) color = 'bg-yellow-500'

  return (
    <div className="mt-1">
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${percentage}%` }}></div>
      </div>
      <p className="text-xs mt-1 text-gray-600">{feedback}</p>
    </div>
  )
}

const VerificationLinkPopup = ({
  verificationLink,
  onClose,
  onVerificationSuccess,
}: {
  verificationLink: string
  onClose: () => void
  onVerificationSuccess?: () => void
}) => {
  const [copied, setCopied] = useState(false)
  const [autoVerifying, setAutoVerifying] = useState(false)
  const [verified, setVerified] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(verificationLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const autoVerify = async () => {
    setAutoVerifying(true)
    setVerificationError(null)

    try {
      console.log('Attempting to verify with link:', verificationLink)

      // Extract token and email from the verification link
      const url = new URL(verificationLink)
      const token = url.searchParams.get('token')
      const email = url.searchParams.get('email')

      if (!token) {
        throw new Error('Invalid verification link - no token found')
      }

      console.log('Verification parameters:', { token, email })

      // Call the API to verify the email
      await jwtApi.verifyEmail(token, email || undefined)

      // If we reach here, verification was successful
      setVerified(true)

      // Optionally call the success callback
      if (onVerificationSuccess) {
        // Delay the callback to show success message first
        setTimeout(() => {
          onVerificationSuccess()
        }, 2000)
      } else {
        // Auto-close after successful verification if no callback
        setTimeout(() => {
          onClose()
        }, 2000)
      }
    } catch (error: any) {
      console.error('Verification error:', error)
      setVerificationError(error?.message || 'Failed to verify email')
    } finally {
      setAutoVerifying(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Email Verification Required</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Important: Email Verification Required
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    You must verify your email before you can log in. In production, a verification
                    link would be sent to your email. For development, please use the link below.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {verified ? (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">Email verified successfully!</p>
                  <p className="mt-2 text-sm text-green-700">You can now log in to your account.</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-2">
                Please click on the link below to verify your email address:
              </p>

              <div className="relative mt-2 mb-4">
                <input
                  type="text"
                  readOnly
                  value={verificationLink}
                  className="block w-full border border-gray-300 rounded-md py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                />
                <button
                  onClick={copyToClipboard}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                >
                  {copied ? (
                    <svg
                      className="h-5 w-5 text-green-500"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                    </svg>
                  )}
                </button>
              </div>

              <div className="mt-4 space-y-2">
                <button
                  onClick={autoVerify}
                  disabled={autoVerifying}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {autoVerifying ? (
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : null}
                  {autoVerifying ? 'Verifying...' : 'Verify Email Now'}
                </button>

                <a
                  href={verificationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Open Verification Link in New Tab
                </a>
              </div>

              {verificationError && (
                <div className="mt-3 text-sm text-red-600">{verificationError}</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const SuccessPopup = ({ onClose, onLogin }: { onClose: () => void; onLogin: () => void }) => {
  const registeredEmail = localStorage.getItem('registeredEmail') || ''

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
        <div className="flex items-center justify-center mb-4 text-green-500">
          <svg
            className="w-10 h-10"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            ></path>
          </svg>
        </div>

        <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">
          Registration Successful!
        </h3>

        <div className="mb-4">
          <div className="p-4 bg-blue-50 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Important:</strong> We've sent a verification email to{' '}
                  <span className="font-medium">{registeredEmail}</span>
                </p>
                <p className="mt-2 text-sm text-blue-700">
                  Please check your inbox (and spam folder) and click the verification link to
                  activate your account.
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          You need to verify your email address before logging in. After verification, you can use
          your credentials to access your account.
        </p>

        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
          >
            Close
          </button>
          <button
            onClick={onLogin}
            className="bg-[#fdba6b] text-white px-4 py-2 rounded-md hover:bg-[#fdba6b]/90"
          >
            Go to Login
          </button>
        </div>
      </div>
    </div>
  )
}

// Updated at the beginning of file after imports
const cleanupDevVerificationData = (preserveCurrent = false) => {
  try {
    if (preserveCurrent) {
      // If we should preserve current data, check if there's an active token
      const currentToken = sessionStorage.getItem('dev_verification_token')
      if (currentToken) {
        console.log('[Login] Preserving current development verification data for active process')
        return
      }
    }

    console.log('[Login] Cleaning up development verification data')
    // Clean up development verification data from session storage
    sessionStorage.removeItem('dev_verification_token')
    sessionStorage.removeItem('dev_verification_email')

    // Clean up any other verification-related data
    localStorage.removeItem('verification_email')
    sessionStorage.removeItem('registeredEmail')
  } catch (error) {
    console.error('[Login] Error cleaning up development verification data:', error)
  }
}

// Helper to create a development verification token
const createDevVerificationToken = (email: string): string => {
  const timestamp = Date.now().toString()
  const emailHash = btoa(email).replace(/=/g, '')
  return `dev-${emailHash}-${timestamp}-${Math.random().toString(36).substring(2, 10)}`
}

// Helper function to build a verification URL for development
const buildVerificationUrl = (email: string): string => {
  // In development, create a token that will work with the verify-email endpoint
  const token = createDevVerificationToken(email)

  // Store this token in sessionStorage so the backend can validate it in development
  sessionStorage.setItem('dev_verification_email', email)
  sessionStorage.setItem('dev_verification_timestamp', Date.now().toString())
  sessionStorage.setItem('dev_verification_token', token)

  // Build the URL that points to our verification endpoint
  const baseUrl = window.location.origin
  const verificationUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`

  console.log('[Login] Created development verification URL:', verificationUrl)
  return verificationUrl
}

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [registerData, setRegisterData] = useState<RegisterFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    rememberMe: false,
  })
  const [showVerificationPopup, setShowVerificationPopup] = useState(false)
  const [verificationLink, setVerificationLink] = useState<string | null>(null)
  const [registrationComplete, setRegistrationComplete] = useState(false)
  const [devMode] = useState(process.env.NODE_ENV === 'development')
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [csrfToken, setCsrfToken] = useState<string | null>(null)
  const [isVerificationError, setIsVerificationError] = useState(false)

  const auth = useJWTAuth()
  const { isAuthenticated, user } = auth
  // const optimizedAuth = useAuth(); // Add the optimized auth system
  const navigate = useNavigate()
  const location = useLocation()
  const { isSupported } = useBrowserSupport()

  // Error state for handling API errors
  const [authErrors, setAuthErrors] = useState<{
    login: { message: string } | null
    register: { message: string } | null
  }>({
    login: null,
    register: null,
  })

  // Check if we're in the middle of a login process to show loading state on refresh
  const [isInLoginProcess, setIsInLoginProcess] = useState<boolean>(() => {
    return sessionStorage.getItem('loginInProgress') === 'true'
  })

  // Tracking login/loading states
  const [isInitializing, setIsInitializing] = useState(true)
  const [isTokenRefreshing, setIsTokenRefreshing] = useState(false)
  const [isResendingVerification, setIsResendingVerification] = useState(false)
  const tokenIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [rateLimitState, setRateLimitState] = useState({
    isLimited: false,
    remainingAttempts: 5,
    attemptCount: 0,
    limitExpiry: 0,
  })
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')

  // Register form state
  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    companyName: '',
    rememberMe: false,
  })
  const [registerError, setRegisterError] = useState<string | null>(null)
  const [registrationStatus, setRegistrationStatus] = useState<
    'idle' | 'submitting' | 'success' | 'error'
  >('idle')
  const [isRegisterLoading, setIsRegisterLoading] = useState(false)

  // Add timeout reference for login process
  const loginTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Add a function to clear login state
  const clearLoginState = useCallback(() => {
    setIsInLoginProcess(false)
    setIsLoading(false) // Also reset the loading state
    sessionStorage.removeItem('loginInProgress')

    // Clear any existing timeout
    if (loginTimeoutRef.current) {
      clearTimeout(loginTimeoutRef.current)
      loginTimeoutRef.current = null
    }
  }, [])

  // Add a function to clear login process state but keep loading state active
  // This is used for successful login redirects
  const clearLoginProcessOnly = useCallback(() => {
    setIsInLoginProcess(false)
    sessionStorage.removeItem('loginInProgress')

    // Clear any existing timeout
    if (loginTimeoutRef.current) {
      clearTimeout(loginTimeoutRef.current)
      loginTimeoutRef.current = null
    }
  }, [])

  // Ensure cleanup on unmount
  useEffect(() => {
    return () => {
      if (loginTimeoutRef.current) {
        clearTimeout(loginTimeoutRef.current)
      }
      sessionStorage.removeItem('loginInProgress')
    }
  }, [])

  // Check for existing token on component mount and redirect if found
  useEffect(() => {
    const checkExistingToken = async () => {
      try {
        const token = TokenStorage.getToken()
        const userData = TokenStorage.getUserData()

        if (token && userData?.role) {
          console.log('[Login] Found existing token, redirecting based on role:', userData.role)
          setIsRedirecting(true)
          setIsLoading(true)

          // Make sure the path for client is correct
          if (userData.role && userData.role.toString() === 'client') {
            navigate('/client/dashboard', { replace: true })
          } else if (
            userData.role &&
            ['admin', 'administrator'].includes(userData.role.toString())
          ) {
            navigate('/admin/dashboard', { replace: true })
          } else {
            navigate('/', { replace: true })
          }

          // Set a backup timeout for direct navigation if React Router fails
          setTimeout(() => {
            if (!window.location.pathname.includes('/dashboard')) {
              const path =
                userData.role && ['admin', 'administrator'].includes(userData.role.toString())
                  ? '/admin/dashboard'
                  : '/client/dashboard'
              console.log('[Login] Direct navigation fallback to:', path)
              window.location.href = path
            }
          }, 200)

          return
        }

        // If we get here, there's no valid token
        console.log('[Login] No valid token found, showing login form')
        setIsInitializing(false)
      } catch (error) {
        console.error('[Login] Error checking token:', error)
        setIsInitializing(false)
      }
    }

    checkExistingToken()
  }, [navigate])

  // Create a reusable fetchCsrfToken function for the component
  const fetchCsrfToken = async () => {
    try {
      setIsTokenRefreshing(true)
      const response = await wpApi.getCSRFToken()
      const token = response?.csrf_token || null
      if (debugLogin) console.log('Login - fetchCsrfToken - token:', token)
      return token
    } catch (error) {
      console.error('Error fetching CSRF token:', error)
      return null
    } finally {
      setIsTokenRefreshing(false)
    }
  }

  // Fetch a fresh CSRF token when component mounts and periodically
  useEffect(() => {
    // Fetch token initially
    fetchCsrfToken()

    // Refresh token periodically (every 15 minutes)
    const intervalId = setInterval(fetchCsrfToken, 15 * 60 * 1000)

    return () => clearInterval(intervalId)
  }, [])

  // Error message from auth context
  useEffect(() => {
    if (authErrors?.login?.message) {
      setError(authErrors.login.message)
      setIsLoading(false)
    }
  }, [authErrors])

  // Watch for authentication state changes
  useEffect(() => {
    console.log('[Login] Authentication state changed:', {
      isAuthenticated,
      user,
      isInLoginProcess,
    })

    if (isAuthenticated && user && !isRedirecting) {
      // We are authenticated and have user data - redirect to the appropriate dashboard
      setIsRedirecting(true)

      // Get the redirect path based on user role
      const redirectPath =
        user.role && ['admin', 'administrator'].includes(user.role.toString())
          ? '/admin/dashboard'
          : '/client/dashboard'

      console.log('[Login] Authentication successful, redirecting to:', redirectPath)

      // Attempt the redirect with React Router first
      navigate(redirectPath, { replace: true })

      // Fallback to direct location change in case React Router navigation fails
      // This ensures the user gets redirected even if there's an issue with React Router
      setTimeout(() => {
        if (window.location.pathname !== redirectPath) {
          console.log(
            '[Login] React Router navigation may have failed, using direct location change'
          )
          window.location.href = redirectPath
        }
      }, 500)
    }
  }, [isAuthenticated, user, navigate, isRedirecting, isInLoginProcess])

  // Listen for auth:loginSuccess event as a backup trigger
  useEffect(() => {
    const handleLoginSuccess = (event: CustomEvent) => {
      const { userId, role } = event.detail
      console.log('[Login] Received login success event:', { userId, role })

      if (!isRedirecting) {
        console.log('[Login] Triggering redirect from custom event')
        setIsRedirecting(true)
        setIsLoading(true)

        // Navigate based on role
        const path =
          role && ['admin', 'administrator'].includes(role.toString())
            ? '/admin/dashboard'
            : '/dashboard'
        navigate(path, { replace: true })

        // Fallback
        setTimeout(() => {
          window.location.href = path
        }, 500)
      }
    }

    // Add event listener
    window.addEventListener('auth:loginSuccess', handleLoginSuccess as EventListener)

    // Cleanup
    return () => {
      window.removeEventListener('auth:loginSuccess', handleLoginSuccess as EventListener)
    }
  }, [navigate, isRedirecting])

  // Handle login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isLoading) return

    // If we're already in a loading/login state, prevent additional attempts
    if (isInLoginProcess) {
      console.log('[Login] Login already in progress, preventing duplicate submission')
      return
    }

    // Clear any existing errors
    setError(null)
    setAuthErrors({ login: null, register: null })

    // Validate input
    if (!email || !password) {
      setError('Please enter both email and password')
      return
    }

    setIsLoading(true)
    setIsInLoginProcess(true)

    // Log that we're starting the login process (masked email for privacy)
    const emailMask = email.split('@')
    const maskedEmail =
      emailMask.length > 1 ? `${emailMask[0].substring(0, 2)}***@${emailMask[1]}` : '***@***.com'

    console.log('[Login] Starting login process:', {
      email: maskedEmail,
      rememberMe,
      timestamp: new Date().toISOString(),
    })

    try {
      // Make sure remember me option is properly passed to the login method
      // This ensures tokens are stored in the correct storage location
      const user = await auth.login(email, password, rememberMe, 'client')

      if (user) {
        console.log('[Login] Login successful, user role:', user.role)

        // Check if the user is an admin trying to use client login
        if (user.role && ['admin', 'administrator'].includes(user.role.toString())) {
          console.log('[Login] Admin user attempted to use client login:', maskedEmail)
          // Log out the admin user
          await auth.logout()
          setError(
            'This login is for clients only. Administrators should use the admin login page.'
          )
          setIsLoading(false)
          setIsInLoginProcess(false)
          return
        }

        clearLoginProcessOnly() // Clear login process state but keep loading active

        // Set redirect timestamp for optimization
        sessionStorage.setItem('auth_redirect_timestamp', Date.now().toString())
        sessionStorage.setItem('auth_user_id', user.id.toString())
        sessionStorage.setItem('auth_user_role', user.role)

        // Determine redirect path based on user role
        const redirectPath = '/client/dashboard'

        console.log('[Login] Redirecting to:', redirectPath)

        // First try to use React Router
        try {
          navigate(redirectPath, { replace: true })
        } catch (navigateError) {
          console.error('[Login] Navigation error:', navigateError)
          // Fallback to direct location change if React Router fails
          setTimeout(() => {
            if (window.location.pathname !== redirectPath) {
              console.log('[Login] React Router navigation failed, using direct location change')
              window.location.href = redirectPath
            }
          }, 500)
        }
      } else {
        console.error('[Login] Login failed: No user data returned')
        setError('Login failed: No user data returned. Please try again.')
        clearLoginState()
      }
    } catch (err: any) {
      console.error('[Login] Login error:', err)

      // Clear login process state
      clearLoginState()

      // Handle specific error types
      if (err.name === 'ValidationError' && err.errors) {
        // Validation errors
        const errorMessages = Object.values(err.errors).flat().join(' ')
        setError(errorMessages || 'Invalid email or password')
      } else if (err.message) {
        // Regular errors with message
        setError(err.message)
      } else {
        // Fallback error
        setError('Login failed. Please try again later.')
      }

      // Update auth errors state
      setAuthErrors({
        ...authErrors,
        login: err,
      })
    }
  }

  useEffect(() => {
    const savedVerificationLink = localStorage.getItem('verificationLink')
    if (savedVerificationLink && registrationStatus === 'success' && !verificationLink) {
      setVerificationLink(savedVerificationLink)
    }
  }, [registrationStatus, verificationLink])

  useEffect(() => {
    if (verificationLink) {
      localStorage.setItem('verificationLink', verificationLink)
    } else {
      localStorage.removeItem('verificationLink')
    }
  }, [verificationLink])

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    })
  }

  // Helper to create a more realistic verification token
  const createVerificationToken = (email: string): string => {
    // In a real app, this would come from the backend
    // For testing, we'll create a more realistic token based on email and timestamp
    const timestamp = Date.now().toString()
    const emailHash = btoa(email).replace(/=/g, '')
    return `verify_${emailHash}_${timestamp.substring(timestamp.length - 6)}`
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegisterError(null)
    setRegistrationStatus('submitting')
    setIsRegisterLoading(true)

    try {
      // Validate required fields
      if (!formData.firstName.trim()) {
        throw new Error('First name is required')
      }

      if (!formData.lastName.trim()) {
        throw new Error('Last name is required')
      }

      // Create the register data
      const registerData = {
        email: formData.email,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        password: formData.password,
        phoneNumber: formData.phone || '',
        company: formData.companyName || '',
        rememberMe: formData.rememberMe,
        role: 'client', // Default role for new registrations
      }

      console.log('[Login] Attempting to register user:', registerData.email)
      // Log phone number specifically for debugging
      console.log(
        '[Login] Registration phone number:',
        formData.phone || '(empty)',
        '→ mapped to phoneNumber:',
        registerData.phoneNumber
      )

      // Ensure CSRF token is available before registration
      if (csrfToken === null) {
        console.log('[Login] No CSRF token available, fetching one before registration')
        await fetchCsrfToken()
      }

      // Call the register method directly from jwtApi
      await jwtApi.register(registerData)
      console.log('[Login] Registration successful')

      // Clean up any old development verification data before generating new ones
      // Use false to ensure we clear all old data before creating new verification tokens
      cleanupDevVerificationData(false)

      // In development environment, create a verification link for testing
      const verificationUrl = buildVerificationUrl(registerData.email)
      console.log('[Login] Generated verification URL:', verificationUrl)

      // Set the verification link to trigger the popup
      setVerificationLink(verificationUrl)

      // Store the registered email in session storage for reference
      sessionStorage.setItem('registeredEmail', registerData.email)

      // Set flag to clear form after registration
      sessionStorage.setItem('clearRegistrationForm', 'true')

      // Set the registration status to success
      setRegistrationStatus('success')
      setIsRegisterLoading(false)
    } catch (error: any) {
      console.error('Registration error:', error)
      setRegisterError(error.message || 'Registration failed')
      setRegistrationStatus('error')
      setIsRegisterLoading(false)

      // Clean up any development verification data on error
      cleanupDevVerificationData(true)
    }
  }

  const closeVerificationPopup = () => {
    console.log('Closing verification popup')

    // Clear verification link from state
    setVerificationLink(null)

    // Remove any stored verification data
    localStorage.removeItem('verificationLink')
    sessionStorage.removeItem('verificationLink')

    // Clean up any development verification data
    cleanupDevVerificationData(true)

    // Reset registration status to prevent second popup
    setRegistrationStatus('idle')

    // Reset the form data
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      companyName: '',
      rememberMe: false,
    })

    // If registration was successful, switch to login tab
    console.log('Registration was successful, switching to login tab')
    setActiveTab('login')
  }

  // Function to reset form when switching tabs
  const handleTabChange = (tab: 'login' | 'register') => {
    // Reset form data when switching tabs
    if (tab === 'login') {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        companyName: '',
        rememberMe: false,
      })
    }
    setActiveTab(tab)
  }

  // Update register error if context error changes
  useEffect(() => {
    if (authErrors?.register?.message) {
      setRegisterError(authErrors.register.message)
    }
  }, [authErrors])

  // Function to resend verification email
  const handleResendVerification = async () => {
    const emailToVerify = localStorage.getItem('pendingVerificationEmail') || email

    if (!emailToVerify) {
      setError('No email address to verify. Please enter your email and try again.')
      return
    }

    setIsResendingVerification(true)

    try {
      // We would ideally have an API endpoint for this, but for now we'll just show a message
      console.log('[Login] Requesting verification email resend for:', emailToVerify)

      // Simulate API call and success
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Show success message
      setError('Verification email has been resent. Please check your inbox.')
      setIsVerificationError(false)
    } catch (err) {
      console.error('[Login] Failed to resend verification email:', err)
      setError('Failed to resend verification email. Please try again later.')
    } finally {
      setIsResendingVerification(false)
    }
  }

  // Cleanup effect when component mounts
  useEffect(() => {
    // Clean up any development verification data on component mount
    // but preserve current data if we're in an active verification process
    cleanupDevVerificationData(true)

    // Check if we need to clear the registration form from a previous registration
    const shouldClearForm = sessionStorage.getItem('clearRegistrationForm') === 'true'
    if (shouldClearForm) {
      console.log('[Login] Clearing registration form based on session flag')
      // Reset form data
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        companyName: '',
        rememberMe: false,
      })
      // Set active tab to login
      setActiveTab('login')
      // Remove the flag
      sessionStorage.removeItem('clearRegistrationForm')
    }
  }, [])

  // Skip showing loading screen when redirecting (this is what causes the blue loading screen)
  if (isInitializing || (isLoading && !isRedirecting) || isTokenRefreshing) {
    let message = 'Preparing login...'
    if (isInLoginProcess) message = 'Logging in...'

    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <CircleLoader color="#123abc" size={50} />
        <p className="mt-4 text-gray-600">{message || 'Loading...'}</p>
      </div>
    )
  }

  if (!isSupported) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Unsupported Browser</h2>
          <p className="text-gray-600 mb-6">
            Your browser is not supported. Please use a modern browser like Chrome, Firefox, Safari,
            or Edge.
          </p>
          <a
            href="https://www.google.com/chrome/"
            className="block w-full text-center bg-[#fdba6b] text-white py-2 px-4 rounded-md hover:bg-[#fdba6b]/90"
          >
            Download Chrome
          </a>
        </div>
      </div>
    )
  }

  const backgroundImageUrl = '/images/Sasta-YachtShot-H022.jpg'
  const logoImageUrl = '/images/Logo-Yachtstory-WHITE.png'

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="w-full md:w-1/2 p-8 flex flex-col justify-center bg-white">
        <div className="max-w-md w-full mx-auto space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-center">Welcome to Charter Hub</h2>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              className={`flex-1 py-2 px-4 rounded-md ${
                activeTab === 'login'
                  ? 'bg-white text-center shadow-sm font-medium'
                  : 'text-gray-600 hover:text-[#fdba6b] transition-colors'
              }`}
              onClick={() => handleTabChange('login')}
            >
              Login
            </button>
            <button
              className={`flex-1 py-2 px-4 rounded-md ${
                activeTab === 'register'
                  ? 'bg-white text-center shadow-sm font-medium'
                  : 'text-gray-600 hover:text-[#fdba6b] transition-colors'
              }`}
              onClick={() => handleTabChange('register')}
            >
              Register
            </button>
          </div>

          {activeTab === 'login' ? (
            <div>
              {error && (
                <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">
                  {error}

                  {isVerificationError && (
                    <div className="mt-3">
                      <button
                        onClick={handleResendVerification}
                        disabled={isResendingVerification}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#fdba6b] hover:bg-[#fdba6b]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#fdba6b] mb-2"
                      >
                        {isResendingVerification ? (
                          <span className="flex items-center">
                            <CircleLoader size={16} color="#ffffff" className="mr-2" />
                            <span>Resending verification email...</span>
                          </span>
                        ) : (
                          'Resend Verification Email'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {rateLimitState.isLimited && (
                <div className="mb-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-md">
                  Too many failed login attempts. Please try again later.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#fdba6b] focus:border-[#fdba6b] sm:text-sm"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={rateLimitState.isLimited}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="relative mt-1">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#fdba6b] focus:border-[#fdba6b] sm:text-sm"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={rateLimitState.isLimited}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-gray-500"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                            clipRule="evenodd"
                          />
                          <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-gray-500"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path
                            fillRule="evenodd"
                            d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-[#fdba6b] focus:ring-[#fdba6b] border-gray-300 rounded"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={rateLimitState.isLimited}
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                      Remember me
                    </label>
                  </div>

                  <div className="text-sm">
                    <Link
                      to="/forgot-password"
                      className="font-medium text-[#fdba6b] hover:text-[#fdba6b]/90"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={rateLimitState.isLimited || isLoading}
                  className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                    rateLimitState.isLimited || isLoading
                      ? 'bg-[#fdba6b]/70 cursor-not-allowed'
                      : 'bg-[#fdba6b] hover:bg-[#fdba6b]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#fdba6b]'
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <CircleLoader size={16} color="#ffffff" className="mr-2" />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </form>

              <div className="mt-2 text-center">
                {activeTab === 'login' ? (
                  <p className="text-sm text-gray-600">
                    Or{' '}
                    <button
                      type="button"
                      className="font-medium text-[#fdba6b] hover:text-[#fdba6b]/90 focus:outline-none"
                      onClick={() => handleTabChange('register')}
                    >
                      create an account
                    </button>
                  </p>
                ) : (
                  <p className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <button
                      type="button"
                      className="font-medium text-[#fdba6b] hover:text-[#fdba6b]/90 focus:outline-none"
                      onClick={() => handleTabChange('login')}
                    >
                      Sign in
                    </button>
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div>
              {registerError && (
                <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">
                  {registerError}
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      First name
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      autoComplete="given-name"
                      required
                      className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#fdba6b] focus:border-[#fdba6b] sm:text-sm"
                      placeholder="Enter your first name"
                      value={formData.firstName}
                      onChange={handleRegisterChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Last name
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      autoComplete="family-name"
                      required
                      className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#fdba6b] focus:border-[#fdba6b] sm:text-sm"
                      placeholder="Enter your last name"
                      value={formData.lastName}
                      onChange={handleRegisterChange}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="registerEmail"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email address
                  </label>
                  <input
                    id="registerEmail"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#fdba6b] focus:border-[#fdba6b] sm:text-sm"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleRegisterChange}
                  />
                </div>

                <div>
                  <label
                    htmlFor="registerPassword"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <div className="relative mt-1">
                    <input
                      id="registerPassword"
                      name="password"
                      type={showRegisterPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#fdba6b] focus:border-[#fdba6b] sm:text-sm"
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={handleRegisterChange}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    >
                      {showRegisterPassword ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-gray-500"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                            clipRule="evenodd"
                          />
                          <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-gray-500"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path
                            fillRule="evenodd"
                            d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                  <PasswordStrengthIndicator password={formData.password} />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone (optional)
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#fdba6b] focus:border-[#fdba6b] sm:text-sm"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={handleRegisterChange}
                  />
                </div>

                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                    Company name (optional)
                  </label>
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    autoComplete="organization"
                    className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#fdba6b] focus:border-[#fdba6b] sm:text-sm"
                    placeholder="Enter your company name"
                    value={formData.companyName}
                    onChange={handleRegisterChange}
                  />
                </div>

                <div className="flex items-center">
                  <input
                    id="registerRememberMe"
                    name="rememberMe"
                    type="checkbox"
                    className="h-4 w-4 text-[#fdba6b] focus:ring-[#fdba6b] border-gray-300 rounded"
                    checked={formData.rememberMe}
                    onChange={handleRegisterChange}
                  />
                  <label htmlFor="registerRememberMe" className="ml-2 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isRegisterLoading}
                  className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                    isRegisterLoading
                      ? 'bg-[#fdba6b]/70 cursor-not-allowed'
                      : 'bg-[#fdba6b] hover:bg-[#fdba6b]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#fdba6b]'
                  }`}
                >
                  {isRegisterLoading ? (
                    <div className="flex items-center justify-center">
                      <CircleLoader size={16} color="#ffffff" className="mr-2" />
                      <span>Creating account...</span>
                    </div>
                  ) : (
                    'Create account'
                  )}
                </button>

                <div className="text-xs text-center text-gray-500">
                  By creating an account, you agree to our{' '}
                  <Link to="/terms" className="text-[#fdba6b]">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-[#fdba6b]">
                    Privacy Policy
                  </Link>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Right side - Background image */}
      <div className="hidden md:block md:w-1/2 relative">
        <div className="absolute inset-0">
          <img
            className="h-full w-full object-cover"
            src={backgroundImageUrl}
            alt="Yacht background"
          />
          <div className="absolute inset-0 bg-black opacity-30"></div>
          <img
            src={logoImageUrl}
            alt="Yacht Story Logo"
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-[200px] w-auto"
          />
        </div>
      </div>

      {verificationLink && (
        <VerificationLinkPopup
          verificationLink={verificationLink}
          onClose={closeVerificationPopup}
          onVerificationSuccess={() => {
            setVerificationLink(null)
            setRegistrationStatus('idle')
            setActiveTab('login')

            // Reset form data
            setFormData({
              firstName: '',
              lastName: '',
              email: '',
              password: '',
              phone: '',
              companyName: '',
              rememberMe: false,
            })
          }}
        />
      )}
    </div>
  )
}
