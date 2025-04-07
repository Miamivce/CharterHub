import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom'
import { useJWTAuth } from '@/contexts/auth/JWTAuthContext'
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter'
import VerificationLinkPopup from '@/components/auth/VerificationLinkPopup'

// Asset imports
const backgroundImageUrl = '/images/Sasta-YachtShot-H022.jpg'
const logoImageUrl = '/images/Logo-Yachtstory-WHITE.png'

// Development response type definition
interface RegisterResponse {
  success: boolean
  message?: string
  error?: string
  verification_url?: string
  verification_link?: string
  email?: string
  token?: string
}

// Define a proper customer data interface
interface CustomerData {
  id?: number
  email?: string
  name?: string
  registered?: boolean
  verified?: boolean
  loggedIn?: boolean
  accountStatus?: string
}

// Function to save registration attempt metadata to localStorage
const saveRegistrationAttempt = (
  token: string,
  data: {
    valid?: boolean
    registered?: boolean
    email?: string
  }
) => {
  try {
    if (!token) return

    // Store registration attempt with timestamp and metadata
    localStorage.setItem(
      `registration_attempt_${token.substring(0, 16)}`,
      JSON.stringify({
        ...data,
        timestamp: Date.now(),
        browserInfo: navigator.userAgent,
        version: '1.0',
      })
    )

    console.log('[DEBUG] Saved registration attempt data:', {
      token: token.substring(0, 8) + '...',
      ...data,
    })
  } catch (e) {
    console.error('[DEBUG] Error saving registration attempt data:', e)
  }
}

// Function to get previous registration attempt from localStorage
const getPreviousRegistrationAttempt = (token: string) => {
  try {
    if (!token) return null

    const data = localStorage.getItem(`registration_attempt_${token.substring(0, 16)}`)
    if (!data) return null

    return JSON.parse(data)
  } catch (e) {
    console.error('[DEBUG] Error retrieving registration attempt data:', e)
    return null
  }
}

// Add a hard security barrier function at the top of the file
const purgeAllAuthState = () => {
  // Clear all possible authentication tokens and state
  console.log('[SECURITY] Purging all authentication tokens and state')

  // Local/session storage tokens
  localStorage.removeItem('auth_token')
  sessionStorage.removeItem('auth_token')
  sessionStorage.removeItem('jwt_token')
  localStorage.removeItem('jwt_token')

  // Clear other potentially sensitive data
  localStorage.removeItem('user')
  sessionStorage.removeItem('user')

  // Clear cookies related to authentication
  document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  document.cookie = 'jwt_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'

  // Clear verification related data except what's needed for the current registration flow
  if (localStorage.getItem('verificationEmail')) {
    const emailInput = document.getElementById('email') as HTMLInputElement | null
    const currentEmail = emailInput?.value || ''

    if (localStorage.getItem('verificationEmail') !== currentEmail) {
      localStorage.removeItem('verificationLink')
      localStorage.removeItem('verificationEmail')
    }
  }
}

// Remove the markTokenUsedLocally function and replace it with an empty stub
const markTokenUsedLocally = (token: string): void => {
  // This function has been intentionally disabled
  // We no longer cache invitation statuses locally for security reasons
  console.log('[DEBUG] Local token caching disabled for security reasons')
}

// Remove the isTokenUsedLocally function and replace it with an empty stub
const isTokenUsedLocally = (token: string): boolean => {
  // This function has been intentionally disabled
  // We no longer check local cache for invitation statuses
  console.log('[DEBUG] Local token caching disabled for security reasons')
  return false
}

export function Register() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Check if this is an invited registration
  const [isInvited, setIsInvited] = useState(searchParams.get('invited') === 'true')
  const [invitationToken, setInvitationToken] = useState<string | null>(() => {
    // Simply return the token without any localStorage checking
    return searchParams.get('token')
  })

  const [clientId, setClientId] = useState<string | null>(searchParams.get('client'))

  const [invitationStatus, setInvitationStatus] = useState<
    'valid' | 'invalid' | 'used' | 'checking' | 'unknown' | 'error'
  >('checking')
  const [isLoadingCustomerData, setIsLoadingCustomerData] = useState(
    isInvited && clientId ? true : false
  )
  const [isLoading, setIsLoading] = useState(false)
  const [customerData, setCustomerData] = useState<CustomerData | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [verificationLink, setVerificationLink] = useState<string | null | 'loading'>(null)
  const [showVerificationPopup, setShowVerificationPopup] = useState(false)
  const [registrationStatus, setRegistrationStatus] = useState<
    'idle' | 'submitting' | 'success' | 'error'
  >('idle')
  const [showPassword, setShowPassword] = useState(false)

  const { errors } = useJWTAuth()
  const authError = errors?.register?.message

  // For ALL types of registration
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    company: '',
    password: '',
    rememberMe: false,
    role: 'client',
  })

  // Add API base URL definition
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || ''

  // Auto-redirect to login if invitation is invalid (which likely means it's been used)
  useEffect(() => {
    console.log('[DEBUG] Invitation status changed to:', invitationStatus)
    if (invitationStatus === 'invalid' || invitationStatus === 'used') {
      // Don't redirect automatically, let the user read the message and choose to login
      console.log(
        '[DEBUG] Invitation is invalid or used, showing login option instead of auto-redirecting'
      )

      // We no longer store any info in localStorage
    }
  }, [invitationStatus, navigate, invitationToken])

  // Check invitation status
  const checkInvitationStatus = async (token: string): Promise<boolean> => {
    console.log('[DEBUG] Checking invitation status for token:', token.substring(0, 10) + '...')

    try {
      const apiBaseUrl = import.meta.env.VITE_PHP_API_URL || 'http://localhost:8000'

      console.log('[DEBUG] Using API base URL:', apiBaseUrl)
      console.log(
        '[DEBUG] Sending check invitation request to:',
        `${apiBaseUrl}/auth/check-invitation.php?token=${token}`
      )

      // Direct request - simplified headers to avoid CORS issues
      // Add cache busting to prevent browsers from caching results
      const cacheBuster = Date.now()
      const response = await fetch(
        `${apiBaseUrl}/auth/check-invitation.php?token=${token}&_=${cacheBuster}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest', // Help identify legitimate requests
            // Removed headers that might cause CORS issues
          },
          // Removed credentials option to avoid CORS preflight complications
        }
      )

      console.log('[DEBUG] Invitation check response status:', response.status)

      // Try to parse response even if status is not 200
      let data
      const contentType = response.headers.get('content-type')

      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json()
          console.log('[DEBUG] Invitation check response data:', data)
        } catch (parseError) {
          console.error('[DEBUG] Failed to parse JSON response:', parseError)
          throw new Error(`Invalid JSON response: ${response.status}`)
        }
      } else {
        console.error('[DEBUG] Response is not JSON. Content-Type:', contentType)
        throw new Error(`Invalid response format: ${response.status}`)
      }

      // Now analyze the response based on the parsed data
      if (data && data.success && data.valid) {
        console.log('[DEBUG] Invitation is valid')
        setInvitationStatus('valid')

        // If customer data is included, store it for use during registration
        if (data.customer) {
          setCustomerData(data.customer)
          console.log('[DEBUG] Received customer data:', data.customer)
        }

        return true
      } else if (data && (data.status === 'used' || data.error === 'token_used')) {
        console.log('[DEBUG] Invitation is already used')
        setInvitationStatus('used')

        // Store customer data if available
        if (data.customer) {
          setCustomerData(data.customer)
          console.log('[DEBUG] Received customer data for used invitation:', data.customer)
        }

        return false
      } else if (data) {
        // Handle other errors with more detail
        console.log('[DEBUG] Invitation is invalid:', data)
        setInvitationStatus('invalid')
        if (data.message) {
          setError(data.message)
        }
        return false
      } else {
        // Fallback for unexpected responses
        throw new Error('Invalid server response format')
      }
    } catch (error) {
      console.error('[DEBUG] Error checking invitation status:', error)
      setInvitationStatus('unknown')
      setError(
        'We encountered an error verifying your invitation link. Please try again or contact an administrator.'
      )
      return false
    }
  }

  // Clear any lingering auth state on mount
  useEffect(() => {
    console.log('[DEBUG] Register component mounted')

    // SECURITY: Always clear authentication state when entering registration page
    // This prevents any unauthorized logins from previous failed attempts
    purgeAllAuthState()

    return () => {
      console.log('[DEBUG] Register component unmounted')
    }
  }, [])

  // Check invitation status on mount
  useEffect(() => {
    if (invitationToken) {
      console.log('[DEBUG] Processing invitation token:', invitationToken)
      console.log('[DEBUG] Current invitation status before check:', invitationStatus)

      // Set to checking state to prevent premature UI display
      setInvitationStatus('checking')

      // Log that we're about to check the invitation status
      console.log(
        '[DEBUG] Checking invitation status for token:',
        invitationToken.substring(0, 10) + '...'
      )

      // Add a minimum delay for verification screen display
      const minDisplayTime = 2000 // 2 seconds for smooth UX
      const startTime = Date.now()

      setTimeout(() => {
        checkInvitationStatus(invitationToken)
          .then((isValid) => {
            console.log('[DEBUG] Invitation status check result:', isValid ? 'valid' : 'invalid')
            console.log('[DEBUG] Current invitation status after check:', invitationStatus)

            // Add remaining delay if API response was too quick
            const elapsedTime = Date.now() - startTime
            const remainingDelay = Math.max(0, minDisplayTime - elapsedTime)

            if (remainingDelay > 0) {
              console.log(`[DEBUG] Adding ${remainingDelay}ms delay for smooth UX`)
              setTimeout(() => {
                // No action needed, the status is already set by checkInvitationStatus
              }, remainingDelay)
            }
          })
          .catch((err) => {
            console.error('[DEBUG] Error checking invitation status:', err)

            // Add remaining delay if API response was too quick
            const elapsedTime = Date.now() - startTime
            const remainingDelay = Math.max(0, minDisplayTime - elapsedTime)

            if (remainingDelay > 0) {
              setTimeout(() => {
                setInvitationStatus('unknown')
                setError(
                  'Unable to verify this invitation. Please try again or contact an administrator.'
                )
              }, remainingDelay)
            } else {
              setInvitationStatus('unknown')
              setError(
                'Unable to verify this invitation. Please try again or contact an administrator.'
              )
            }
          })
      }, 100)
    } else if (isInvited) {
      // If isInvited is true but we have no token, this is an error state
      console.log('[DEBUG] Invited registration requested but no token provided')
      setError(
        'Invalid invitation link. Please use the complete link provided by the administrator.'
      )
    }
  }, [invitationToken, isInvited])

  // Add debug logging when verification link state changes
  useEffect(() => {
    console.log('[DEBUG] Verification link state changed:', verificationLink)
  }, [verificationLink])

  // Restore verification link from localStorage if available
  useEffect(() => {
    if (registrationStatus === 'success' && !verificationLink) {
      const storedLink = localStorage.getItem('verificationLink')
      const storedEmail = localStorage.getItem('verificationEmail')
      if (storedLink) {
        setVerificationLink(storedLink)
        // Only restore email from localStorage if not in invitation mode
        if (storedEmail && !isInvited) {
          setFormData((prev) => ({
            ...prev,
            email: storedEmail,
          }))
        }
        console.log('[DEBUG] Restored verification link from localStorage:', storedLink)
      }
    }
  }, [registrationStatus, verificationLink, isInvited])

  // Debug logging for invited status
  useEffect(() => {
    if (isInvited) {
      console.log('[DEBUG] User is registering via invite link with client ID:', clientId)
      console.log('[DEBUG] Invited registration mode is active')
    }
  }, [isInvited, clientId])

  // Fetch customer data if this is an invited registration
  useEffect(() => {
    const fetchCustomerData = async () => {
      if (isInvited && clientId) {
        try {
          setIsLoadingCustomerData(true)

          // Log environment variables for troubleshooting
          console.log('[DEBUG] Environment variables:', {
            VITE_API_URL: import.meta.env.VITE_API_URL,
            VITE_PHP_API_URL: import.meta.env.VITE_PHP_API_URL,
            NODE_ENV: import.meta.env.MODE,
          })

          // Use the PHP API URL for backend requests
          const apiBaseUrl = import.meta.env.VITE_PHP_API_URL || 'http://localhost:8000'
          console.log('[DEBUG] Using API URL:', apiBaseUrl)

          const url = `${apiBaseUrl}/api/public/invited-customer.php?id=${clientId}`
          console.log('[DEBUG] Fetching from URL:', url)

          const response = await fetch(url, {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          })

          if (!response.ok) {
            throw new Error(
              `Failed to fetch customer data: HTTP ${response.status} - ${response.statusText}`
            )
          }

          const contentType = response.headers.get('content-type')
          if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Invalid API response format. The server returned a non-JSON response.')
          }

          const data = await response.json()
          console.log('[DEBUG] Retrieved customer data for invited registration:', data)

          if (data.success && data.customer) {
            setCustomerData(data.customer)

            // Don't pre-fill any fields for security reasons
            // This ensures the user enters all their own information
            setFormData((prev) => ({
              ...prev,
              // All fields must be entered by the user
              // No pre-filling whatsoever, not even email
            }))
          } else {
            throw new Error(data.message || 'Customer data not found in API response')
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
          console.error('[DEBUG] Error fetching customer data:', errorMessage)
          setError(`Unable to load customer information: ${errorMessage}. Please contact support.`)
        } finally {
          setIsLoadingCustomerData(false)
        }
      }
    }

    fetchCustomerData()
  }, [isInvited, clientId])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Validate fields
      if (!formData.firstName.trim()) {
        throw new Error('First name is required')
      }
      if (!formData.lastName.trim()) {
        throw new Error('Last name is required')
      }
      if (!formData.email.trim()) {
        throw new Error('Email is required')
      }
      if (!formData.password.trim()) {
        throw new Error('Password is required')
      }

      // Create a local copy of the data to send
      const registrationData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phoneNumber: formData.phoneNumber.trim(),
        company: formData.company.trim(),
        role: 'client',
        isInvited: isInvited,
      }

      // Add invitation data for invited registrations
      if (isInvited && invitationToken) {
        console.log('[DEBUG] Adding invitation data to registration')

        // Ensure we're using the customer_id from the customerData if available
        const invitationCustomerId = customerData?.id || clientId || null
        console.log('[DEBUG] Using customer_id for invitation:', invitationCustomerId)

        Object.assign(registrationData, {
          isInvited: true,
          invitationToken: invitationToken,
          clientId: invitationCustomerId, // Use the most reliable ID source
        })
      }

      console.log('[DEBUG] Submitting registration:', {
        ...registrationData,
        password: '[REDACTED]',
      })

      // Call the API endpoint to register the user
      const apiBaseUrl = import.meta.env.VITE_PHP_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiBaseUrl}/auth/register.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(registrationData),
        credentials: 'include',
      })

      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json()
          throw new Error(
            errorData.message || `Registration failed with status: ${response.status}`
          )
        } else {
          throw new Error(`Registration failed with status: ${response.status}`)
        }
      }

      const data = await response.json()

      console.log('[DEBUG] Registration successful:', data)

      // Now that registration is complete, if this was an invited registration, mark the invitation as used
      if (isInvited && invitationToken && data.success && data.user_id) {
        try {
          console.log('[DEBUG] Marking invitation as used now that registration is complete')

          // Send a separate request to mark the invitation as used
          const markResponse = await fetch(`${apiBaseUrl}/auth/mark-invitation-used.php`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
            body: JSON.stringify({
              token: invitationToken,
              email: registrationData.email,
              user_id: data.user_id,
              registration_completed: true,
            }),
            credentials: 'include',
          })

          const markResult = await markResponse.json()
          console.log('[DEBUG] Mark invitation result:', markResult)
        } catch (markError) {
          // Log but continue - the registration was successful
          console.error('[DEBUG] Error marking invitation as used:', markError)
        }
      }

      // Store verification link for later use
      if (data.verification && data.verification.url) {
        const verificationURL = `${window.location.origin}${data.verification.url}`
        console.log('[DEBUG] Setting verification link from API:', verificationURL)
        setVerificationLink(verificationURL)
        setShowVerificationPopup(true)
      }

      setIsLoading(false)

      // Show success message
      setRegistrationStatus('success')

      // Clear form after successful submission
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        company: '',
        password: '',
        rememberMe: false,
        role: 'client',
      })
    } catch (error: any) {
      console.error('[DEBUG] Registration error:', error)
      setError(error.message || 'An error occurred during registration. Please try again.')
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))

    // When the user changes email after seeing an error, clear the error message
    if (error && name === 'email') {
      console.log('[DEBUG] Clearing error as user is typing in email field')
      setError(null)

      // SECURITY: Clear auth state when user changes email to prevent
      // authentication with previous email after error
      purgeAllAuthState()
    }
  }

  const closeVerificationPopup = () => {
    console.log('[DEBUG] Closing verification popup. Current state:', {
      registrationStatus,
      hasError: !!error,
      errorMessage: error,
    })

    // SECURITY: Always ensure auth state is cleared before redirecting
    purgeAllAuthState()

    // Cancel the loading state for the verification link
    setVerificationLink(null)

    // Handle successful registration redirection
    if (registrationStatus === 'success' && !error) {
      console.log('[DEBUG] Registration was successful and no errors')

      // Add a slight delay to ensure UI updates properly
      setTimeout(() => {
        // SECURITY: Final check - ensure there are no lingering auth tokens
        purgeAllAuthState()

        if (isInvited) {
          console.log('[DEBUG] Invited user, navigating to main application')
          navigate('/client/dashboard')
        } else {
          console.log('[DEBUG] Regular user, navigating to login')
          navigate('/login')
        }
      }, 300)
    } else if (error) {
      console.log('[DEBUG] Not redirecting due to error:', error)
    }
  }

  // Show a loading state while checking invitation status
  if (invitationStatus === 'checking' || isLoadingCustomerData) {
    return (
      <div
        className="min-h-screen flex items-center justify-center flex-col p-4"
        style={{
          backgroundImage: `url('/images/Sasta-YachtShot-H022.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black opacity-30"></div>
        <div className="relative z-10 mb-8">
          <img
            src="/images/Logo-Yachtstory-WHITE.png"
            alt="Yacht Story Logo"
            className="h-24 w-auto"
          />
        </div>
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 relative z-10 flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Verifying Your Invitation
          </h2>

          {/* Improved loading animation with pulsing effect */}
          <div className="relative mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-t-2 border-[#fdba6b]"></div>
            <div className="absolute top-0 left-0 h-16 w-16 rounded-full animate-pulse bg-[#fdba6b]/10"></div>
          </div>

          <div className="space-y-3 w-full">
            <p className="text-gray-600 text-center font-medium">
              Please wait while we verify your invitation...
            </p>
            <p className="text-gray-500 text-sm text-center">
              We're checking your invitation details to ensure everything is in order. This should
              only take a moment.
            </p>

            {/* Visual progress indicator */}
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-4">
              <div
                className="bg-[#fdba6b] h-1.5 rounded-full animate-pulse"
                style={{ width: '50%' }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show a message when invitation status is unknown (server error or other issue)
  if (invitationStatus === 'unknown') {
    return (
      <div
        className="min-h-screen flex items-center justify-center flex-col p-4"
        style={{
          backgroundImage: `url('/images/Sasta-YachtShot-H022.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black opacity-30"></div>
        <div className="relative z-10 mb-8">
          <img
            src="/images/Logo-Yachtstory-WHITE.png"
            alt="Yacht Story Logo"
            className="h-24 w-auto"
          />
        </div>
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 relative z-10">
          <div className="flex flex-col items-center text-center">
            {/* Warning icon */}
            <div className="mb-4 text-yellow-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-14 w-14"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Invitation Status Unavailable</h2>
            <p className="text-gray-600 mb-6">
              We're having trouble verifying your invitation link. Please try again later or contact
              support.
            </p>
          </div>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate('/login')}
              className="bg-[#fdba6b] hover:bg-[#fdba6b]/90 text-white font-medium py-2 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-[#fdba6b] focus:ring-offset-2 transition-colors"
            >
              Go to Login
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show a message when invitation is already used
  if (invitationStatus === 'used') {
    return (
      <div
        className="min-h-screen flex items-center justify-center flex-col p-4"
        style={{
          backgroundImage: `url('/images/Sasta-YachtShot-H022.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black opacity-30"></div>
        <div className="relative z-10 mb-8">
          <img
            src="/images/Logo-Yachtstory-WHITE.png"
            alt="Yacht Story Logo"
            className="h-24 w-auto"
          />
        </div>
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 relative z-10">
          <div className="flex flex-col items-center text-center">
            {/* Information icon */}
            <div className="mb-4 text-blue-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-14 w-14"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            {customerData && customerData.registered && customerData.verified ? (
              // Client is registered and verified
              <>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Account Already Active</h2>
                <p className="text-gray-600 mb-6">
                  This invitation link has already been used and your account is fully set up.
                  Please log in to access your account.
                </p>
              </>
            ) : customerData && customerData.registered && !customerData.verified ? (
              // Client is registered but not verified
              <>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Verification Required</h2>
                <p className="text-gray-600 mb-6">
                  This invitation link has already been used, but your account needs to be verified.
                  Please check your email for the verification link that was sent to you during
                  registration.
                </p>
              </>
            ) : (
              // Default case - just used or unknown status
              <>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Invitation Already Used</h2>
                <p className="text-gray-600 mb-6">
                  This invitation link has already been used to register an account. If you've
                  already registered, please login with your credentials.
                </p>
              </>
            )}
          </div>
          <div className="flex justify-center">
            <button
              onClick={() => navigate('/login')}
              className="bg-[#fdba6b] hover:bg-[#fdba6b]/90 text-white font-medium py-2 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-[#fdba6b] focus:ring-offset-2 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show a message when invitation is invalid
  if (invitationStatus === 'invalid') {
    return (
      <div
        className="min-h-screen flex items-center justify-center flex-col p-4"
        style={{
          backgroundImage: `url('/images/Sasta-YachtShot-H022.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black opacity-30"></div>
        <div className="relative z-10 mb-8">
          <img
            src="/images/Logo-Yachtstory-WHITE.png"
            alt="Yacht Story Logo"
            className="h-24 w-auto"
          />
        </div>
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 relative z-10">
          <div className="flex flex-col items-center text-center">
            {/* Error icon */}
            <div className="mb-4 text-red-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-14 w-14"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Invalid Invitation</h2>
            <p className="text-gray-600 mb-6">
              This invitation link is invalid or has expired. Please contact your administrator for
              a new invitation.
            </p>
          </div>
          <div className="flex justify-center">
            <button
              onClick={() => navigate('/login')}
              className="bg-[#fdba6b] hover:bg-[#fdba6b]/90 text-white font-medium py-2 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-[#fdba6b] focus:ring-offset-2 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Registration form */}
      <div className="w-full md:w-1/2 p-8 flex flex-col justify-center bg-white">
        <div className="mx-auto w-full max-w-lg">
          <div className="max-w-md w-full mx-auto space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-center">
                {isInvited ? 'Complete Your Registration' : 'Create your account'}
              </h2>
              {isInvited && (
                <p className="mt-2 text-center text-sm text-gray-600">
                  You have been invited to YACHT STORY's Charter Hub, please register your account
                  below.
                </p>
              )}
            </div>

            {/* Only show login/register toggle when not using an invitation link */}
            {!isInvited && (
              <div className="flex bg-gray-100 rounded-lg p-1">
                <Link
                  to="/login"
                  className="flex-1 py-2 px-4 text-center text-gray-600 hover:text-[#fdba6b] transition-colors"
                >
                  Login
                </Link>
                <button className="flex-1 py-2 px-4 rounded-md bg-white text-center shadow-sm font-medium">
                  Register
                </button>
              </div>
            )}

            {isLoadingCustomerData ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#fdba6b] focus:border-[#fdba6b] sm:text-sm"
                      placeholder="Enter your first name"
                    />
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#fdba6b] focus:border-[#fdba6b] sm:text-sm"
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>

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
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#fdba6b] focus:border-[#fdba6b] sm:text-sm"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#fdba6b] focus:border-[#fdba6b] sm:text-sm"
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 mt-1 pr-3 flex items-center text-sm leading-5"
                    >
                      {showPassword ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-gray-400"
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
                          className="h-5 w-5 text-gray-400"
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
                  <PasswordStrengthMeter password={formData.password} />
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                    Phone Number (optional)
                  </label>
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#fdba6b] focus:border-[#fdba6b] sm:text-sm"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                    Company (optional)
                  </label>
                  <input
                    id="company"
                    name="company"
                    type="text"
                    value={formData.company}
                    onChange={handleChange}
                    className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#fdba6b] focus:border-[#fdba6b] sm:text-sm"
                    placeholder="Enter your company name"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="h-4 w-4 text-[#fdba6b] focus:ring-[#fdba6b] border-gray-300 rounded"
                  />
                  <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>

                {(error || authError) && (
                  <div className="rounded-md bg-red-50 p-4">
                    <div className="flex">
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Registration failed</h3>
                        <div className="mt-2 text-sm text-red-700">{error || authError}</div>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    isLoading ||
                    registrationStatus === 'submitting' ||
                    registrationStatus === 'success'
                  }
                  className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                    isLoading ||
                    registrationStatus === 'submitting' ||
                    registrationStatus === 'success'
                      ? 'bg-[#fdba6b]/70 cursor-not-allowed'
                      : 'bg-[#fdba6b] hover:bg-[#fdba6b]/90'
                  }`}
                >
                  {registrationStatus === 'submitting'
                    ? 'Creating account...'
                    : registrationStatus === 'success'
                      ? 'Account created'
                      : 'Create account'}
                </button>
              </form>
            )}
          </div>
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
            alt="Charter Hub Logo"
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-[288px] w-auto"
          />
        </div>
      </div>

      {/* Verification Link Popup */}
      {verificationLink && (
        <VerificationLinkPopup
          link={verificationLink === 'loading' ? '' : verificationLink}
          email={formData.email}
          onClose={() => {
            // SECURITY: Ensure authentication state is cleared before closing
            purgeAllAuthState()
            closeVerificationPopup()
          }}
          isLoading={verificationLink === 'loading'}
          // SECURITY: Prevent automatic closing to disable auto-login after verification
          preventAutoClose={true}
        />
      )}
    </div>
  )
}
