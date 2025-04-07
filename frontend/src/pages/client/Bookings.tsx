import React, { useEffect, useState } from 'react'
import { useJWTAuth } from '@/contexts/auth/JWTAuthContext'
import { getBookingsByCustomerId } from '@/services/bookingService'
import { Card, Button } from '@/components/shared'
import { format } from 'date-fns'
import {
  CalendarIcon,
  MapPinIcon,
  LifebuoyIcon,
  InformationCircleIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'

export function ClientBookings() {
  const { user } = useJWTAuth()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user?.email) {
        console.error('No user email available')
        setError('Unable to fetch bookings: User not logged in')
        setLoading(false)
        return
      }

      try {
        console.log('Fetching bookings for user:', user.id, user.email)
        // API uses the JWT token to identify the user
        const userBookings = await getBookingsByCustomerId(user.id.toString())
        console.log('Fetched bookings:', userBookings)

        // ENHANCED DEBUGGING: Log the full structure of bookings for inspection
        console.log('BOOKING CHECK - Full booking data:', JSON.stringify(userBookings, null, 2))

        // Verify bookings to ensure user is actually connected to each booking
        const verifiedBookings = userBookings.filter((booking) => {
          // Check if user is main charterer
          const isMainCharterer =
            booking.mainCharterer?.email?.toLowerCase() === user.email?.toLowerCase()

          // Check if user is in guest list
          const isGuest = booking.guestList?.some(
            (guest: any) => guest.email?.toLowerCase() === user.email?.toLowerCase()
          )

          // ENHANCED DEBUGGING: Log each booking verification status
          console.log('BOOKING CHECK - Booking:', booking.id, {
            userEmail: user.email?.toLowerCase(),
            mainChartererEmail: booking.mainCharterer?.email?.toLowerCase(),
            isMainCharterer,
            guestEmails: booking.guestList?.map((g: any) => g.email?.toLowerCase()),
            isGuest,
            verified: isMainCharterer || isGuest,
          })

          // Only keep bookings where user is either main charterer or guest
          return isMainCharterer || isGuest
        })

        // Log any discrepancies for debugging
        if (verifiedBookings.length !== userBookings.length) {
          console.warn(
            `Filtered out ${userBookings.length - verifiedBookings.length} bookings where user is not connected`
          )
        }

        // Process bookings to filter documents based on user role
        const processedBookings = verifiedBookings.map((booking) => {
          const isMainCharterer =
            booking.mainCharterer?.email?.toLowerCase() === user.email?.toLowerCase()
          const isGuest =
            !isMainCharterer &&
            booking.guestList?.some(
              (guest: any) => guest.email?.toLowerCase() === user.email?.toLowerCase()
            )

          // Filter documents if user is a guest - only show documents with 'all' visibility
          if (isGuest && booking.documents) {
            return {
              ...booking,
              documents: booking.documents.filter((doc: any) => doc.visibility === 'all'),
              userRole: 'guest',
            }
          }

          return {
            ...booking,
            userRole: isMainCharterer ? 'charterer' : 'guest',
          }
        })

        setBookings(processedBookings)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching bookings:', err)
        setError('Failed to load bookings. Please try again later.')
        setLoading(false)
      }
    }

    fetchBookings()
  }, [user])

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

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Bookings</h1>
      </div>

      {loading && (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && bookings.length === 0 && (
        <Card className="mb-6">
          <div className="p-6">
            <div className="text-center py-12">
              <p className="text-xl text-gray-500 mb-4">You don't have any bookings yet</p>
              <Button variant="primary" onClick={() => (window.location.href = '/destinations')}>
                Explore Destinations
              </Button>
            </div>
          </div>
        </Card>
      )}

      {!loading && !error && bookings.length > 0 && (
        <div className="grid grid-cols-1 gap-6">
          {bookings.map((booking: any) => (
            <Card key={booking.id} className="overflow-hidden">
              <div className="flex flex-col md:flex-row">
                {/* Yacht Image */}
                <div className="md:w-1/3 h-48 md:h-auto relative overflow-hidden max-h-56">
                  <img
                    src={getYachtImageUrl(booking)}
                    alt={booking.yacht?.name || 'Charter yacht'}
                    className="object-cover w-full h-full rounded-tl-lg rounded-bl-lg"
                  />
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}
                    >
                      {booking.status}
                    </span>
                  </div>
                </div>

                {/* Booking Information */}
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold">
                        {booking.yacht?.name || booking.yachtName || 'Charter Booking'}
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Booking #{booking.id}
                        {booking.userRole === 'guest' && (
                          <span className="ml-2 text-blue-500">(You are a guest)</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center">
                      <CalendarIcon className="mr-2 h-5 w-5 text-gray-500" />
                      <span className="font-medium">
                        {formatDateRange(booking.startDate, booking.endDate)}
                      </span>
                    </div>

                    {(booking.destination?.name || booking.destination) && (
                      <div className="flex items-center">
                        <MapPinIcon className="mr-2 h-5 w-5 text-gray-500" />
                        <span>{booking.destination?.name || booking.destination}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Link
                      to={`/bookings/${booking.id}`}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      View Details <ChevronRightIcon className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default ClientBookings
