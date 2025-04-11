import { useState, useEffect, useCallback, useRef } from 'react'
import { useJWTAuth } from '@/contexts/auth/JWTAuthContext'
import { useDocument } from '@/contexts/document/DocumentContext'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/Card'
import { User, UserProfileUpdateData } from '@/services/jwtApi'
import { toast } from '@/components/ui/use-toast'
import { PencilIcon, XMarkIcon, IdentificationIcon } from '@heroicons/react/24/outline'
import { ChangePasswordModal } from '@/components/auth/ChangePasswordModal'

// Form data structure for profile
interface ProfileFormData {
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  company: string
}

// Debug function for logging profile state
const debugLog = (message: string, context = 'Profile') => {
  console.log(`[${context}] ${message}`)
}

// Profile Component
export function Profile() {
  const { user, updateProfile, refreshUserData, loading } = useJWTAuth()
  const { documents } = useDocument()
  const navigate = useNavigate()
  const formRef = useRef<HTMLFormElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [userVersion, setUserVersion] = useState<number>(Date.now())
  const [displayKey, setDisplayKey] = useState<number>(Date.now())
  const [isChangePasswordModalOpen, setChangePasswordModalOpen] = useState(false)
  const didRefreshUserEffect = useRef(false)
  const didInitialRefreshRef = useRef(false)

  // Track component mount status
  const isMounted = useRef(true)

  // Create a local cached version of the user data
  const [localUser, setLocalUser] = useState<User | null>(null)

  // Form data state
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    company: user?.company || '',
  })

  // Check if the user has a passport document
  const hasPassport = documents?.some((doc) => doc.category === 'passport_details') || false

  // Initialize form on mount and update when user changes
  useEffect(() => {
    if (user) {
      debugLog(`Setting form data from user object - timestamp: ${user._timestamp}`)

      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        company: user.company || '',
      })

      // Update the local user cache for later comparison
      setLocalUser(user)

      // Force a display refresh
      setUserVersion(user._timestamp || Date.now())
    }
  }, [user?._timestamp]) // Depend directly on the timestamp to detect changes

  // Perform initial refresh of user data on load
  useEffect(() => {
    // Use a ref to make sure we only run this once
    if (!didInitialRefreshRef.current) {
      didInitialRefreshRef.current = true
      
      // Create an AbortController to cancel requests if the component unmounts
      const abortController = new AbortController();

      const doInitialRefresh = async () => {
        try {
          debugLog('Performing initial user data refresh')
          const refreshedUser = await refreshUserData()
          debugLog(`Initial refresh successful, timestamp: ${refreshedUser?._timestamp}`)
        } catch (error) {
          // Ignore canceled requests during unmount/navigation
          if (error instanceof Error && 
             (error.name === 'CanceledError' || 
              error.message === 'canceled' || 
              error.name === 'AbortError' ||
              (error.name.includes('ApiError') && error.message === 'canceled'))) {
            debugLog('API request was canceled during navigation - this is normal')
            return;
          }
          
          debugLog(
            `Error during initial refresh: ${error instanceof Error ? error.message : String(error)}`
          )
          console.error('Error refreshing user data on mount:', error)
        }
      }

      doInitialRefresh()
    }

    // Cleanup function
    return () => {
      debugLog('Profile component unmounting')
    }
  }, [refreshUserData])

  // Add an effect to warn user about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isEditing) {
        const message = 'You have unsaved changes. Are you sure you want to leave?'
        e.returnValue = message
        return message
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isEditing])

  // Toggle edit mode
  const handleEditToggle = () => {
    debugLog(`Toggle edit mode from ${isEditing} to ${!isEditing}`)

    if (isEditing) {
      // If canceling edit, reset form data to current user data
      if (user) {
        debugLog('Canceling edit, resetting form data to user data')
        setFormData({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phoneNumber: user.phoneNumber || '',
          company: user.company || '',
        })
      }
    } else {
      // Entering edit mode, ensure form data is up to date
      if (user) {
        debugLog('Entering edit mode, ensuring form data matches user data')
        setFormData({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phoneNumber: user.phoneNumber || '',
          company: user.company || '',
        })
      }
    }

    setIsEditing(!isEditing)
    setErrorMessage(null)
  }

  // Handle form field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    setFormData({
      ...formData,
      [name]: value,
    })

    // Clear error when user types
    if (errorMessage) {
      setErrorMessage(null)
    }
  }

  // Handle profile form submission
  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    debugLog('✅ Form submission started')

    try {
      setIsSaving(true)

      // Validate form
      const errors: Record<string, string> = {}

      if (!formData.firstName.trim()) {
        errors.firstName = 'First name is required'
      }

      if (!formData.lastName.trim()) {
        errors.lastName = 'Last name is required'
      }

      if (!formData.email.trim()) {
        errors.email = 'Email is required'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Please enter a valid email address'
      }

      if (Object.keys(errors).length > 0) {
        setErrorMessage(errors.email || errors.firstName || errors.lastName)
        setIsSaving(false)
        return
      }

      // If email is being changed, use the original email from user object
      // Email changes require special verification flow handled elsewhere
      if (user && formData.email !== user.email) {
        debugLog(`Email change attempted: ${user.email} -> ${formData.email}`)
        formData.email = user.email
        toast({
          title: 'Email changes not allowed',
          description: 'Email changes require additional verification. Please contact support.',
          variant: 'destructive',
        })
      }

      // Create profile update data object
      const profileData: UserProfileUpdateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber || '',
        company: formData.company || '',
      }

      debugLog('Submitting profile update: ' + JSON.stringify(profileData))

      // IMPORTANT: Pre-emptively update local user state to show updates immediately
      if (localUser) {
        const updatedLocalUser = {
          ...localUser,
          ...profileData,
          _timestamp: Date.now(), // Add timestamp to ensure UI updates
          _lastUpdated: Date.now(),
        }
        setLocalUser(updatedLocalUser)
        setUserVersion(updatedLocalUser._timestamp)
        debugLog('Pre-emptively updated local user for better UX')
      }

      // Show a temporary success message immediately for better UX
      toast({
        title: 'Profile updating...',
        description: 'Your changes have been submitted.',
        variant: 'default',
      })

      try {
        // Make the API call to update profile
        const updatedUser = await updateProfile(profileData)

        debugLog(
          '🎉 Profile update successful - received user: ' +
            JSON.stringify({
              firstName: updatedUser.firstName,
              lastName: updatedUser.lastName,
              timestamp: updatedUser._timestamp,
            })
        )

        // Explicitly update local state with the updated user data
        setLocalUser(updatedUser)

        // Exit edit mode
        setIsEditing(false)

        // Update the UI version number to trigger re-renders
        setUserVersion(updatedUser._timestamp || Date.now())

        // Show success message
        toast({
          title: 'Profile updated',
          description: 'Your profile information has been successfully updated.',
          variant: 'default',
        })

        // Force a refresh to ensure the updated data propagates to other components
        try {
          // Wait for the refresh to complete and capture the result
          debugLog('Forcing refresh of user data from server')
          const refreshedUser = await refreshUserData()

          if (refreshedUser) {
            // Apply the refreshed user data to local state to ensure UI consistency
            debugLog(`✅ Applying refreshed user data - timestamp: ${refreshedUser._timestamp}`)
            setLocalUser(refreshedUser)
            setUserVersion(refreshedUser._timestamp || Date.now())

            // Update form data from refreshed user
            setFormData({
              firstName: refreshedUser.firstName,
              lastName: refreshedUser.lastName,
              email: refreshedUser.email,
              phoneNumber: refreshedUser.phoneNumber || '',
              company: refreshedUser.company || '',
            })
          } else {
            debugLog('⚠️ refreshUserData completed but returned no user data')
          }
        } catch (refreshError) {
          debugLog('⚠️ Error refreshing user data after update: ' + String(refreshError))
          console.error('Error refreshing user data after update:', refreshError)

          // Even if refresh fails, still try to apply the updated user data we got from the update call
          toast({
            title: 'Profile updated',
            description:
              'Your profile was updated but other parts of the app may need a refresh to show changes.',
            variant: 'default',
          })
        }
      } catch (updateError) {
        debugLog('⚠️ Error updating profile: ' + String(updateError))
        console.error('Error updating profile:', updateError)

        // Show error toast
        toast({
          title: 'Update failed',
          description: updateError instanceof Error ? updateError.message : String(updateError),
          variant: 'destructive',
        })

        // Attempt to refresh user data even after error to keep UI in sync
        try {
          await refreshUserData()
        } catch (e) {
          // Ignore errors in this fallback refresh
        }
      }
    } catch (error) {
      debugLog(
        '⚠️ Error handling profile update: ' +
          (error instanceof Error ? error.message : String(error))
      )
      console.error('Error handling profile update:', error)

      let errorMessage = 'An unexpected error occurred. Please try again later.'

      if (error instanceof Error) {
        errorMessage = error.message
      }

      toast({
        title: 'Update failed',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle opening the change password modal
  const handleOpenChangePasswordModal = () => {
    setChangePasswordModalOpen(true)
  }

  // Handle closing the change password modal
  const handleCloseChangePasswordModal = () => {
    setChangePasswordModalOpen(false)
  }

  // Function to get user's initials for avatar
  const getUserInitials = useCallback(() => {
    // First try to use the local form data which is immediately updated
    if (formData.firstName && formData.lastName) {
      return `${formData.firstName[0]}${formData.lastName[0]}`.toUpperCase()
    }

    // Then try the local user cache which may have been updated
    if (localUser?.firstName && localUser?.lastName) {
      return `${localUser.firstName[0]}${localUser.lastName[0]}`.toUpperCase()
    }

    // Fall back to the user object from context
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    }

    return 'U'
  }, [formData, localUser, user])

  return (
    <div className="space-y-6 profile-container">
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Profile Information</h2>
            {!isEditing ? (
              <Button
                onClick={handleEditToggle}
                variant="secondary"
                className="flex items-center space-x-1 text-sm"
              >
                <PencilIcon className="h-4 w-4" />
                <span>Edit</span>
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button
                  onClick={handleEditToggle}
                  variant="secondary"
                  className="flex items-center space-x-1 text-sm"
                  type="button"
                >
                  <XMarkIcon className="h-4 w-4" />
                  <span>Cancel</span>
                </Button>
                <Button
                  type="submit"
                  form="profile-form"
                  className="w-full md:w-auto"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : null}
                  Save
                </Button>
              </div>
            )}
          </div>

          {errorMessage && (
            <div className="mb-4 p-2 bg-red-50 border border-red-100 text-red-600 text-sm rounded">
              {errorMessage}
            </div>
          )}

          <div className="space-y-4">
            {isEditing ? (
              <form
                id="profile-form"
                ref={formRef}
                onSubmit={handleSaveProfile}
                className="space-y-4 w-full"
                noValidate
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                  <Input
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  disabled={true}
                  required
                />
                <p className="text-xs text-gray-500 -mt-3 mb-3">
                  Email cannot be changed. Please contact support for assistance.
                </p>
                <Input
                  label="Phone Number"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                />
                <Input
                  label="Company"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                />
              </form>
            ) : (
              <div key={displayKey} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">First Name</label>
                  <p className="mt-1">{localUser?.firstName || user?.firstName}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">Last Name</label>
                  <p className="mt-1">{localUser?.lastName || user?.lastName}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="mt-1">{localUser?.email || user?.email}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">Phone Number</label>
                  <p className="mt-1">
                    {localUser?.phoneNumber || user?.phoneNumber || 'Not provided'}
                  </p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Company</label>
                  <p className="mt-1">{localUser?.company || user?.company || 'Not provided'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Account Security</h2>
          <Button
            variant="secondary"
            className="text-sm"
            type="button"
            onClick={handleOpenChangePasswordModal}
          >
            Change Password
          </Button>
        </div>
      </Card>

      {/* Passport Document Card */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Passport Document</h2>
            <Button
              onClick={() => navigate('/client/documents')}
              variant="secondary"
              className="flex items-center space-x-1 text-sm"
              type="button"
            >
              {hasPassport ? (
                <>
                  <IdentificationIcon className="h-4 w-4" />
                  <span>View Documents</span>
                </>
              ) : (
                <>
                  <PencilIcon className="h-4 w-4" />
                  <span>Upload Passport</span>
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-full ${hasPassport ? 'bg-green-100' : 'bg-gray-100'}`}>
              <IdentificationIcon
                className={`h-6 w-6 ${hasPassport ? 'text-green-600' : 'text-gray-400'}`}
              />
            </div>
            <div>
              <p className="font-medium">
                {hasPassport ? 'Passport Uploaded' : 'No Passport Document'}
              </p>
              <p className="text-sm text-gray-500">
                {hasPassport
                  ? 'Your passport document has been uploaded to our system'
                  : 'Please upload your passport document for verification'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Add the change password modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={handleCloseChangePasswordModal}
      />
    </div>
  )
}
