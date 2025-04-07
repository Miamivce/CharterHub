import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useJWTAuth } from '@/contexts/auth/JWTAuthContext'
import { bookingService } from '@/services/bookingService'
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/shared'
import { format } from 'date-fns'
import {
  CalendarIcon,
  MapPinIcon,
  UserIcon,
  DocumentIcon,
  ArrowLeftIcon,
  LifebuoyIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import { YachtTracker } from '@/components/client/YachtTracker'

// Skeleton component for loading state
function BookingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    </div>
  )
}

export function BookingDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useJWTAuth()
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!id) {
        setError('Booking ID is required')
        setLoading(false)
        return
      }

      try {
        console.log('Fetching booking details for ID:', id)
        const bookingData = await bookingService.getBooking(id)
        console.log('Booking data retrieved:', bookingData)

        if (!bookingData) {
          console.error('No booking data returned for ID:', id)
          setError('Booking not found')
          setLoading(false)
          return
        }

        // Verify that the current user has access to this booking
        const isMainCharterer =
          bookingData.mainCharterer?.email?.toLowerCase() === user?.email?.toLowerCase()
        const isGuest = bookingData.guestList?.some(
          (guest: any) => guest.email?.toLowerCase() === user?.email?.toLowerCase()
        )

        console.log('Access check:', {
          userEmail: user?.email?.toLowerCase(),
          mainChartererEmail: bookingData.mainCharterer?.email?.toLowerCase(),
          isMainCharterer,
          isGuest,
        })

        if (!isMainCharterer && !isGuest) {
          console.error('User does not have access to this booking')
          setError('You do not have access to this booking')
          setLoading(false)
          return
        }

        // Filter documents if user is a guest - only show docs with visibility='all'
        if (isGuest && bookingData.documents) {
          bookingData.documents = bookingData.documents.filter(
            (doc: any) => doc.visibility === 'all'
          )
          bookingData.userRole = 'guest'
        } else {
          bookingData.userRole = 'charterer'
        }

        setBooking(bookingData)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching booking details:', err)
        setError('Failed to load booking details. Please try again later.')
        setLoading(false)
      }
    }

    fetchBookingDetails()
  }, [id, user])

  // Helper function to format date ranges
  const formatDateRange = (startDate: string, endDate: string) => {
    return `${format(new Date(startDate), 'MMM d, yyyy')} - ${format(new Date(endDate), 'MMM d, yyyy')}`
  }

  // Helper to get status color class
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Helper to get yacht image URL
  const getYachtImageUrl = (booking: any) => {
    // Try to get featured image from yacht object
    if (booking.yacht?.featuredImage) {
      return booking.yacht.featuredImage
    }

    // Fallback to a default yacht image
    return 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800&q=80'
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <Link
          to="../bookings"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1" /> Back to Bookings
        </Link>
        <BookingSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6">
        <Link to=".." className="inline-flex items-center mb-6 text-blue-600 hover:text-blue-800">
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Bookings
        </Link>

        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          <h2 className="text-lg font-semibold mb-2">Error</h2>
          <p>{error}</p>
          <div className="mt-4 p-4 bg-gray-100 rounded text-sm font-mono text-gray-700">
            <p>Debugging information:</p>
            <p>Booking ID: {id}</p>
            <p>Current URL: {window.location.href}</p>
            <button
              onClick={() => (window.location.href = '/bookings')}
              className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-xs"
            >
              Return to bookings list
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="container mx-auto py-6">
        <Link
          to="../bookings"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1" /> Back to Bookings
        </Link>
        <Card className="mb-6">
          <CardContent>
            <div className="text-center py-12">
              <p className="text-xl text-gray-500">Booking not found</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <Link
        to="../bookings"
        className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
      >
        <ArrowLeftIcon className="w-4 h-4 mr-1" /> Back to Bookings
      </Link>

      {/* Booking Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{booking.yacht?.name || 'Yacht Charter'}</h1>
          <p className="text-gray-500 mt-1">
            Booking #{booking.id}{' '}
            <span
              className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}
            >
              {booking.status}
            </span>
            {booking.userRole === 'guest' && (
              <span className="ml-2 text-blue-500">(You are a guest)</span>
            )}
          </p>
        </div>
        <Button variant="primary">Contact Support</Button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Booking Details and Guests */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <CalendarIcon className="mr-3 h-5 w-5 text-gray-500" />
                  <div>
                    <span className="font-medium block">Charter Period</span>
                    <span>{formatDateRange(booking.startDate, booking.endDate)}</span>
                  </div>
                </div>

                {(booking.destination?.name || booking.destination) && (
                  <div className="flex items-center">
                    <MapPinIcon className="mr-3 h-5 w-5 text-gray-500" />
                    <div>
                      <span className="font-medium block">Destination</span>
                      <span>{booking.destination?.name || booking.destination}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center">
                  <UserIcon className="mr-3 h-5 w-5 text-gray-500" />
                  <div>
                    <span className="font-medium block">Main Charterer</span>
                    <span>
                      {booking.mainCharterer?.firstName} {booking.mainCharterer?.lastName}
                      {booking.mainCharterer?.email && ` (${booking.mainCharterer.email})`}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guest List Card */}
          <Card>
            <CardHeader>
              <CardTitle>Guest List</CardTitle>
            </CardHeader>
            <CardContent>
              {booking.guestList && booking.guestList.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {booking.guestList.map((guest: any, index: number) => (
                    <li key={index} className="py-3 flex items-center">
                      <UsersIcon className="mr-3 h-5 w-5 text-gray-500" />
                      <div>
                        <span className="font-medium block">
                          {guest.firstName} {guest.lastName}
                        </span>
                        <span className="text-sm text-gray-500">{guest.email}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No guests registered for this booking</p>
              )}
            </CardContent>
          </Card>

          {/* Documents Card */}
          <Card>
            <CardHeader>
              <CardTitle>
                {booking.userRole === 'charterer' ? 'Booking Documents' : 'Shared Documents'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {booking.documents && booking.documents.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {booking.documents.map((doc: any) => (
                    <li key={doc.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center">
                        <DocumentIcon className="mr-3 h-5 w-5 text-gray-500" />
                        <div>
                          <span className="font-medium block">{doc.name}</span>
                          <span className="text-sm text-gray-500">
                            {doc.type} • Added {format(new Date(doc.uploadedAt), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        onClick={() => window.open(doc.fileUrl, '_blank')}
                      >
                        View
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No documents available for this booking</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Yacht Info and Live Tracking */}
        <div className="space-y-6">
          {/* Yacht Card */}
          <Card>
            <div className="h-48 overflow-hidden rounded-t-lg">
              <img
                src={getYachtImageUrl(booking)}
                alt={booking.yacht?.name || 'Charter yacht'}
                className="w-full h-full object-cover"
              />
            </div>
            <CardHeader>
              <CardTitle>{booking.yacht?.name || 'Charter Yacht'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {booking.yacht?.type && (
                  <div className="flex items-center">
                    <LifebuoyIcon className="mr-2 h-5 w-5 text-gray-500" />
                    <span>
                      <strong>Type:</strong> {booking.yacht.type}
                    </span>
                  </div>
                )}
                {booking.yacht?.length && (
                  <div className="flex items-start">
                    <LifebuoyIcon className="mr-2 h-5 w-5 text-gray-500" />
                    <div>
                      <strong>Length:</strong> {booking.yacht.length} meters
                    </div>
                  </div>
                )}
                {booking.yacht?.capacity && (
                  <div className="flex items-start">
                    <UsersIcon className="mr-2 h-5 w-5 text-gray-500" />
                    <div>
                      <strong>Capacity:</strong> {booking.yacht.capacity} guests
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Live Tracking Card */}
          <Card>
            <CardHeader>
              <CardTitle>Yacht Location</CardTitle>
            </CardHeader>
            <CardContent>
              <YachtTracker bookingId={booking.id} yachtId={booking.yacht?.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default BookingDetail
