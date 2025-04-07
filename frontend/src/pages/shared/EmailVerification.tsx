import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import wpApi from '../../services/wpApi'

// Asset imports
const backgroundImageUrl = '/images/Sasta-YachtShot-H022.jpg'
const logoImageUrl = '/images/Logo-Yachtstory-WHITE.png'

export function EmailVerification() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(true)
  const [isRetrying, setIsRetrying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [verificationDetails, setVerificationDetails] = useState<{
    token: string
    email: string | null
  }>({
    token: '',
    email: null,
  })

  useEffect(() => {
    // Parse URL parameters
    const searchParams = new URLSearchParams(location.search)
    const token = searchParams.get('token')
    const email = searchParams.get('email')

    console.log('[EmailVerification] Parameters:', { token, email })

    if (!token) {
      console.error('[EmailVerification] Token not found in URL parameters')
      setError('Missing verification token. Please use the link from your email.')
      setIsLoading(false)
      return
    }

    // Store token and email in state
    setVerificationDetails({
      token: token,
      email: email,
    })

    // Only proceed with verification if we have a token
    verifyEmail(token, email)
  }, [location.search])

  const handleRetry = () => {
    setIsRetrying(true)
    setError(null)
    verifyEmail(verificationDetails.token, verificationDetails.email).finally(() =>
      setIsRetrying(false)
    )
  }

  async function verifyEmail(token: string, email: string | null) {
    try {
      console.log('[EmailVerification] Verifying email with:', { token, email })

      if (!token) {
        console.error('[EmailVerification] Token is missing or empty')
        throw new Error('Verification token is missing')
      }

      // Call the API to verify the email
      console.log('[EmailVerification] Calling verifyEmail with:', { token, email })

      // Make the API call with both parameters for more reliable verification
      const response = await wpApi.verifyEmail(token, email || undefined)
      console.log('[EmailVerification] Verification response:', response)

      if (response.success) {
        setSuccess(true)
        // After 3 seconds, redirect to login
        setTimeout(() => {
          navigate('/login', { replace: true })
        }, 3000)
      } else {
        throw new Error(response.message || 'Failed to verify email')
      }
    } catch (err) {
      console.error('[EmailVerification] Verification error:', err)
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to verify email. Please try again or contact support.'

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || isRetrying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#fdba6b]"></div>
          <span className="mt-4 text-gray-700">
            {isRetrying ? 'Retrying verification...' : 'Verifying your email...'}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Content */}
      <div className="w-full md:w-1/2 p-8 flex flex-col justify-center bg-white">
        <div className="max-w-md w-full mx-auto space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-center">Email Verification</h2>
          </div>

          {success ? (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Email verified successfully!
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    Your email has been verified. You will be redirected to the login page in a few
                    seconds.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Verification failed</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">
                      Please make sure you're using the exact verification link from your email. If
                      you continue to have issues, you can:
                    </p>
                    <ul className="mt-2 text-sm text-gray-600 list-disc pl-5">
                      <li>Try again later</li>
                      <li>Request a new verification email</li>
                      <li>Contact support</li>
                    </ul>

                    <div className="mt-4">
                      <button
                        onClick={handleRetry}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        disabled={isRetrying}
                      >
                        {isRetrying ? 'Retrying...' : 'Try Again'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="text-center">
            <Link to="/login" className="text-sm text-[#fdba6b] hover:text-[#fdba6b]/80">
              Back to login
            </Link>
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
    </div>
  )
}
