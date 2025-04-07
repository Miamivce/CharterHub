import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useJWTAuth } from '@/contexts/auth/JWTAuthContext'

// Asset imports
const backgroundImageUrl = '/images/Sásta © YachtShot H022.JPG'
const logoImageUrl = '/images/Logo Yachtstory WHITE.png'

export function ForgotPassword() {
  const { forgotPassword, loading, errors } = useJWTAuth()
  const isLoading = loading.forgotPassword
  const authError = errors.forgotPassword?.message
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    try {
      await forgotPassword(email)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email')
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
            <h2 className="text-2xl font-bold text-center">Reset your password</h2>
            <p className="mt-2 text-sm text-center text-gray-600">
              Enter your email address and we'll send you instructions to reset your password.
            </p>
          </div>

          {success ? (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Reset email sent</h3>
                  <div className="mt-2 text-sm text-green-700">
                    Please check your email for instructions to reset your password.
                  </div>
                </div>
              </div>
            </div>
          ) : (
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#fdba6b] focus:border-[#fdba6b] sm:text-sm"
                  placeholder="Enter your email"
                />
              </div>

              {(error || authError) && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Request failed</h3>
                      <div className="mt-2 text-sm text-red-700">{error || authError}</div>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                  isLoading
                    ? 'bg-[#fdba6b]/70 cursor-not-allowed'
                    : 'bg-[#fdba6b] hover:bg-[#fdba6b]/90'
                }`}
              >
                {isLoading ? 'Sending...' : 'Send reset instructions'}
              </button>

              <div className="text-sm text-center">
                <Link to="/login" className="font-medium text-[#fdba6b] hover:text-[#fdba6b]/80">
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
