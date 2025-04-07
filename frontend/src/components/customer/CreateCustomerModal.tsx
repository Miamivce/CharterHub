import React, { useEffect, useState, useRef, useCallback } from 'react'
import {
  Button,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalFooter,
  Select,
} from '@/components/shared'
import { ClientUser } from '@/contexts/types'
import { customerService } from '@/services/customerService'
import { CustomerFormData } from '@/types/customer'

// Custom event for customer updates
export const CUSTOMER_UPDATED_EVENT = 'customer:updated'
export const CUSTOMER_CREATED_EVENT = 'customer:created'

// Safely dispatch events with retry and confirmation
const dispatchCustomerEvent = (eventName: string, customer: ClientUser, retries = 3) => {
  return new Promise<boolean>((resolve) => {
    // Create a unique event ID to track this specific event
    const eventId = `${eventName}_${Date.now()}`
    const eventData = {
      ...customer,
      eventId, // Add event ID for tracking
    }

    console.log(
      `[CreateCustomerModal] Dispatching ${eventName} event for customer ID ${customer.id}`
    )

    // Track whether the event was verified
    let verified = false
    const verificationTimeout = setTimeout(() => {
      if (!verified && retries > 0) {
        console.log(
          `[CreateCustomerModal] Retrying ${eventName} event dispatch, ${retries} attempts left`
        )
        // Retry with fewer retries
        dispatchCustomerEvent(eventName, customer, retries - 1).then((success) => resolve(success))
      } else if (!verified) {
        console.log(
          `[CreateCustomerModal] Failed to verify ${eventName} event after multiple attempts`
        )
        resolve(false) // Give up after retries are exhausted
      }
    }, 500)

    // Listen for event confirmation
    const listener = (e: Event) => {
      const customEvent = e as CustomEvent
      // Check if this is the specific event we dispatched by matching event ID
      if (customEvent.detail?.eventId === eventId) {
        console.log(
          `[CreateCustomerModal] ${eventName} event confirmed for customer ID ${customer.id}`
        )
        verified = true
        clearTimeout(verificationTimeout)
        document.removeEventListener(`${eventName}:confirmed`, listener)
        resolve(true)
      }
    }

    // Add listener before dispatching
    document.addEventListener(`${eventName}:confirmed`, listener)

    // Dispatch the actual event
    const event = new CustomEvent(eventName, { detail: eventData })
    document.dispatchEvent(event)
  })
}

export enum CustomerModalState {
  FORM = 'form', // Initial form state
  SUBMITTING = 'submitting', // Form is being submitted
  SUCCESS = 'success', // Customer was successfully created/updated
  ERROR = 'error', // Error state
}

export interface CustomerModalResult {
  customer: ClientUser // The created/updated customer
  inviteLink?: string | null // The invitation link (for new customers), can be null
  action: 'created' | 'updated' // Whether the customer was created or updated
  keepModalOpen: boolean // Flag to indicate if the modal should stay open after operation
}

interface CreateCustomerModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete?: (result: CustomerModalResult) => void
  initialData?: ClientUser
  isEditing?: boolean
}

interface ExtendedCustomerFormData extends CustomerFormData {
  country?: string
  address?: string
  notes?: string
}

// List of countries for the dropdown
const COUNTRIES = [
  'Afghanistan',
  'Albania',
  'Algeria',
  'Andorra',
  'Angola',
  'Antigua and Barbuda',
  'Argentina',
  'Armenia',
  'Australia',
  'Austria',
  'Azerbaijan',
  'Bahamas',
  'Bahrain',
  'Bangladesh',
  'Barbados',
  'Belarus',
  'Belgium',
  'Belize',
  'Benin',
  'Bhutan',
  'Bolivia',
  'Bosnia and Herzegovina',
  'Botswana',
  'Brazil',
  'Brunei',
  'Bulgaria',
  'Burkina Faso',
  'Burundi',
  'Cabo Verde',
  'Cambodia',
  'Cameroon',
  'Canada',
  'Central African Republic',
  'Chad',
  'Chile',
  'China',
  'Colombia',
  'Comoros',
  'Congo',
  'Costa Rica',
  'Croatia',
  'Cuba',
  'Cyprus',
  'Czech Republic',
  'Denmark',
  'Djibouti',
  'Dominica',
  'Dominican Republic',
  'Ecuador',
  'Egypt',
  'El Salvador',
  'Equatorial Guinea',
  'Eritrea',
  'Estonia',
  'Eswatini',
  'Ethiopia',
  'Fiji',
  'Finland',
  'France',
  'Gabon',
  'Gambia',
  'Georgia',
  'Germany',
  'Ghana',
  'Greece',
  'Grenada',
  'Guatemala',
  'Guinea',
  'Guinea-Bissau',
  'Guyana',
  'Haiti',
  'Honduras',
  'Hungary',
  'Iceland',
  'India',
  'Indonesia',
  'Iran',
  'Iraq',
  'Ireland',
  'Israel',
  'Italy',
  'Jamaica',
  'Japan',
  'Jordan',
  'Kazakhstan',
  'Kenya',
  'Kiribati',
  'Korea, North',
  'Korea, South',
  'Kosovo',
  'Kuwait',
  'Kyrgyzstan',
  'Laos',
  'Latvia',
  'Lebanon',
  'Lesotho',
  'Liberia',
  'Libya',
  'Liechtenstein',
  'Lithuania',
  'Luxembourg',
  'Madagascar',
  'Malawi',
  'Malaysia',
  'Maldives',
  'Mali',
  'Malta',
  'Marshall Islands',
  'Mauritania',
  'Mauritius',
  'Mexico',
  'Micronesia',
  'Moldova',
  'Monaco',
  'Mongolia',
  'Montenegro',
  'Morocco',
  'Mozambique',
  'Myanmar',
  'Namibia',
  'Nauru',
  'Nepal',
  'Netherlands',
  'New Zealand',
  'Nicaragua',
  'Niger',
  'Nigeria',
  'North Macedonia',
  'Norway',
  'Oman',
  'Pakistan',
  'Palau',
  'Palestine',
  'Panama',
  'Papua New Guinea',
  'Paraguay',
  'Peru',
  'Philippines',
  'Poland',
  'Portugal',
  'Qatar',
  'Romania',
  'Russia',
  'Rwanda',
  'Saint Kitts and Nevis',
  'Saint Lucia',
  'Saint Vincent and the Grenadines',
  'Samoa',
  'San Marino',
  'Sao Tome and Principe',
  'Saudi Arabia',
  'Senegal',
  'Serbia',
  'Seychelles',
  'Sierra Leone',
  'Singapore',
  'Slovakia',
  'Slovenia',
  'Solomon Islands',
  'Somalia',
  'South Africa',
  'South Sudan',
  'Spain',
  'Sri Lanka',
  'Sudan',
  'Suriname',
  'Sweden',
  'Switzerland',
  'Syria',
  'Taiwan',
  'Tajikistan',
  'Tanzania',
  'Thailand',
  'Timor-Leste',
  'Togo',
  'Tonga',
  'Trinidad and Tobago',
  'Tunisia',
  'Turkey',
  'Turkmenistan',
  'Tuvalu',
  'Uganda',
  'Ukraine',
  'United Arab Emirates',
  'United Kingdom',
  'United States',
  'Uruguay',
  'Uzbekistan',
  'Vanuatu',
  'Vatican City',
  'Venezuela',
  'Vietnam',
  'Yemen',
  'Zambia',
  'Zimbabwe',
].sort()

/**
 * Modal component for creating or editing customers
 */
export function CreateCustomerModal({
  isOpen,
  onClose,
  onComplete,
  initialData,
  isEditing = false,
}: CreateCustomerModalProps) {
  // State references to prevent race conditions
  const isOpenRef = useRef(isOpen)
  const hasCalledOnCompleteRef = useRef(false)
  const shouldForceOpenRef = useRef(false)

  // Core state and form data
  const [formData, setFormData] = useState<ExtendedCustomerFormData>({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    company: initialData?.company || '',
    country: initialData?.country || '',
    address: initialData?.address || '',
    notes: initialData?.notes || '',
    role: 'customer', // Use 'customer' for CustomerFormData
  })

  // Workflow state machine
  const [modalState, setModalState] = useState<CustomerModalState>(CustomerModalState.FORM)
  const [error, setError] = useState('')
  const [createdCustomer, setCreatedCustomer] = useState<ClientUser | null>(null)
  const [inviteLink, setInviteLink] = useState('')
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update ref when prop changes
  useEffect(() => {
    isOpenRef.current = isOpen
  }, [isOpen])

  // Reset all state when the modal is opened with new data
  useEffect(() => {
    if (isOpen) {
      resetForm()
    }
  }, [isOpen, initialData])

  // Internal state management to ensure visibility
  useEffect(() => {
    // If we need to force the modal to stay open but it's being closed externally
    if (shouldForceOpenRef.current && !isOpenRef.current) {
      console.log('[CreateCustomerModal] Preventing modal from closing, success flow in progress')
      // We can't override onClose directly, but we can track this state
    }
  }, [isOpen, onClose])

  // Complete reset of all state
  const resetForm = useCallback(() => {
    console.log('[CreateCustomerModal] Resetting form state')
    setFormData({
      firstName: initialData?.firstName || '',
      lastName: initialData?.lastName || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      company: initialData?.company || '',
      country: initialData?.country || '',
      address: initialData?.address || '',
      notes: initialData?.notes || '',
      role: 'customer',
    })
    setModalState(CustomerModalState.FORM)
    setError('')
    setCreatedCustomer(null)
    setInviteLink('')
    setIsGeneratingLink(false)
    setCopySuccess(false)
    setIsSubmitting(false)
    hasCalledOnCompleteRef.current = false
    shouldForceOpenRef.current = false
  }, [initialData])

  // Handle form submission with improved error handling and UX
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation() // Prevent any bubbling

    if (isSubmitting) {
      console.log(
        '[CreateCustomerModal] Submission already in progress, ignoring duplicate submission'
      )
      return
    }

    setError('')
    setIsSubmitting(true)
    setModalState(CustomerModalState.SUBMITTING)

    try {
      console.log(`[CreateCustomerModal] ${isEditing ? 'Updating' : 'Creating'} customer...`)

      // Format the form data for API
      const apiFormData: CustomerFormData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        notes: formData.notes, // Ensure notes are included in the API call
        country: formData.country, // Include country in API call
        address: formData.address, // Include address in API call
        role: 'customer',
      }

      // Create or update the customer
      let result
      if (isEditing && initialData) {
        result = await customerService.updateCustomer(initialData.id, apiFormData)
      } else {
        result = await customerService.createCustomer(apiFormData)
      }

      if (!result) {
        throw new Error(`Failed to ${isEditing ? 'update' : 'create'} customer`)
      }

      // Create a proper ClientUser object with notes
      const customer: ClientUser = {
        id: result.id,
        firstName: result.firstName,
        lastName: result.lastName,
        email: result.email,
        phone: result.phone || '',
        company: result.company || '',
        notes: result.notes || formData.notes || '', // Ensure notes come from API result or form data
        country: result.country || formData.country || '', // Ensure country comes from API result or form data
        address: result.address || formData.address || '', // Ensure address comes from API result or form data
        role: 'client',
      }

      console.log(
        `[CreateCustomerModal] Customer ${isEditing ? 'updated' : 'created'} successfully with notes:`,
        JSON.stringify(
          {
            id: customer.id,
            name: `${customer.firstName} ${customer.lastName}`,
            notes: customer.notes, // Log notes for debugging
          },
          null,
          2
        )
      )

      // Force the modal to stay open for the success flow
      shouldForceOpenRef.current = !isEditing

      // Update state with the created/updated customer
      setCreatedCustomer(customer)
      setModalState(CustomerModalState.SUCCESS)

      // Clear the customer cache to ensure fresh data on next load
      customerService.clearCustomerCache(customer.id)

      // Notify parent component about the successful operation
      // But only once to prevent duplicate processing
      if (!hasCalledOnCompleteRef.current && onComplete) {
        console.log(
          `[CreateCustomerModal] Calling onComplete with action: ${isEditing ? 'updated' : 'created'}, keepModalOpen: ${!isEditing}`
        )
        hasCalledOnCompleteRef.current = true

        // Call onComplete with customer data and indicate whether to keep modal open
        onComplete({
          customer,
          inviteLink: null,
          action: isEditing ? 'updated' : 'created',
          keepModalOpen: !isEditing, // Keep modal open for new customers, close for updates
        })
      }

      // For updates, close the modal after a brief delay to show success
      if (isEditing) {
        setTimeout(() => {
          if (isOpenRef.current) {
            onClose()
          }
        }, 500)
      }

      // Ensure notes are properly synced
      if (customer.notes) {
        customerService
          .ensureCustomerNotesSynced(customer.id.toString(), customer.notes)
          .catch((err) => {
            console.warn(`[CreateCustomerModal] Notes sync error (non-critical):`, err)
          })
      }

      // Dispatch event without waiting for confirmation (don't block UX)
      dispatchCustomerEvent(
        isEditing ? CUSTOMER_UPDATED_EVENT : CUSTOMER_CREATED_EVENT,
        customer
      ).catch((err) => {
        console.warn(`[CreateCustomerModal] Event dispatch error (non-critical):`, err)
      })
    } catch (err) {
      console.error(
        `[CreateCustomerModal] Error ${isEditing ? 'updating' : 'creating'} customer:`,
        err
      )
      setError(
        err instanceof Error ? err.message : `Failed to ${isEditing ? 'update' : 'create'} customer`
      )
      setModalState(CustomerModalState.ERROR)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Generate invitation link with improved error handling
  const generateInviteLink = async () => {
    if (!createdCustomer) {
      console.error('[CreateCustomerModal] Cannot generate invite link - no customer created')
      setError('Customer information not available')
      return
    }

    try {
      setIsGeneratingLink(true)
      setError('')

      console.log(
        `[CreateCustomerModal] Generating invitation link for customer ID ${createdCustomer.id}`
      )

      // Validate customer ID
      const customerId = Number(createdCustomer.id)
      if (isNaN(customerId) || customerId <= 0) {
        throw new Error('Invalid customer ID')
      }

      // Generate the invitation link directly - the customer service now handles the registration check internally
      const link = await customerService.getInviteLink(customerId)

      console.log(`[CreateCustomerModal] Successfully generated invitation link`)
      setInviteLink(link)

      // Check invitation status after generating link - but don't block on failure
      try {
        await customerService.checkInvitationStatus(createdCustomer.id.toString())
        console.log(`[CreateCustomerModal] Invitation status checked after link generation`)
      } catch (statusErr) {
        // Non-critical error, don't block the flow
        console.warn(
          `[CreateCustomerModal] Could not check invitation status: ${statusErr instanceof Error ? statusErr.message : 'Unknown error'}`
        )
      }
    } catch (err) {
      console.error('[CreateCustomerModal] Failed to generate invite link:', err)

      // Handle specific error messages
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'

      if (
        errorMessage.includes('already registered') ||
        errorMessage.includes('completed account setup')
      ) {
        setError(
          'This client has already registered and completed their account setup. No invitation link is needed.'
        )
      } else if (
        errorMessage.includes('CORS') ||
        errorMessage.includes('Network Error') ||
        errorMessage.includes('network issues')
      ) {
        setError(
          'Network error when generating invitation link. This may be due to CORS configuration issues on the server. Please contact your administrator or try loading the page over HTTPS instead.'
        )
        console.log('[CreateCustomerModal] CORS/Network error details:', errorMessage)
      } else {
        setError(`Invitation link error: ${errorMessage}`)
      }
    } finally {
      setIsGeneratingLink(false)
    }
  }

  // Copy to clipboard with visual feedback
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopySuccess(true)

      // Reset after 2 seconds
      setTimeout(() => {
        if (isOpenRef.current) {
          // Only update state if modal is still open
          setCopySuccess(false)
        }
      }, 2000)
    } catch (err) {
      console.error('[CreateCustomerModal] Failed to copy text:', err)
      setError('Could not copy to clipboard')
    }
  }

  // Safe close that respects modal state
  const handleClose = useCallback(() => {
    // Don't allow closing during certain operations
    if (isSubmitting || isGeneratingLink) {
      console.log('[CreateCustomerModal] Preventing close during active operation')
      return
    }

    // For creation success, we want to ensure the modal stays open to show
    // the success state and invitation options
    if (!isEditing && modalState === CustomerModalState.SUCCESS && shouldForceOpenRef.current) {
      console.log('[CreateCustomerModal] Success state active, allowing manual close only')
      shouldForceOpenRef.current = false
    }

    console.log('[CreateCustomerModal] Closing modal')
    resetForm()
    onClose()
  }, [isEditing, modalState, isSubmitting, isGeneratingLink, resetForm, onClose])

  // Determine if the form has required fields filled
  const isFormValid = () => {
    return (
      formData.firstName.trim() !== '' &&
      formData.lastName.trim() !== '' &&
      (!isEditing || formData.email.trim() !== '')
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      {modalState !== CustomerModalState.SUCCESS ? (
        <form onSubmit={handleSubmit}>
          <ModalHeader>
            <ModalTitle>{isEditing ? 'Edit Customer' : 'Create New Customer'}</ModalTitle>
          </ModalHeader>
          <ModalContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                  disabled={isSubmitting}
                />
                <Input
                  label="Last Name"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email {isEditing ? '*' : '(Optional for admin)'}
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required={isEditing}
                    value={formData.email}
                    disabled={isEditing || isSubmitting}
                    readOnly={isEditing}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full ${isEditing ? 'bg-gray-100' : ''}`}
                    placeholder={
                      isEditing ? 'firstname.lastname@invited.ys' : 'firstname.lastname@invited.ys'
                    }
                  />
                  {isEditing && (
                    <p className="mt-1 text-sm text-gray-500">
                      Email cannot be changed. Please contact support if you need to update a
                      client's email.
                    </p>
                  )}
                  {!isEditing && (
                    <p className="mt-1 text-sm text-gray-500">
                      If left blank, customer will set their email when they register via the invite
                      link.
                    </p>
                  )}
                </div>
                <Input
                  label="Phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  disabled={isSubmitting}
                />
              </div>
              <Input
                label="Company Name"
                value={formData.company}
                onChange={(e) => setFormData((prev) => ({ ...prev, company: e.target.value }))}
                disabled={isSubmitting}
              />
              <Select
                label="Country"
                value={formData.country}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setFormData((prev) => ({ ...prev, country: e.target.value }))
                }
                disabled={isSubmitting}
              >
                <option value="">Select a country</option>
                {COUNTRIES.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </Select>
              <Input
                label="Address"
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                disabled={isSubmitting}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any notes about this customer..."
                  disabled={isSubmitting}
                />
              </div>

              {error && <p className="text-red-600 text-sm">{error}</p>}
            </div>
          </ModalContent>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !isFormValid()}>
              {isSubmitting
                ? isEditing
                  ? 'Updating...'
                  : 'Creating...'
                : isEditing
                  ? 'Update Customer'
                  : 'Create Customer'}
            </Button>
          </ModalFooter>
        </form>
      ) : (
        <>
          <ModalHeader>
            <ModalTitle>Customer Created Successfully</ModalTitle>
          </ModalHeader>
          <ModalContent>
            <div className="p-4 space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <p className="text-green-700 font-medium">
                  {createdCustomer?.firstName} {createdCustomer?.lastName} has been created
                  successfully!
                </p>
              </div>

              {!inviteLink ? (
                <div className="space-y-3">
                  <p className="text-gray-600">
                    You can now generate an invitation link to share with the customer. They'll use
                    this link to set up their account.
                  </p>
                  <Button
                    onClick={generateInviteLink}
                    disabled={isGeneratingLink}
                    className="w-full"
                  >
                    {isGeneratingLink ? 'Generating Link...' : 'Generate Invitation Link'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-gray-600">
                    Share this invitation link with the customer. The link will expire after 7 days.
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={inviteLink}
                      readOnly
                      className="flex-1 p-2 border border-gray-300 rounded font-mono text-sm bg-gray-50"
                    />
                    <Button onClick={() => copyToClipboard(inviteLink)} variant="secondary">
                      {copySuccess ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                </div>
              )}

              {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
            </div>
          </ModalContent>
          <ModalFooter>
            <Button onClick={handleClose} variant="primary">
              Close
            </Button>
          </ModalFooter>
        </>
      )}
    </Modal>
  )
}
