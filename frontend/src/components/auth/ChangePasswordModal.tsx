import React, { useState, useEffect } from 'react'
import { useJWTAuth } from '@/contexts/auth/JWTAuthContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/shared'
import { Input } from '@/components/shared'
import { toast } from '@/components/ui/use-toast'
import {
  XMarkIcon,
  CheckIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

interface ChangePasswordModalProps {
  isOpen: boolean
  onClose: () => void
}

interface PasswordForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// Password requirements
const passwordRequirements = [
  {
    id: 'length',
    label: 'At least 8 characters',
    validator: (password: string) => password.length >= 8,
  },
  {
    id: 'uppercase',
    label: 'Contains uppercase letter',
    validator: (password: string) => /[A-Z]/.test(password),
  },
  {
    id: 'lowercase',
    label: 'Contains lowercase letter',
    validator: (password: string) => /[a-z]/.test(password),
  },
  {
    id: 'number',
    label: 'Contains a number',
    validator: (password: string) => /\d/.test(password),
  },
  {
    id: 'special',
    label: 'Contains a special character',
    validator: (password: string) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
  },
]

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const { changePassword, loading } = useJWTAuth()
  const [formData, setFormData] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Partial<PasswordForm>>({})
  const [validationResults, setValidationResults] = useState<{ [key: string]: boolean }>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState<boolean>(false)
  const isLoading = loading?.changePassword || false

  // Reset the form state when the modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Initialize form when modal opens
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setErrors({})
      setGeneralError(null)
      setHasAttemptedSubmit(false)

      // Initialize validation results
      const initialResults = passwordRequirements.reduce(
        (acc, req) => {
          acc[req.id] = false
          return acc
        },
        {} as { [key: string]: boolean }
      )
      setValidationResults(initialResults)
    }
  }, [isOpen])

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Only clear field-specific errors when editing that field
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }))
    }

    // Validate new password in real-time
    if (name === 'newPassword') {
      const results = passwordRequirements.reduce(
        (acc, req) => {
          acc[req.id] = req.validator(value)
          return acc
        },
        {} as { [key: string]: boolean }
      )

      setValidationResults(results)
    }

    // Check password match when confirm password is changed
    if (name === 'confirmPassword' && formData.newPassword !== value) {
      // Always show password mismatch error, regardless of submission status
      setErrors((prev) => ({
        ...prev,
        confirmPassword: 'Passwords do not match',
      }))
    } else if (name === 'confirmPassword') {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: undefined,
      }))
    }
  }

  // Validate the entire form
  const validateForm = (): boolean => {
    const newErrors: Partial<PasswordForm> = {}

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required'
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required'
    } else {
      // Check if all password requirements are met
      const allRequirementsMet = passwordRequirements.every((req) =>
        req.validator(formData.newPassword)
      )
      if (!allRequirementsMet) {
        newErrors.newPassword = 'Password does not meet all requirements'
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password'
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)

    // Return true if no errors
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (isLoading) return

    // Mark that the user has attempted to submit the form
    setHasAttemptedSubmit(true)

    // Clear any previous general error
    setGeneralError(null)

    // Validate form
    if (!validateForm()) {
      return
    }

    try {
      await changePassword(formData.currentPassword, formData.newPassword)

      // Show success message
      toast({
        title: 'Password updated',
        description: 'Your password has been successfully changed.',
        variant: 'default',
      })

      // Reset form and close modal
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      onClose()
    } catch (error) {
      console.error('Error changing password:', error)

      // Check if it's an authentication error (likely incorrect current password)
      if (error instanceof Error) {
        // Look for common error messages related to incorrect password
        const errorMsg = error.message.toLowerCase()
        const isCurrentPasswordError =
          errorMsg.includes('current password') ||
          errorMsg.includes('incorrect password') ||
          errorMsg.includes('invalid password') ||
          errorMsg.includes('wrong password') ||
          errorMsg.includes('authentication failed') ||
          errorMsg.includes('unauthorized')

        // Check for server implementation issues
        const isServerImplementationError =
          errorMsg.includes('server error') ||
          errorMsg.includes('implementation issue') ||
          errorMsg.includes('contact support')

        if (isCurrentPasswordError) {
          // Set a field-specific error for incorrect password
          setErrors({
            ...errors,
            currentPassword: 'Current password is incorrect',
          })
          // Clear the current password field for better UX
          setFormData((prev) => ({
            ...prev,
            currentPassword: '',
          }))

          // Instead of displaying the full error banner, just show a toast
          toast({
            title: 'Incorrect Password',
            description: 'The current password you entered is incorrect.',
            variant: 'destructive',
          })
        } else if (isServerImplementationError) {
          // For server implementation issues, show a specific error
          setGeneralError(
            'The password change feature is currently unavailable due to a server configuration issue. Our team has been notified and is working on a fix.'
          )

          // Also show a toast for immediate feedback
          toast({
            title: 'Server Error',
            description:
              'The password change feature is currently unavailable. Please try again later.',
            variant: 'destructive',
          })
        } else {
          // For other errors, set a general error message that persists
          setGeneralError(
            'There was a problem changing your password. The server returned an error.'
          )

          // Also show a toast for immediate feedback
          toast({
            title: 'Password change failed',
            description: 'There was a problem with the password change. Please try again later.',
            variant: 'destructive',
          })
        }
      } else {
        // For unknown errors, set a general error message
        setGeneralError('An unexpected error occurred. Please try again later.')

        toast({
          title: 'Password change failed',
          description: 'An unexpected error occurred. Please try again later.',
          variant: 'destructive',
        })
      }

      // Do NOT close the modal on error - let the user try again
    }
  }

  // Handle modal close - reset form
  const handleClose = () => {
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
    setErrors({})
    setGeneralError(null)
    setHasAttemptedSubmit(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Change Password</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* General backend error message - this persists until form submission */}
          {generalError && (
            <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-700">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
                <span className="font-medium">Server Error</span>
              </div>
              <p className="mt-1 text-sm">{generalError}</p>
              <p className="mt-2 text-xs">
                Please try again later or contact support if the problem persists.
              </p>
            </div>
          )}

          {/* Form validation errors - only show after first submission attempt */}
          {hasAttemptedSubmit &&
            Object.keys(errors).length > 0 &&
            errors.currentPassword !== 'Current password is incorrect' && (
              <div className="p-3 rounded-md bg-red-50 border border-red-100 text-red-600 text-sm">
                <p className="font-medium">Please correct the following errors:</p>
                <ul className="mt-1 list-disc list-inside">
                  {Object.entries(errors).map(
                    ([field, message]) =>
                      message && field !== 'currentPassword' && <li key={field}>{message}</li>
                  )}
                </ul>
              </div>
            )}

          <Input
            label="Current Password"
            name="currentPassword"
            type="password"
            value={formData.currentPassword}
            onChange={handleInputChange}
            error={errors.currentPassword}
            required
            autoComplete="current-password"
          />

          <Input
            label="New Password"
            name="newPassword"
            type="password"
            value={formData.newPassword}
            onChange={handleInputChange}
            error={hasAttemptedSubmit ? errors.newPassword : undefined}
            required
            autoComplete="new-password"
          />

          {/* Password requirements */}
          {formData.newPassword.length > 0 && (
            <div className="rounded-md bg-gray-50 p-3 text-sm">
              <h3 className="font-medium mb-2">Password requirements:</h3>
              <ul className="space-y-1">
                {passwordRequirements.map((req) => (
                  <li key={req.id} className="flex items-center">
                    {validationResults[req.id] ? (
                      <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    ) : (
                      <XCircleIcon className="h-4 w-4 text-red-500 mr-2" />
                    )}
                    <span
                      className={validationResults[req.id] ? 'text-green-700' : 'text-gray-700'}
                    >
                      {req.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Input
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            error={hasAttemptedSubmit ? errors.confirmPassword : undefined}
            required
            autoComplete="new-password"
          />

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="secondary" onClick={handleClose} disabled={isLoading} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isLoading} className="min-w-[100px]">
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                'Change Password'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
