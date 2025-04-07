import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookingWithDetails } from '@/contexts/types'
import { useAdminBooking } from '@/contexts/booking/AdminBookingContext'
import { BookingList } from '@/components/booking/BookingList'
import { BookingForm } from '@/components/booking/BookingForm'
import { Button, Card, CardContent } from '@/components/shared'
import { PlusIcon } from '@heroicons/react/24/outline'

export function AdminBookings() {
  const navigate = useNavigate()
  const { bookings, isLoading, error, deleteBooking, refreshBookings } = useAdminBooking()
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [bookingToDelete, setBookingToDelete] = useState<BookingWithDetails | null>(null)

  // Check for edit booking ID in sessionStorage
  useEffect(() => {
    const editBookingId = sessionStorage.getItem('editBookingId')
    if (editBookingId && bookings.length > 0) {
      console.log('Found editBookingId in sessionStorage:', editBookingId);
      console.log('Looking for booking in', bookings.length, 'bookings with IDs:', 
        bookings.map(b => `${b.id} (type: ${typeof b.id})`).join(', '));
      
      // Convert both IDs to strings for comparison
      const bookingToEdit = bookings.find((booking) => 
        String(booking.id) === String(editBookingId)
      );
      
      if (bookingToEdit) {
        console.log('Found booking to edit:', bookingToEdit.id);
        handleEdit(bookingToEdit);
      } else {
        console.log('Booking with ID', editBookingId, 'not found in loaded bookings');
      }
      // Remove from sessionStorage to prevent repeated edits
      sessionStorage.removeItem('editBookingId');
    }
  }, [bookings])

  // Refresh bookings on mount
  useEffect(() => {
    refreshBookings()
  }, [refreshBookings])

  const handleView = (booking: BookingWithDetails) => {
    navigate(`/admin/bookings/${booking.id}`)
  }

  const handleEdit = (booking: BookingWithDetails) => {
    setSelectedBooking(booking)
    setIsCreating(false)
  }

  const handleDelete = (booking: BookingWithDetails) => {
    setBookingToDelete(booking)
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = async () => {
    if (bookingToDelete) {
      try {
        await deleteBooking(bookingToDelete.id)
        setShowDeleteConfirm(false)
        setBookingToDelete(null)
      } catch (error) {
        console.error('Failed to delete booking:', error)
      }
    }
  }

  const handleCreateNew = () => {
    setSelectedBooking(null)
    setIsCreating(true)
  }

  const handleCancel = () => {
    setSelectedBooking(null)
    setIsCreating(false)
  }

  const handleSuccess = () => {
    setSelectedBooking(null)
    setIsCreating(false)
    refreshBookings() // Refresh bookings after successful creation/edit
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        Error loading bookings: {error.message}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Bookings</h1>
        <Button onClick={handleCreateNew}>
          <PlusIcon className="h-5 w-5 mr-2" />
          New Booking
        </Button>
      </div>

      {isCreating || selectedBooking ? (
        <BookingForm 
          booking={selectedBooking} 
          onSuccess={handleSuccess} 
          onCancel={handleCancel}
          useAdminService={true} // Signal to use admin service instead of client service
        />
      ) : (
        <BookingList
          bookings={bookings}
          isLoading={isLoading}
          error={error}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && bookingToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete the booking for{' '}
                <span className="font-medium">
                  {bookingToDelete.mainCharterer?.firstName
                    ? `${bookingToDelete.mainCharterer.firstName} ${bookingToDelete.mainCharterer.lastName}`
                    : bookingToDelete.customer?.name || 'Unknown Customer'}
                </span>
                ? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setBookingToDelete(null)
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleConfirmDelete}>Delete</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
