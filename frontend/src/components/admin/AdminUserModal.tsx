import { useState, useEffect } from 'react'
import { User } from '@/contexts/types'
import { CheckIcon } from '@heroicons/react/24/outline'
import { AdminUser } from '@/services/adminService'
import { useJWTAuth } from '@/contexts/auth/JWTAuthContext'

interface AdminUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: AdminUserFormData) => Promise<void>
  initialData?: AdminUser | User
  isEditing?: boolean
}

export interface AdminUserFormData {
  firstName: string
  lastName: string
  email: string
  password?: string
  phone?: string
  role: string
  creatorPassword?: string
  username?: string
}

export function AdminUserModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditing = false,
}: AdminUserModalProps) {
  const { user } = useJWTAuth()
  const [formData, setFormData] = useState<AdminUserFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    role: 'admin',
    creatorPassword: '',
    username: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (initialData) {
      setFormData({
        firstName: initialData.firstName || '',
        lastName: initialData.lastName || '',
        email: initialData.email || '',
        password: '', // Don't populate password field
        phone: 'phone' in initialData ? initialData.phone : '',
        role: 'admin',
        creatorPassword: '', // Always reset creator password
        username: initialData.username || '',
      })
    } else {
      // Reset form for new user
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        role: 'admin',
        creatorPassword: '',
        username: '',
      })
    }
    setErrors({})
    setShowSuccess(false)
  }, [initialData, isOpen])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!isEditing && !formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    // Require creator password for creating a new admin, but not when editing
    if (!isEditing && !formData.creatorPassword) {
      newErrors.creatorPassword = 'Please enter your password to verify this action'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      console.log('AdminUserModal: Form validation failed', errors)
      return
    }

    try {
      setIsLoading(true)

      // Create submission data (only include password if provided or for new users)
      const submissionData = {
        ...formData,
        role: 'admin', // Ensure role is set to admin
        creatorEmail: user?.email, // Include creator's email for verification
      }

      // Remove empty password for editing if not provided
      if (isEditing && !formData.password) {
        delete submissionData.password
      }

      // If username is empty, set it to undefined so backend will generate one
      if (!submissionData.username || !submissionData.username.trim()) {
        submissionData.username = undefined
      }

      console.log(
        `AdminUserModal: Submitting ${isEditing ? 'edit' : 'create'} form with data:`,
        submissionData
      )

      await onSubmit(submissionData)
      console.log('AdminUserModal: Form submitted successfully')
      setShowSuccess(true)

      // Auto-close for edit mode
      if (isEditing) {
        setTimeout(() => {
          onClose()
          setShowSuccess(false)
        }, 1500)
      } else {
        // For create mode, reset the form but leave modal open for potential additional users
        setFormData({
          ...formData,
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          phone: '',
          creatorPassword: '',
          username: '',
        })
      }
    } catch (err) {
      console.error('AdminUserModal: Error submitting form:', err)
      if (err instanceof Error) {
        setErrors({ form: err.message })
      } else {
        setErrors({ form: 'An unknown error occurred' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleReset = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      role: 'admin',
      creatorPassword: '',
    })
    setErrors({})
    setShowSuccess(false)
  }

  const handleCloseModal = () => {
    handleReset()
    onClose()
  }

  // For successful creation
  if (showSuccess && !isEditing) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-md w-full">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Admin User Created Successfully
          </h3>
          <div className="p-4 bg-green-50 border border-green-100 rounded-md text-green-700 mb-4">
            <p className="flex items-center">
              <CheckIcon className="h-5 w-5 mr-2" />
              <span>New admin user has been created successfully!</span>
            </p>
          </div>
          <div className="flex justify-end">
            <button className="px-4 py-2 bg-primary text-white rounded-md" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <form onSubmit={handleSubmit}>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {isEditing ? 'Edit Admin User' : 'Create Admin User'}
              </h3>

              <div className="space-y-4">
                {errors.form && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-md text-red-700 text-sm">
                    {errors.form}
                  </div>
                )}

                {showSuccess && (
                  <div className="p-3 bg-green-50 border border-green-100 rounded-md text-green-700 text-sm">
                    {isEditing
                      ? 'User updated successfully!'
                      : 'New admin user created successfully!'}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      className={`w-full px-3 py-2 border rounded-md ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                      value={formData.firstName}
                      onChange={handleChange}
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      className={`w-full px-3 py-2 border rounded-md ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                      value={formData.lastName}
                      onChange={handleChange}
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className={`w-full px-3 py-2 border rounded-md ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                    value={formData.email}
                    onChange={handleChange}
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className={`w-full px-3 py-2 border rounded-md ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                    value={formData.phone || ''}
                    onChange={handleChange}
                  />
                  {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {isEditing ? 'New Password (leave blank to keep current)' : 'Password'}
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    className={`w-full px-3 py-2 border rounded-md ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                    value={formData.password || ''}
                    onChange={handleChange}
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                </div>

                {!isEditing && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
                    <h4 className="text-sm font-medium text-blue-700 mb-2">
                      Admin Creation Verification
                    </h4>
                    <p className="text-xs text-blue-600 mb-3">
                      To verify your identity and create a new admin user, please enter your current
                      password:
                    </p>
                    <div>
                      <label
                        htmlFor="creatorPassword"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Your Password
                      </label>
                      <input
                        type="password"
                        id="creatorPassword"
                        name="creatorPassword"
                        className={`w-full px-3 py-2 border rounded-md ${errors.creatorPassword ? 'border-red-500' : 'border-gray-300'}`}
                        value={formData.creatorPassword}
                        onChange={handleChange}
                      />
                      {errors.creatorPassword && (
                        <p className="mt-1 text-sm text-red-600">{errors.creatorPassword}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={handleCloseModal}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : isEditing ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
