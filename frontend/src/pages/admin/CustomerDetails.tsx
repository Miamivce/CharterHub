import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CustomerWithStats, ClientUser, BookingWithDetails } from '@/contexts/types'
import { customerService } from '@/services/customerService'
import { bookingService } from '@/services/bookingService'
import { useDocument } from '@/contexts/document/DocumentContext'
import { Card, Button, Modal, ModalHeader, ModalTitle, ModalContent } from '@/components/shared'
import {
  CreateCustomerModal,
  CUSTOMER_UPDATED_EVENT,
  CustomerModalResult,
} from '@/components/customer/CreateCustomerModal'
import { DocumentSearchModal } from '@/components/shared/DocumentSearchModal'
import { PassportViewerModal } from '@/components/shared/PassportViewerModal'
import { Document } from '@/types/document'
import {
  ArrowLeftIcon,
  PencilIcon,
  DocumentIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  EnvelopeIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  IdentificationIcon,
  UserCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

// Extend the customer service with the attachPassport method
declare module '@/services/customerService' {
  interface CustomerService {
    attachPassport(customerId: string, documentId: string): Promise<boolean>
  }
}

interface CustomerWithPassport extends CustomerWithStats {
  passportDocumentId?: string
  selfRegistered?: boolean
  registrationDate?: string
  created_at?: string
  hasCompletedInvitation?: boolean
}

interface CustomerBooking extends BookingWithDetails {
  role: 'main_charterer' | 'guest'
}

// Extended document type for internal use
interface ExtendedDocument extends Document {
  displayName?: string
}

// Define props for the components we're using
interface DocumentSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (document: Document) => Promise<void>
  filter?: (doc: Document) => boolean
  title?: string
}

export function CustomerDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { documents } = useDocument()
  const [customer, setCustomer] = useState<CustomerWithPassport | null>(null)
  const [bookings, setBookings] = useState<CustomerBooking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [showPassportModal, setShowPassportModal] = useState(false)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [notesValue, setNotesValue] = useState<string>('')
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  // Add state for confirmation modal
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    title: string
    message: string
    confirmLabel: string
    cancelLabel: string
    onConfirm: () => void
    variant: 'info' | 'warning' | 'error' | 'success'
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    onConfirm: () => {},
    variant: 'info',
  })
  // Add state for invitation status
  const [invitationStatus, setInvitationStatus] = useState<{
    isLoading: boolean
    hasInvitations: boolean
    hasActiveInvitation: boolean
    isUsed: boolean
    expiresAt: string | null
    lastChecked: number
  }>({
    isLoading: false,
    hasInvitations: false,
    hasActiveInvitation: true, // Default to true to avoid showing "used" state before we know
    isUsed: false,
    expiresAt: null,
    lastChecked: 0,
  })
  const [inviteLinkError, setInviteLinkError] = useState<string | null>(null)

  // Helper functions for localStorage
  const getInviteLinkStorageKey = (customerId: string): string => {
    return `charterhub_invite_link_${customerId}`
  }

  const saveInviteLinkToStorage = (customerId: string, link: string): void => {
    try {
      localStorage.setItem(getInviteLinkStorageKey(customerId), link)
    } catch (err) {
      console.error('Failed to save invite link to localStorage:', err)
    }
  }

  const getInviteLinkFromStorage = (customerId: string): string | null => {
    try {
      return localStorage.getItem(getInviteLinkStorageKey(customerId))
    } catch (err) {
      console.error('Failed to get invite link from localStorage:', err)
      return null
    }
  }

  const removeInviteLinkFromStorage = (customerId: string): void => {
    try {
      localStorage.removeItem(getInviteLinkStorageKey(customerId))
    } catch (err) {
      console.error('Failed to remove invite link from localStorage:', err)
    }
  }

  useEffect(() => {
    loadCustomerData()

    // Set up event listeners for customer updates
    const handleCustomerUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ customer: CustomerWithPassport }>
      if (customEvent.detail?.customer?.id === id) {
        // Update customer state with the new data
        setCustomer((prev) => ({
          ...prev,
          ...customEvent.detail.customer,
        }))

        // Explicitly update notes value to ensure synchronization
        if (customEvent.detail?.customer?.notes !== undefined) {
          setNotesValue(customEvent.detail.customer.notes || '')

          // Log notes update for debugging
          console.log(
            '[CustomerDetails] Notes updated from event:',
            customEvent.detail.customer.notes
          )
        }
      }
    }

    // Set up polling for invitation status
    const pollInterval = setInterval(() => {
      if (id && document.visibilityState === 'visible') {
        console.log('[CustomerDetails] Polling invitation status')
        checkInvitationStatus(id)
      }
    }, 60000) // Poll every minute when page is visible

    // Add visibility change listener to poll when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && id) {
        console.log('[CustomerDetails] Tab became visible, checking invitation status')
        checkInvitationStatus(id)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Load saved invitation link from localStorage if available
    if (id) {
      const savedLink = getInviteLinkFromStorage(id)
      if (savedLink) {
        setInviteLink(savedLink)
      }
    }

    // Add event listener
    window.addEventListener(CUSTOMER_UPDATED_EVENT, handleCustomerUpdated)

    // Cleanup on unmount
    return () => {
      window.removeEventListener(CUSTOMER_UPDATED_EVENT, handleCustomerUpdated)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearInterval(pollInterval)
    }
  }, [id])

  useEffect(() => {
    // Update notes value when customer changes
    if (customer) {
      setNotesValue(customer.notes || '')
    }
  }, [customer])

  const loadCustomerData = async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)

    try {
      // Load customer data
      const customerData = await customerService.getCustomer(id)

      // Type assertion to handle the mismatch between Customer and CustomerWithPassport
      setCustomer(customerData as unknown as CustomerWithPassport)

      // Set notes value if available
      if (customerData && 'notes' in customerData) {
        setNotesValue((customerData.notes as string) || '')
      } else {
        setNotesValue('')
      }

      // Load customer bookings
      try {
        const bookingsData = await customerService.getCustomerBookings(id)
        // Type assertion to handle potential incompatibility
        setBookings(bookingsData as unknown as CustomerBooking[])
      } catch (bookingErr) {
        console.error('Error loading customer bookings:', bookingErr)
        setBookings([]) // Set empty array on error
      }

      // Check invitation status after loading customer
      await checkInvitationStatus(id)
    } catch (err) {
      console.error('Error loading customer data:', err)
      setError('Failed to load customer data')
    } finally {
      setIsLoading(false)
    }
  }

  const checkInvitationStatus = async (customerId: string) => {
    if (!customerId) return

    try {
      setInvitationStatus((prev) => ({ ...prev, isLoading: true }))

      const status = await customerService.checkInvitationStatus(customerId)

      // Determine if customer has completed the invitation process
      const hasInvitationsButAllUsed = status.hasInvitations && !status.hasActiveInvitation

      // Update the customer state to include hasCompletedInvitation
      setCustomer((prevCustomer) => {
        if (!prevCustomer) return null
        return {
          ...prevCustomer,
          hasCompletedInvitation: hasInvitationsButAllUsed,
        }
      })

      // If there's an active invitation, try to extract the invitation URL
      let activeInvitationUrl = null
      if (status.hasInvitations && status.hasActiveInvitation && status.invitations) {
        const activeInvitation = status.invitations.find((inv) => inv.status === 'active')
        if (activeInvitation) {
          // If the frontend code runs on localhost or any other environment, we need to construct the URL
          // with the correct base URL for the environment
          const baseUrl = window.location.origin
          // Include invited=true parameter to ensure the registration page shows the invitation UI
          activeInvitationUrl = `${baseUrl}/register?invited=true&token=${activeInvitation.token}`

          // Update the inviteLink state and save to localStorage
          if (activeInvitationUrl && (!inviteLink || inviteLink !== activeInvitationUrl)) {
            console.log('[CustomerDetails] Setting active invitation URL:', activeInvitationUrl)
            setInviteLink(activeInvitationUrl)
            saveInviteLinkToStorage(customerId, activeInvitationUrl)
          }
        }
      } else if (!status.hasActiveInvitation && inviteLink) {
        // If there's no active invitation but we have an inviteLink, check if we should remove it
        // Only remove it if the invitations list indicates it's been used
        if (status.invitations && status.invitations.some((inv) => inv.isUsed)) {
          console.log('[CustomerDetails] Clearing invite link as invitation has been used')
          // Keep the link visible but mark status as inactive
          // Do NOT clear the link: setInviteLink(null)
          // Do NOT remove from storage: removeInviteLinkFromStorage(customerId)
        }
      }

      setInvitationStatus({
        isLoading: false,
        hasInvitations: status.hasInvitations,
        hasActiveInvitation: status.hasActiveInvitation,
        isUsed: status.hasInvitations && !status.hasActiveInvitation,
        expiresAt: status.expiresAt || null,
        lastChecked: Date.now(),
      })

      console.log('[CustomerDetails] Invitation status checked:', status)
    } catch (err) {
      console.error('[CustomerDetails] Failed to check invitation status:', err)
      setInvitationStatus((prev) => ({
        ...prev,
        isLoading: false,
        lastChecked: Date.now(),
      }))
    }
  }

  const generateInviteLink = async (customerId: string, forceGenerate = false) => {
    if (!customerId) return

    try {
      setInvitationStatus((prev) => ({ ...prev, isLoading: true }))
      console.log(
        `[CustomerDetails] Generating invitation link for customer ID ${customerId}${forceGenerate ? ' (forced)' : ''}`
      )

      // Validate customer ID
      const customerIdNum = Number(customerId)
      if (isNaN(customerIdNum) || customerIdNum <= 0) {
        throw new Error('Invalid customer ID')
      }

      // Generate the invitation link
      const link = await customerService.getInviteLink(customerIdNum, forceGenerate)

      // Set link state and save to storage
      setInviteLink(link)
      saveInviteLinkToStorage(customerId, link)

      // If we got this far, clear any errors from the state
      setInviteLinkError(null)

      // Refresh invitation status after generating link
      // Use a slight delay to allow backend processing to complete
      setTimeout(() => checkInvitationStatus(customerId), 1000)

      return link
    } catch (err) {
      console.error('[CustomerDetails] Failed to generate invite link:', err)
      setInviteLinkError('Failed to generate invitation link')

      // Handle specific error types
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'

      if (
        errorMessage.includes('already registered') ||
        errorMessage.includes('completed account setup')
      ) {
        // Client is already registered
        setInviteLinkError(
          'This client has already registered and completed their account setup. No invitation link is needed.'
        )

        // Refresh invitation status to double-check
        setTimeout(() => checkInvitationStatus(customerId), 1000)
      } else if (
        errorMessage.includes('CORS') ||
        errorMessage.includes('Network Error') ||
        errorMessage.includes('network issues')
      ) {
        // CORS/Network error - but the link might have been generated successfully
        setInviteLinkError(
          "Network error occurred. The link may have been generated but couldn't be retrieved due to CORS issues."
        )

        // Try to check invitation status anyway - it might work even if link generation had CORS issues
        setTimeout(() => {
          checkInvitationStatus(customerId)
          // If we have an old link in storage, use that as a fallback
          const storedLink = getInviteLinkFromStorage(customerId)
          if (storedLink && !inviteLink) {
            setInviteLink(storedLink)
          }
        }, 1500)
      } else {
        // Generic error
        setInviteLinkError(`Error: ${errorMessage}`)
      }

      return null
    } finally {
      setInvitationStatus((prev) => ({
        ...prev,
        isLoading: false,
        lastChecked: Date.now(),
      }))
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  const handleUpdateCustomer = async (result: CustomerModalResult) => {
    if (!customer) return
    try {
      // Show loading state
      setIsLoading(true)

      // The updated customer is in result.customer
      const updatedCustomer = result.customer

      // We don't need to make an explicit API call here,
      // as the CreateCustomerModal already updates the customer via the API
      // This is evident from the result.action being 'updated'

      // Update local state immediately for better UX
      setCustomer({
        ...customer,
        ...updatedCustomer,
      })

      // Ensure notes are synchronized
      if (updatedCustomer.notes !== undefined) {
        setNotesValue(updatedCustomer.notes || '')
        console.log('[CustomerDetails] Notes updated from modal:', updatedCustomer.notes)
      }

      // Close the edit modal
      setShowEditModal(false)

      // Clear the customer service cache for this specific customer
      customerService.clearCustomerCache(String(customer.id))

      // Reload customer data from server to ensure we have the latest
      // Use small delay to ensure backend propagation
      setTimeout(async () => {
        try {
          // Reload customer data from server to ensure we have the latest
          await loadCustomerData()

          // Success message was here - removed the annoying alert
          console.log('Customer updated successfully')
        } catch (refreshErr) {
          console.error('Error refreshing customer data:', refreshErr)
          // Even if refresh fails, we've already updated UI with the changes
        }
      }, 500)
    } catch (err) {
      setIsLoading(false)
      console.error('Error updating customer:', err)
      alert(`Failed to update customer: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleSaveNotes = async () => {
    if (!customer) return
    try {
      setIsSavingNotes(true)
      console.log('Saving notes for customer ID:', customer.id, 'with value:', notesValue)

      // Use the dedicated notes update method
      const success = await customerService.updateCustomerNotes(String(customer.id), notesValue)

      if (success) {
        // Update the customer in the local state
        const updatedCustomer = {
          ...customer,
          notes: notesValue,
        }
        setCustomer(updatedCustomer)
        setIsEditingNotes(false)
        console.log('Notes saved successfully')

        // Dispatch a customer updated event to notify other components
        const event = new CustomEvent(CUSTOMER_UPDATED_EVENT, {
          detail: {
            customer: updatedCustomer,
            eventId: `notes_update_${Date.now()}`,
          },
        })
        window.dispatchEvent(event)
        console.log('[CustomerDetails] Dispatched customer updated event after saving notes')
      } else {
        throw new Error('Failed to save notes')
      }
    } catch (err) {
      console.error('Failed to update notes:', err)
      alert('Failed to save notes. Please try again.')
    } finally {
      setIsSavingNotes(false)
    }
  }

  const handleCancelEditNotes = () => {
    setNotesValue(customer?.notes || '')
    setIsEditingNotes(false)
  }

  const handleAttachPassport = async (document: Document) => {
    if (!customer) return

    try {
      // Implement this method in customerService
      if (typeof customerService.attachPassport === 'function') {
        const success = await customerService.attachPassport(String(customer.id), document.id)

        if (success) {
          setCustomer((prev) =>
            prev
              ? {
                  ...prev,
                  passportDocumentId: document.id,
                }
              : null
          )
          setShowDocumentModal(false)
        } else {
          console.error('Failed to attach passport: operation returned false')
        }
      } else {
        console.error('attachPassport method is not available in customerService')
      }
    } catch (err) {
      console.error('Failed to attach passport:', err)
    }
  }

  const handleDeleteCustomer = async () => {
    if (!customer) return

    try {
      setIsDeleting(true)

      // First clear the cache to ensure no stale data remains
      customerService.clearCustomerCache(String(customer.id))

      // Attempt to delete the customer
      const success = await customerService.deleteCustomer(String(customer.id))

      if (success) {
        setShowDeleteModal(false)
        // Remove the alert message
        console.log('Customer deleted successfully')
        // Navigate back to customers list
        navigate('/admin/customers', { replace: true })
      } else {
        throw new Error('Failed to delete customer')
      }
    } catch (err) {
      console.error('Failed to delete customer:', err)

      // Enhanced error handling with specific messages
      let errorMessage = 'Failed to delete customer. Please try again.'

      // Check for common errors
      if (err instanceof Error) {
        if (err.message.includes('Network Error')) {
          errorMessage =
            'Network error: Please check your connection and ensure the server is running.'
        } else if (err.message.includes('401')) {
          errorMessage =
            'Authentication error: Please log out and log back in to refresh your session.'
        } else if (err.message.includes('403')) {
          errorMessage = 'Permission denied: You do not have permission to delete this customer.'
        } else if (err.message.includes('CORS')) {
          errorMessage =
            'CORS error: There is a cross-origin request issue. Please contact the administrator.'
        }
      }

      // Show error message
      alert(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    )
  }

  if (error || !customer) {
    return <div className="text-center p-8 text-red-500">{error || 'Customer not found'}</div>
  }

  const passport = documents.find((doc) => doc.id === customer.passportDocumentId) as
    | ExtendedDocument
    | undefined
  const passportDisplayName = passport?.title || 'Passport Document'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => navigate('/admin/customers')} className="p-2">
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">
            {customer.firstName} {customer.lastName}
          </h1>
        </div>
        <div className="flex space-x-2">
          <Button variant="secondary" onClick={() => setShowEditModal(true)}>
            <PencilIcon className="h-5 w-5 mr-2" />
            Edit Customer
          </Button>
          <Button variant="secondary" onClick={() => setShowDocumentModal(true)}>
            <DocumentIcon className="h-5 w-5 mr-2" />
            Attach Documents
          </Button>
          <Button variant="destructive" onClick={() => setShowDeleteModal(true)}>
            <TrashIcon className="h-5 w-5 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Customer Details Card */}
      <Card>
        <div className="p-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Customer Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                  <div className="flex items-center mt-1">
                    <UserCircleIcon className="h-4 w-4 mr-1 text-gray-400" />
                    <p>
                      {customer.firstName} {customer.lastName}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Email Address</h3>
                  <div className="flex items-center mt-1">
                    <EnvelopeIcon className="h-4 w-4 mr-1 text-gray-400" />
                    <p className="text-blue-600">{customer.email}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Phone Number</h3>
                  <div className="flex items-center mt-1">
                    <PhoneIcon className="h-4 w-4 mr-1 text-gray-400" />
                    <p>{customer.phone || 'Not provided'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Company</h3>
                  <div className="flex items-center mt-1">
                    <BuildingOfficeIcon className="h-4 w-4 mr-1 text-gray-400" />
                    <p>{customer.company || 'Not provided'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Country</h3>
                  <div className="flex items-center mt-1">
                    <MapPinIcon className="h-4 w-4 mr-1 text-gray-400" />
                    <p>{customer.country || 'Not provided'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Address</h3>
                  <div className="flex items-center mt-1">
                    <MapPinIcon className="h-4 w-4 mr-1 text-gray-400" />
                    <p>{customer.address || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Customer Notes Card */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Customer Notes</h2>
            {!isEditingNotes ? (
              <Button variant="secondary" onClick={() => setIsEditingNotes(true)}>
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Notes
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button variant="secondary" onClick={handleCancelEditNotes}>
                  Cancel
                </Button>
                <Button onClick={handleSaveNotes} disabled={isSavingNotes}>
                  {isSavingNotes ? 'Saving...' : 'Save Notes'}
                </Button>
              </div>
            )}
          </div>
          {isEditingNotes ? (
            <textarea
              rows={15}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary max-h-[45em] overflow-y-auto"
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              placeholder="Add any notes about this customer..."
            />
          ) : customer.notes ? (
            <div className="whitespace-pre-wrap max-h-[20em] overflow-y-auto pr-2">
              {customer.notes}
            </div>
          ) : (
            <p className="text-gray-500">No notes added yet</p>
          )}
        </div>
      </Card>

      {/* Passport Information */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Passport</h2>
        {passport ? (
          <div className="flex items-start space-x-3">
            <IdentificationIcon
              className="h-6 w-6 text-blue-500 flex-shrink-0 cursor-pointer"
              onClick={() => setShowPassportModal(true)}
            />
            <div>
              <h3
                className="font-medium hover:text-blue-500 cursor-pointer"
                onClick={() => setShowPassportModal(true)}
              >
                {passportDisplayName}
              </h3>
              {passport.description && (
                <p className="text-sm text-gray-500">{passport.description}</p>
              )}
              <p className="text-xs text-gray-400">
                Uploaded {new Date(passport.uploadedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No passport uploaded yet</p>
        )}
      </Card>

      {/* Booking Statistics */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Statistics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Total Bookings</p>
            <p className="text-2xl font-semibold">{customer.bookingsCount}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Spent</p>
            <p className="text-2xl font-semibold">${(customer.totalSpent || 0).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Last Booking</p>
            <p className="text-xl font-semibold">
              {customer.lastBooking ? new Date(customer.lastBooking).toLocaleDateString() : 'Never'}
            </p>
          </div>
        </div>
      </Card>

      {/* Account Info with Invitation Link */}
      <Card className="p-6 bg-gray-50 border-t border-gray-100">
        <h2 className="text-sm font-medium text-gray-500 mb-3">Account Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-500">
          <div>
            <p className="text-gray-400">Account Type</p>
            <p className="mt-1">
              {customer.selfRegistered === true && !customer.hasCompletedInvitation
                ? 'Self-registered'
                : customer.hasCompletedInvitation
                  ? 'Invited'
                  : 'Admin created'}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Account ID</p>
            <p className="mt-1 font-mono">{customer.id}</p>
          </div>
          <div>
            <p className="text-gray-400">Registration Date</p>
            <p className="mt-1">
              {customer.registrationDate
                ? new Date(customer.registrationDate).toLocaleDateString()
                : new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Invitation Section */}
        <div className="mt-4 border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400">
              Invitation Status
              {invitationStatus.isLoading && (
                <span className="ml-2 inline-block animate-pulse">Checking status...</span>
              )}
            </p>

            {/* Generate Invitation Link Button */}
            {!invitationStatus.isLoading &&
              (!invitationStatus.hasInvitations || !invitationStatus.hasActiveInvitation) && (
                <button
                  onClick={() => generateInviteLink(String(customer.id))}
                  className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors"
                >
                  Generate Invitation Link
                </button>
              )}
          </div>

          {!invitationStatus.isLoading && invitationStatus.hasInvitations && (
            <>
              {/* Status Badge */}
              <div className="mb-2">
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium
                  ${
                    invitationStatus.hasActiveInvitation
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {invitationStatus.hasActiveInvitation ? 'Active Invitation' : 'Invitation Used'}
                </span>

                {invitationStatus.expiresAt && invitationStatus.hasActiveInvitation && (
                  <span className="text-xs text-gray-500 ml-2">
                    Expires: {new Date(invitationStatus.expiresAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </>
          )}

          {/* Display error message if there was an error generating the link */}
          {inviteLinkError && (
            <div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
              <p className="flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {inviteLinkError}
              </p>
              {/* Display a "Check Anyway" button if it might be a CORS error */}
              {inviteLinkError.includes('CORS') && (
                <div className="mt-2">
                  <button
                    onClick={() => checkInvitationStatus(String(customer.id))}
                    className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1 rounded"
                  >
                    Check Invitation Status
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Display invite link if available */}
          {inviteLink && (
            <div className="mt-2">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className={`text-xs bg-white border border-gray-300 rounded px-2 py-1 flex-grow font-mono 
                    ${!invitationStatus.hasActiveInvitation ? 'text-gray-400 bg-gray-50' : 'text-gray-600'}`}
                />
                <button
                  onClick={() => copyToClipboard(inviteLink)}
                  className={`text-xs py-1 px-2 rounded transition-colors
                    ${
                      !invitationStatus.hasActiveInvitation
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  disabled={!invitationStatus.hasActiveInvitation}
                >
                  {copySuccess ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <p className="text-xs text-gray-400 mt-2 italic">
                {!invitationStatus.hasActiveInvitation
                  ? 'This invitation link has been used or expired. Generate a new link if needed.'
                  : 'Share this link with the customer to invite them to the platform. Link expires after 7 days.'}
              </p>
            </div>
          )}

          {/* Show message when no invitations exist */}
          {!invitationStatus.isLoading && !invitationStatus.hasInvitations && !inviteLink && (
            <p className="text-xs text-gray-500">
              No invitation links have been generated for this customer.
            </p>
          )}
        </div>
      </Card>

      {/* Recent Bookings */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Bookings</h2>
        {bookings.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {bookings.map((booking) => (
              <div key={booking.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{booking.yacht.name}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(booking.startDate).toLocaleDateString()} -{' '}
                      {new Date(booking.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Role: {booking.role === 'main_charterer' ? 'Main Charterer' : 'Guest'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${booking.totalPrice.toLocaleString()}</p>
                    <p
                      className={`text-xs mt-1 ${
                        booking.status === 'confirmed'
                          ? 'text-green-500'
                          : booking.status === 'pending'
                            ? 'text-amber-500'
                            : booking.status === 'completed'
                              ? 'text-blue-500'
                              : 'text-red-500'
                      }`}
                    >
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No bookings found for this customer</p>
        )}
      </Card>

      {/* Edit Modal */}
      {showEditModal && (
        <CreateCustomerModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onComplete={handleUpdateCustomer}
          initialData={customer}
          isEditing={true}
        />
      )}

      {/* Document Search Modal */}
      {showDocumentModal && (
        <DocumentSearchModal
          isOpen={showDocumentModal}
          onClose={() => setShowDocumentModal(false)}
          onSelect={handleAttachPassport}
          filter={(doc) => true} // Accept any document type
        />
      )}

      {/* Passport Viewer Modal */}
      {showPassportModal && passport && (
        <PassportViewerModal
          isOpen={showPassportModal}
          onClose={() => setShowPassportModal(false)}
          document={passport}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <ModalHeader>
          <ModalTitle>Confirm Deletion</ModalTitle>
        </ModalHeader>
        <ModalContent>
          <div className="p-6 space-y-4">
            <div className="flex items-center text-amber-600 gap-2">
              <ExclamationTriangleIcon className="h-6 w-6" />
              <h3 className="font-medium">This action cannot be undone</h3>
            </div>
            <p className="text-gray-700">
              Are you sure you want to delete this customer? All their personal information will be
              permanently removed. This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteCustomer} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete Customer'}
              </Button>
            </div>
          </div>
        </ModalContent>
      </Modal>

      {/* Custom Confirmation Modal */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
      >
        <ModalHeader>
          <ModalTitle>{modalState.title}</ModalTitle>
        </ModalHeader>
        <ModalContent>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              {modalState.variant === 'warning' && (
                <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" />
              )}
              {modalState.variant === 'error' && (
                <ExclamationCircleIcon className="h-6 w-6 text-red-600" />
              )}
              {modalState.variant === 'info' && (
                <InformationCircleIcon className="h-6 w-6 text-blue-600" />
              )}
              {modalState.variant === 'success' && (
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              )}
              <h3 className="font-medium">{modalState.message}</h3>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="secondary"
                onClick={() => setModalState({ ...modalState, isOpen: false })}
              >
                {modalState.cancelLabel}
              </Button>
              <Button
                variant={modalState.variant === 'error' ? 'destructive' : 'primary'}
                onClick={() => {
                  modalState.onConfirm()
                  setModalState({ ...modalState, isOpen: false })
                }}
              >
                {modalState.confirmLabel}
              </Button>
            </div>
          </div>
        </ModalContent>
      </Modal>
    </div>
  )
}
