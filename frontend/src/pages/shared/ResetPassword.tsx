import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useJWTAuth } from '@/contexts/auth/JWTAuthContext'

// Asset imports
const backgroundImageUrl = '/images/Sasta-YachtShot-H022.jpg'
const logoImageUrl = '/images/Logo-Yachtstory-WHITE.png'

export function ResetPassword() {
  const navigate = useNavigate()
  const location = useLocation()
  const { resetPassword, loading, errors } = useJWTAuth()
  const isLoading = loading.resetPassword
  const authError = errors.resetPassword?.message
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Extract token from URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const tokenParam = params.get('token')
    if (tokenParam) {
      setToken(tokenParam)
    } else {
      setError('Missing reset token. Please use the link from your email.')
    }
  }, [location.search])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!token) {
      setError('Reset token is missing. Please check your reset link.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      // Extract email from token or use a placeholder if needed
      const email = new URLSearchParams(location.search).get('email') || ''
      await resetPassword({ token, email, newPassword: password })
      setSuccess(true)
      // After 3 seconds, redirect to login
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password')
    }
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
      {/* Left side - Form */}
      <div className="w-full md:w-1/2 p-8 flex flex-col justify-center bg-white">
        <div className="max-w-md w-full mx-auto space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-center">Reset Your Password</h2>
            <p className="mt-2 text-sm text-center text-gray-600">
              Please enter a new password for your account.
            </p>
          </div>

          {success ? (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Password reset successful!</h3>
                  <div className="mt-2 text-sm text-green-700">
                    Your password has been reset. You will be redirected to the login page in a few
                    seconds.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#fdba6b] focus:border-[#fdba6b] sm:text-sm"
                  placeholder="Enter your new password"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#fdba6b] focus:border-[#fdba6b] sm:text-sm"
                  placeholder="Confirm your new password"
                />
              </div>

              {(error || authError) && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Reset failed</h3>
                      <div className="mt-2 text-sm text-red-700">{error || authError}</div>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !token}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                  isLoading || !token
                    ? 'bg-[#fdba6b]/70 cursor-not-allowed'
                    : 'bg-[#fdba6b] hover:bg-[#fdba6b]/90'
                }`}
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>

              <div className="text-center">
                <Link to="/login" className="text-sm text-[#fdba6b] hover:text-[#fdba6b]/80">
                  Back to login
                </Link>
              </div>
            </form>
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
            alt="Charter Hub Logo"
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-[288px] w-auto"
          />
        </div>
      </div>
    </div>
  )
}
