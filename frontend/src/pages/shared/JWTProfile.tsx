import React, { useState, useEffect } from 'react'
import { useJWTAuth } from '@/contexts/auth/JWTAuthContext'
import { User } from '@/services/jwtApi'

export const JWTProfile: React.FC = () => {
  const { user, updateProfile, refreshUser, isLoading, error } = useJWTAuth()
  const [formData, setFormData] = useState<Partial<User>>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    company: '',
  })
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Initialize form with user data when available
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        company: user.company || '',
      })
    }
  }, [user])

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMessage(null)

    try {
      // Only send changed fields
      const changes: Partial<User> = {}

      if (user) {
        Object.keys(formData).forEach((key) => {
          const k = key as keyof typeof formData
          // Check if the field is defined in both objects and has changed
          if (
            formData[k] !== undefined &&
            user[k as keyof User] !== undefined &&
            formData[k] !== user[k as keyof User]
          ) {
            // The type assertion is safe here because we've checked that the key exists in formData
            changes[k as keyof User] = formData[k] as any
          }
        })
      }

      // If nothing changed, don't submit
      if (Object.keys(changes).length === 0) {
        setSuccessMessage('No changes to save')
        return
      }

      // Update profile with changes
      await updateProfile(changes)

      // Show success message
      setSuccessMessage('Profile updated successfully')

      // Refresh user data after a short delay
      setTimeout(() => {
        refreshUser()
      }, 1000)
    } catch (error) {
      console.error('Profile update failed:', error)
      // Error is already handled by the auth context
    }
  }

  // Get updated user data
  const handleRefresh = async () => {
    await refreshUser()
    setSuccessMessage('Profile data refreshed')
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">User Profile</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Update your personal information</p>
        </div>

        {/* Success message */}
        {successMessage && (
          <div className="rounded-md bg-green-50 p-4 mx-6 mb-4">
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
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="rounded-md bg-red-50 p-4 mx-6 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  xmlns="http://www.w3.org/2000/svg"
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
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-gray-200">
          <form onSubmit={handleSubmit}>
            <dl>
              {/* First Name */}
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">First name</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm"
                    disabled={isLoading}
                  />
                </dd>
              </div>

              {/* Last Name */}
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Last name</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm"
                    disabled={isLoading}
                  />
                </dd>
              </div>

              {/* Email */}
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Email address</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm"
                    disabled={isLoading}
                  />
                  {formData.email !== user?.email && (
                    <p className="mt-1 text-xs text-amber-600">
                      Changing your email will require you to re-login
                    </p>
                  )}
                </dd>
              </div>

              {/* Phone Number */}
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Phone number</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm"
                    disabled={isLoading}
                  />
                </dd>
              </div>

              {/* Company */}
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Company</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm"
                    disabled={isLoading}
                  />
                </dd>
              </div>

              {/* Role */}
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Role</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {user?.role || 'Loading...'}
                  </span>
                </dd>
              </div>

              {/* Buttons */}
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500"></dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex space-x-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                      isLoading
                        ? 'bg-blue-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    }`}
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>

                  <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Refresh Data
                  </button>
                </dd>
              </div>
            </dl>
          </form>
        </div>
      </div>
    </div>
  )
}
