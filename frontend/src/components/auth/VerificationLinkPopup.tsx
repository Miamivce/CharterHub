import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

interface VerificationLinkPopupProps {
  link: string
  email: string
  onClose: () => void
  disableAutoVerify?: boolean
  isLoading?: boolean
  preventAutoClose?: boolean
}

// Security helper function to clear authentication tokens
const clearAuthTokens = () => {
  console.log('[SECURITY] Clearing authentication tokens from VerificationLinkPopup')

  // Local/session storage tokens
  localStorage.removeItem('auth_token')
  sessionStorage.removeItem('auth_token')
  sessionStorage.removeItem('jwt_token')
  localStorage.removeItem('jwt_token')

  // Clear cookies related to authentication
  document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  document.cookie = 'jwt_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
}

const VerificationLinkPopup: React.FC<VerificationLinkPopupProps> = ({
  link,
  email,
  onClose,
  disableAutoVerify = false,
  isLoading = false,
  preventAutoClose = false,
}) => {
  const [isCopied, setIsCopied] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean
    message?: string
    error?: string
    rawError?: any
  } | null>(null)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Extract email and clientId from link if needed
  const extractLinkParams = () => {
    // Extract email and client ID from link if needed
    try {
      const url = new URL(link, window.location.origin)
      return {
        email: url.searchParams.get('email'),
        clientId: url.searchParams.get('client'),
      }
    } catch (error) {
      console.error('Invalid URL in link:', error)
      return { email: null, clientId: null }
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(link)
      .then(() => {
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
      })
      .catch((err) => console.error('Failed to copy link:', err))
  }

  // Function to safely parse JSON responses or handle non-JSON responses
  const safeJsonParse = async (response: Response) => {
    const contentType = response.headers.get('content-type')
    console.log('[DEBUG] Verification response content type:', contentType)

    if (contentType && contentType.includes('application/json')) {
      return await response.json()
    } else {
      const text = await response.text()
      console.log('[DEBUG] Non-JSON response received:', text?.substring(0, 200))
      throw new Error('Unexpected response format')
    }
  }

  // Check if we're in development mode
  const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost'

  // Safety function to redirect to login without automatic authentication
  const safeRedirectToLogin = () => {
    // Always clear authentication tokens before redirecting
    clearAuthTokens()

    // Close the popup first
    onClose()

    // Then navigate to login page
    console.log('[DEBUG] Safely redirecting to login page')
    setTimeout(() => {
      navigate('/login')
    }, 100)
  }

  // Auto-verify the account (development only)
  const handleAutoVerify = async () => {
    // SECURITY: Clear any existing auth tokens before verification
    clearAuthTokens()

    if (disableAutoVerify) {
      console.log('[DEBUG] Auto verification skipped: disableAutoVerify is true')
      return
    }

    // Get client ID from link or URL params
    const clientId = searchParams.get('client') || extractLinkParams().clientId

    // Enhanced security: Only proceed if we have email or client ID
    if (!email && !clientId) {
      console.log('[DEBUG] Auto verification skipped: missing both email and client ID')
      setVerificationResult({
        success: false,
        message: 'Verification requires email or client ID',
        error: 'missing_parameters',
      })
      return
    }

    console.log('[DEBUG] Starting auto verification with:', { email, clientId })
    setIsVerifying(true)
    setVerificationResult(null)

    try {
      // First, try to verify using the endpoint
      const apiUrl = import.meta.env.VITE_PHP_API_URL || 'http://localhost:8000'
      console.log(
        '[DEBUG] Sending verification request to:',
        apiUrl + '/auth/dev-verify-account.php'
      )

      // Prepare the request body
      const requestBody: { email?: string; clientId?: string | number } = {}

      // Always prioritize client ID if available
      if (clientId) {
        requestBody.clientId = clientId
      }

      // Include email as a backup
      if (email) {
        requestBody.email = email
      }

      console.log('[DEBUG] Verification request body:', requestBody)

      const response = await fetch(apiUrl + '/auth/dev-verify-account.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(requestBody),
        credentials: 'include',
      })

      console.log('[DEBUG] Verification response status:', response.status)

      // Use the safe JSON parser
      const data = await safeJsonParse(response)
      console.log('[DEBUG] Verification API response:', data)

      // SECURITY: Check if the response includes any token and remove it
      if (data.token) {
        console.log('[SECURITY] Found and removed token from verification response')
        delete data.token
      }

      if (data.success) {
        setVerificationResult({
          success: true,
          message:
            data.message || 'Your account has been verified successfully! You can now log in.',
        })

        // Safety check: Don't redirect if data contains an error indication or verification is already done
        const isAlreadyVerified =
          data.message && data.message.toLowerCase().includes('already verified')
        const hasErrorMessage = data.error_message || data.errorMessage

        // Allow the user to see the success message before redirecting
        if (!preventAutoClose && !hasErrorMessage && !isAlreadyVerified) {
          console.log('[DEBUG] Auto-redirecting to login after verification')
          setTimeout(() => {
            // Always close via the parent component's onClose to ensure proper cleanup
            safeRedirectToLogin()
          }, 1500)
        } else if (isAlreadyVerified) {
          console.log('[DEBUG] Account is already verified, not redirecting automatically')
        } else if (hasErrorMessage) {
          console.log(
            '[DEBUG] Verification has error message, not redirecting automatically:',
            hasErrorMessage
          )
        } else if (preventAutoClose) {
          console.log('[DEBUG] Auto-close prevented by configuration')
        }
      } else {
        // If we got a valid error response from the server
        const errorMessage =
          data.message || 'Failed to verify your account. Please use the verification link instead.'
        console.log('[DEBUG] Verification error:', errorMessage)

        setVerificationResult({
          success: false,
          message: errorMessage,
          error: data.error || 'unknown_error',
          rawError: data,
        })

        // Log detailed error for debugging
        console.error('[DEBUG] Verification error details:', data)
      }
    } catch (error) {
      console.error('[DEBUG] Error during verification:', error)

      // SECURITY: Always clear auth tokens after any error
      clearAuthTokens()

      // Attempt to handle the most common error scenario where the server is returning HTML
      setVerificationResult({
        success: false,
        message:
          'We encountered an issue with automatic verification. Please use the verification link instead.',
        error: error instanceof Error ? error.message : 'unknown_error',
        rawError: error,
      })

      // If the error was a parsing error, try to check if the account is actually verified
      // by making a simple status check request
      if (
        error instanceof SyntaxError ||
        (error instanceof Error && error.message.includes('JSON'))
      ) {
        console.log('[DEBUG] Attempting to check verification status after parse error')
        try {
          const apiUrl = import.meta.env.VITE_PHP_API_URL || 'http://localhost:8000'
          const statusCheckResponse = await fetch(apiUrl + '/auth/check-verification-status.php', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
          })

          // SECURITY: Clear any tokens that might have been set
          clearAuthTokens()

          const statusData = await statusCheckResponse.json()
          console.log('[DEBUG] Verification status check response:', statusData)

          if (statusData.verified) {
            setVerificationResult({
              success: true,
              message: 'Your account has been verified! You can now log in.',
            })

            // Safety: Only auto-redirect if we're certain there are no errors
            if (!preventAutoClose && !statusData.error && !statusData.errorMessage) {
              console.log('[DEBUG] Auto-redirecting to login after verification status check')
              setTimeout(() => {
                safeRedirectToLogin()
              }, 1500)
            } else {
              console.log('[DEBUG] Not auto-redirecting due to error in status check')
            }
          }
        } catch (statusCheckError) {
          console.error('[DEBUG] Failed to check verification status:', statusCheckError)
          // SECURITY: Clear any tokens that might have been set
          clearAuthTokens()
        }
      }
    } finally {
      setIsVerifying(false)
    }
  }

  // Process the verification response data from Register.tsx
  useEffect(() => {
    // Auto-detect dev URL from the link
    const checkForDevUrl = () => {
      try {
        // If we're in development mode and a link is provided
        if (isDevelopment && link && link.includes('verification')) {
          const url = new URL(link, window.location.origin)
          const token = url.searchParams.get('token')

          if (token) {
            console.log('[DEBUG] Found verification token in link:', token)
            // If we have a token and we're in development, construct the dev verification URL
            const apiUrl = import.meta.env.VITE_PHP_API_URL || 'http://localhost:8000'
            const devUrl = `${apiUrl}/auth/dev-verify-account.php`
            console.log('[DEBUG] Using dev verification URL:', devUrl)
            return devUrl
          }
        }
        return null
      } catch (error) {
        console.error('[DEBUG] Error parsing verification link:', error)
        return null
      }
    }

    if (!disableAutoVerify && !isLoading && isDevelopment) {
      const devUrl = checkForDevUrl()
      if (devUrl) {
        console.log('[DEBUG] Starting auto-verification with dev URL')
        handleAutoVerify()
      }
    }
  }, [link, disableAutoVerify, isLoading])

  useEffect(() => {
    // SECURITY: Clear auth tokens when component mounts
    clearAuthTokens()

    // Auto-verify when the component mounts if we have identifying information
    if (email || searchParams.get('client')) {
      handleAutoVerify()
    } else {
      console.log('[DEBUG] Auto verification delayed: waiting for email or client ID')
    }

    // SECURITY: Clean up auth tokens when unmounting
    return () => {
      clearAuthTokens()
    }
  }, [email, searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {isLoading
            ? 'Generating Verification Link...'
            : disableAutoVerify
              ? 'Customer Invitation Link'
              : 'Verify Your Account'}
        </h3>

        {verificationResult ? (
          <div
            className={`mb-4 p-3 rounded ${verificationResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
          >
            <div className="flex">
              <div className="ml-2">
                <p className="font-medium">{verificationResult.message}</p>
                {!verificationResult.success && (
                  <div className="mt-2">
                    <p className="text-sm">
                      Please copy and paste the verification link into your browser, or click the
                      link sent to your email.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {isLoading ? (
              <div className="mb-4 flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <div>
                {!disableAutoVerify && (
                  <div>
                    <p className="text-sm text-gray-500 mb-3">
                      For development purposes, you can verify your email address immediately by
                      clicking the button below:
                    </p>

                    <button
                      onClick={handleAutoVerify}
                      disabled={isVerifying}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded mb-4 disabled:bg-blue-300"
                    >
                      {isVerifying ? (
                        <span className="flex justify-center items-center">
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                          Verifying...
                        </span>
                      ) : (
                        'Verify Now'
                      )}
                    </button>

                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <p className="text-sm text-gray-500 mb-2">
                        Alternatively, click this verification link:
                      </p>
                    </div>
                  </div>
                )}

                {disableAutoVerify && (
                  <p className="text-sm text-gray-500 mb-3">
                    Send this invitation link to your customer so they can complete registration:
                  </p>
                )}

                <div className="flex items-center bg-gray-100 p-2 rounded mb-4">
                  <div className="flex-1 overflow-auto break-all">
                    <code className="text-xs">{link}</code>
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="ml-2 p-1 text-blue-600 hover:text-blue-800"
                  >
                    {isCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>

                <p className="text-xs text-gray-500">
                  {disableAutoVerify
                    ? 'The customer will be able to use this link to access the registration form with pre-filled information.'
                    : "If you're having trouble with the verification, please contact support."}
                </p>
              </div>
            )}
          </>
        )}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => {
              // SECURITY: Clear tokens before closing
              clearAuthTokens()
              onClose()
            }}
            className="px-4 py-2 bg-[#fdba6b] text-white rounded-md hover:bg-[#fdba6b]/90"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default VerificationLinkPopup
