import { useEffect, useState } from 'react'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { BookingWithDetails, BookingGuest, BookingDocument, ClientUser } from '@/contexts/types'
import { useBooking } from '@/contexts/booking/BookingContext'
import { useAdminBooking } from '@/contexts/booking/AdminBookingContext'
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@/components/shared'
import { PlusIcon, XMarkIcon, DocumentIcon, LinkIcon, TrashIcon, CalendarIcon } from '@heroicons/react/24/outline'
import { CustomerSearch } from '@/components/customer'
import { DocumentForm, DocumentFormValues } from '@/components/shared/DocumentForm'
import { Modal, ModalHeader, ModalTitle, ModalContent } from '@/components/shared/Modal'
import { yachtService } from '@/services/yachtService'
import { destinationService } from '@/services/destinationService'
import { customerService } from '@/services/customerService'
import { Yacht } from '@/types/yacht'
import { Destination } from '@/types/destination'
import { bookingService } from '@/services/bookingService'

interface BookingFormProps {
  booking?: BookingWithDetails | null
  onSuccess?: () => void
  onCancel?: () => void
  useAdminService?: boolean
}

interface FormValues {
  yachtId: string
  yachtName: string
  isYachtFromApi: boolean
  destinationId: string
  destinationName: string
  isDestinationFromApi: boolean
  startDate: string
  endDate: string
  guests: number
  specialRequests: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  mainCharterer: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: 'client'
    notes: string
  }
  guestList: BookingGuest[]
  documents: BookingDocument[]
}

const validationSchema = Yup.object({
  yachtId: Yup.string().required('Yacht is required'),
  startDate: Yup.date().required('Start date is required'),
  endDate: Yup.date()
    .required('End date is required')
    .min(Yup.ref('startDate'), 'End date must be after start date'),
  guests: Yup.number()
    .required('Number of guests is required')
    .min(1, 'At least 1 guest is required'),
  mainCharterer: Yup.object({
    id: Yup.string().required('Main charterer is required'),
    firstName: Yup.string().required('First name is required'),
    lastName: Yup.string().required('Last name is required'),
    email: Yup.string().email('Invalid email').required('Email is required'),
    role: Yup.string().required('Role is required'),
    notes: Yup.string(),
  }).required('Main charterer is required'),
  guestList: Yup.array().of(
    Yup.object({
      id: Yup.string().required('Guest ID is required'),
      firstName: Yup.string().required('First name is required'),
      lastName: Yup.string().required('Last name is required'),
      email: Yup.string().email('Invalid email').required('Email is required'),
      notes: Yup.string(),
    })
  ),
  documents: Yup.array().of(
    Yup.object({
      title: Yup.string().required('Document title is required'),
      type: Yup.string().required('Document type is required'),
      url: Yup.string().required('Document URL is required'),
    })
  ),
})

interface BookingFormErrors {
  guestList?: {
    firstName?: string
    lastName?: string
    email?: string
  }[]
  documents?: {
    title?: string
    url?: string
    type?: string
    visibility?: string
  }[]
}

export function BookingForm({ booking, onSuccess, onCancel, useAdminService = false }: BookingFormProps) {
  // Get the appropriate booking service based on flag
  const clientBookingContext = useBooking()
  const adminBookingContext = useAdminBooking()
  
  // Select the appropriate context
  const {
    createBooking,
    updateBooking,
    validateDates
  } = useAdminService ? adminBookingContext : clientBookingContext

  const [yachts, setYachts] = useState<Yacht[]>([])
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [yachtsLoading, setYachtsLoading] = useState(true)
  const [destinationsLoading, setDestinationsLoading] = useState(true)
  const [showAddDocumentModal, setShowAddDocumentModal] = useState(false)

  // Fetch yachts and destinations
  useEffect(() => {
    const fetchYachts = async () => {
      try {
        setYachtsLoading(true)
        const data = await yachtService.getYachts()
        setYachts(data)
      } catch (err) {
        console.error('Error fetching yachts:', err)
      } finally {
        setYachtsLoading(false)
      }
    }

    const fetchDestinations = async () => {
      try {
        setDestinationsLoading(true)
        const data = await destinationService.getDestinations()
        setDestinations(data)
      } catch (err) {
        console.error('Error fetching destinations:', err)
      } finally {
        setDestinationsLoading(false)
      }
    }

    fetchYachts()
    fetchDestinations()
  }, [])

  const formik = useFormik<FormValues>({
    initialValues: {
      yachtId: booking?.yacht?.id || '',
      yachtName: booking?.yacht?.name || '',
      isYachtFromApi: booking?.yacht?.isFromApi || false,
      destinationId: booking?.destination?.id || '',
      destinationName: booking?.destination?.name || '',
      isDestinationFromApi: booking?.destination?.isFromApi || false,
      startDate: booking?.startDate || '',
      endDate: booking?.endDate || '',
      guests: booking?.guests || 1,
      specialRequests: booking?.specialRequests || '',
      status: booking?.status || 'pending',
      mainCharterer: booking?.mainCharterer ? {
        id: booking.mainCharterer.id || '',
        firstName: booking.mainCharterer.firstName || '',
        lastName: booking.mainCharterer.lastName || '',
        email: booking.mainCharterer.email || '',
        role: (booking.mainCharterer as any).role || 'client',
        notes: (booking.mainCharterer as any).notes || '',
      } : {
        id: '',
        firstName: '',
        lastName: '',
        email: '',
        role: 'client',
        notes: '',
      },
      guestList: booking?.guestList || [],
      documents: booking?.documents || [],
    },
    validationSchema: validationSchema,
    onSubmit: async (values, { setSubmitting, setFieldError }) => {
      try {
        const isAvailable = await validateDates(values.yachtId, values.startDate, values.endDate)

        if (!isAvailable) {
          setFieldError('startDate', 'Selected dates are not available')
          setFieldError('endDate', 'Selected dates are not available')
          return
        }

        // Ensure customer notes are properly synchronized before creating the booking
        if (values.mainCharterer && values.mainCharterer.id && values.mainCharterer.notes) {
          console.log(
            `BookingForm: Ensuring main charterer notes are synced: "${values.mainCharterer.notes}"`
          )
          try {
            await customerService.ensureCustomerNotesSynced(
              values.mainCharterer.id.toString(),
              values.mainCharterer.notes
            )
          } catch (noteErr) {
            console.error('Error syncing main charterer notes:', noteErr)
          }
        }

        // Also ensure guest notes are synced
        if (values.guestList && values.guestList.length > 0) {
          console.log(
            `BookingForm: Ensuring notes are synced for ${values.guestList.length} guests`
          )

          for (const guest of values.guestList) {
            if (guest.id && guest.notes) {
              try {
                await customerService.ensureCustomerNotesSynced(guest.id.toString(), guest.notes)
              } catch (noteErr) {
                console.error(`Error syncing guest ${guest.id} notes:`, noteErr)
              }
            }
          }
        }

        // Normalize dates to ensure consistent format
        const formattedData = {
          ...values,
          startDate: new Date(values.startDate).toISOString().split('T')[0],
          endDate: new Date(values.endDate).toISOString().split('T')[0],
        }

        // Create guests array with appropriate format for API
        // This handles the type mismatch between number (guest count) and array of guest objects
        const guestsArray = values.guestList.map(guest => ({
          id: guest.id,
          firstName: guest.firstName,
          lastName: guest.lastName,
          email: guest.email,
          notes: guest.notes || ''
        }));

        const bookingData = {
          ...formattedData,
          yacht: {
            id: values.yachtId,
            name: values.yachtName,
            isFromApi: values.isYachtFromApi,
          },
          destination: {
            id: values.destinationId,
            name: values.destinationName,
            isFromApi: values.isDestinationFromApi,
          },
          // For number of guests (as displayed in UI)
          guestsCount: values.guests,
          // For the actual guest objects array (as required by API)
          guests: guestsArray,
          // Include guestList for backward compatibility
          guestList: values.guestList
        }

        console.log('Creating booking with data:', bookingData)
        
        // Pass only the properties needed for CreateBookingDTO
        const bookingDTO = {
          yachtId: bookingData.yachtId,
          startDate: bookingData.startDate,
          endDate: bookingData.endDate,
          mainCharterer: bookingData.mainCharterer,
          guestList: bookingData.guestList,
          guests: bookingData.guests,
          destination: bookingData.destination,
          totalPrice: values.totalPrice,
          specialRequests: values.specialRequests,
          notes: values.notes || '',
          status: values.status || 'pending',
          documents: values.documents || []
        }

        const booking = await bookingService.createBooking(bookingDTO)

        onSuccess?.()
      } catch (error) {
        console.error('Booking submission failed:', error)
      } finally {
        setSubmitting(false)
      }
    },
  })

  const handleAddGuest = () => {
    formik.setFieldValue('guestList', [
      ...formik.values.guestList,
      { firstName: '', lastName: '', email: '', notes: '' },
    ])
  }

  const handleRemoveGuest = (index: number) => {
    const newGuestList = [...formik.values.guestList]
    newGuestList.splice(index, 1)
    formik.setFieldValue('guestList', newGuestList)
  }

  const handleAddDocument = async (document: DocumentFormValues) => {
    if (!formik.values.documents) {
      formik.setFieldValue('documents', [])
    }

    formik.setFieldValue('documents', [
      ...(formik.values.documents || []),
      {
        ...document,
        id: Math.random().toString(36).substr(2, 9),
        uploadedAt: new Date().toISOString(),
      },
    ])
    setShowAddDocumentModal(false)
  }

  const handleRemoveDocument = (index: number) => {
    const newDocuments = [...formik.values.documents]
    newDocuments.splice(index, 1)
    formik.setFieldValue('documents', newDocuments)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{booking ? 'Edit Booking' : 'New Booking'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={formik.handleSubmit} className="space-y-6">
          {/* Yacht Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Yacht Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Yacht</label>
                {yachtsLoading ? (
                  <div className="animate-pulse h-10 bg-gray-200 rounded-md" />
                ) : (
                  <select
                    className="form-select w-full rounded-md border-gray-300"
                    onChange={(e) => {
                      const yacht = yachts.find((y) => y.id === e.target.value)
                      if (yacht) {
                        formik.setFieldValue('yachtId', yacht.id)
                        formik.setFieldValue('yachtName', yacht.name)
                        formik.setFieldValue('isYachtFromApi', true)
                      }
                    }}
                    value={formik.values.isYachtFromApi ? formik.values.yachtId : ''}
                  >
                    <option value="">Select from list</option>
                    {yachts.map((yacht) => (
                      <option key={yacht.id} value={yacht.id}>
                        {yacht.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Display selected yacht details */}
              {formik.values.yachtId && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Selected Yacht Details</h4>
                  {(() => {
                    const yacht = yachts.find((y) => y.id === formik.values.yachtId)
                    if (!yacht) return null
                    return (
                      <div className="text-sm text-gray-600">
                        <p>Length: {yacht.specifications.length}</p>
                        <p>Capacity: {yacht.specifications.capacity} guests</p>
                        <p>Crew: {yacht.specifications.crew} members</p>
                        {yacht.specifications.builder && (
                          <p>Builder: {yacht.specifications.builder}</p>
                        )}
                        {yacht.specifications.year && <p>Year: {yacht.specifications.year}</p>}
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Destination Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Destination Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Destination
                </label>
                {destinationsLoading ? (
                  <div className="animate-pulse h-10 bg-gray-200 rounded-md" />
                ) : (
                  <select
                    className="form-select w-full rounded-md border-gray-300"
                    onChange={(e) => {
                      const destination = destinations.find((d) => d.id === e.target.value)
                      if (destination) {
                        formik.setFieldValue('destinationId', destination.id)
                        formik.setFieldValue('destinationName', destination.name)
                        formik.setFieldValue('isDestinationFromApi', true)
                      }
                    }}
                    value={formik.values.isDestinationFromApi ? formik.values.destinationId : ''}
                  >
                    <option value="">Select from list</option>
                    {destinations.map((destination) => (
                      <option key={destination.id} value={destination.id}>
                        {destination.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <Input
                  label="Or Enter Destination"
                  type="text"
                  {...formik.getFieldProps('destinationName')}
                  error={formik.touched.destinationName ? formik.errors.destinationName : undefined}
                  onChange={(e) => {
                    formik.setFieldValue('destinationName', e.target.value)
                    formik.setFieldValue('isDestinationFromApi', false)
                    formik.setFieldValue('destinationId', '')
                  }}
                />
              </div>
            </div>
          </div>

          {/* Dates and Guests */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Booking Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Start Date"
                type="date"
                {...formik.getFieldProps('startDate')}
                error={formik.touched.startDate ? formik.errors.startDate : undefined}
              />
              <Input
                label="End Date"
                type="date"
                {...formik.getFieldProps('endDate')}
                error={formik.touched.endDate ? formik.errors.endDate : undefined}
              />
              <Input
                label="Number of Guests"
                type="number"
                {...formik.getFieldProps('guests')}
                error={formik.touched.guests ? formik.errors.guests : undefined}
              />
            </div>
            
            {/* Day Counter */}
            {formik.values.startDate && formik.values.endDate && (
              <div className="mt-2 p-2 bg-blue-50 rounded-md">
                <div className="flex items-center text-blue-700">
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  <span className="font-medium">
                    {(() => {
                      try {
                        const start = new Date(formik.values.startDate);
                        const end = new Date(formik.values.endDate);
                        
                        // Calculate the difference in days
                        const diffTime = Math.abs(end.getTime() - start.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} total`;
                      } catch (e) {
                        return 'Invalid dates';
                      }
                    })()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Main Charterer */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Main Charterer</h3>
            {/* Display initial state of main charterer for debugging */}
            {process.env.NODE_ENV === 'development' && booking?.mainCharterer && (
              <div className="p-2 bg-yellow-50 rounded-md mb-2 text-xs">
                <details>
                  <summary>Debug: Initial Main Charterer</summary>
                  <div>
                    <p>ID: {booking.mainCharterer.id}</p>
                    <p>Name: {booking.mainCharterer.firstName} {booking.mainCharterer.lastName}</p>
                    <p>Email: {booking.mainCharterer.email}</p>
                  </div>
                </details>
              </div>
            )}
            <CustomerSearch
              onSelect={(customer) => {
                console.log(
                  `BookingForm: Selected main charterer with notes: "${customer.notes || 'None'}"`
                )
                formik.setFieldValue('mainCharterer', {
                  id: customer.id.toString(),
                  firstName: customer.firstName,
                  lastName: customer.lastName,
                  email: customer.email,
                  role: 'client' as const,
                  notes: customer.notes || '',
                })
              }}
              selectedCustomer={formik.values.mainCharterer as unknown as ClientUser}
              placeholder={formik.values.mainCharterer?.firstName 
                ? `${formik.values.mainCharterer.firstName} ${formik.values.mainCharterer.lastName}`
                : "Search customers..."}
            />
            {formik.touched.mainCharterer && formik.errors.mainCharterer && (
              <p className="text-sm text-red-500">
                {typeof formik.errors.mainCharterer === 'string'
                  ? formik.errors.mainCharterer
                  : 'Please select a main charterer'}
              </p>
            )}
          </div>

          {/* Guest List */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Guest List</h3>
            <div className="space-y-4">
              <CustomerSearch
                onSelect={(customer: ClientUser) => {
                  // Check if guest is already in the list
                  const isExisting = formik.values.guestList.some(
                    (guest) => guest.id === customer.id
                  )
                  if (isExisting) {
                    formik.setFieldError('guestList', 'This guest is already in the list')
                    return
                  }

                  console.log(
                    `BookingForm: Selected guest with notes: "${customer.notes || 'None'}"`
                  )

                  // Add new guest to the list with proper types
                  const newGuest: BookingGuest = {
                    id: customer.id.toString(), // Ensure ID is a string
                    firstName: customer.firstName,
                    lastName: customer.lastName,
                    email: customer.email,
                    notes: customer.notes || '',
                  }
                  formik.setFieldValue('guestList', [...formik.values.guestList, newGuest])
                }}
              />

              {/* Guest List Display */}
              <div className="space-y-2">
                {formik.values.guestList.map((guest, index) => (
                  <div
                    key={guest.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                  >
                    <div>
                      <div className="font-medium">
                        {guest.firstName} {guest.lastName}
                      </div>
                      <div className="text-sm text-gray-600">{guest.email}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newGuestList = formik.values.guestList.filter((_, i) => i !== index)
                        formik.setFieldValue('guestList', newGuestList)
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>

              {formik.errors.guestList && typeof formik.errors.guestList === 'string' && (
                <p className="text-sm text-red-500">{formik.errors.guestList}</p>
              )}
            </div>
          </div>

          {/* Documents Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Documents</h3>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowAddDocumentModal(true)}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Document
              </Button>
            </div>

            <div className="space-y-2">
              {formik.values.documents.map((doc, index) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div className="flex items-center space-x-3">
                    <DocumentIcon className="h-5 w-5 text-gray-500" />
                    <div>
                      <div className="font-medium">{doc.title}</div>
                      <div className="text-sm text-gray-600">{doc.type}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {doc.url && (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <LinkIcon className="h-5 w-5" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveDocument(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Special Requests */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Special Requests</label>
            <textarea
              className="form-textarea w-full rounded-md border-gray-300"
              rows={4}
              {...formik.getFieldProps('specialRequests')}
            />
          </div>

          {/* Status (for editing) */}
          {booking && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                className="form-select w-full rounded-md border-gray-300"
                {...formik.getFieldProps('status')}
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}

          {/* Form buttons */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={formik.isSubmitting}>
              {booking ? 'Update' : 'Create'} Booking
            </Button>
          </div>
        </form>

        {/* Document Modal */}
        {showAddDocumentModal && (
          <Modal isOpen onClose={() => setShowAddDocumentModal(false)}>
            <ModalHeader>
              <ModalTitle>Add Document</ModalTitle>
            </ModalHeader>
            <ModalContent>
              <DocumentForm
                onSubmit={handleAddDocument}
                onCancel={() => setShowAddDocumentModal(false)}
                isBookingDocument={true}
              />
            </ModalContent>
          </Modal>
        )}
      </CardContent>
    </Card>
  )
}
