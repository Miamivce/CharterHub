import { useState, useMemo } from 'react'
import { format, parseISO, isFuture, isPast, compareAsc } from 'date-fns'
import { BookingWithDetails } from '@/contexts/types'
import { Card, CardContent, Button } from '@/components/shared'
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  MapPinIcon,
  CalendarIcon,
  UserIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline'

interface BookingListProps {
  bookings?: BookingWithDetails[]
  isLoading: boolean
  error?: Error | null
  onView?: (booking: BookingWithDetails) => void
  onEdit?: (booking: BookingWithDetails) => void
  onDelete?: (booking: BookingWithDetails) => void
}

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A'
  try {
    return format(parseISO(dateString), 'MMM d, yyyy')
  } catch (error) {
    console.error(`Invalid date format: ${dateString}`)
    return 'Invalid Date'
  }
}

const getStatusColor = (status: string) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',
  }
  return colors[status as keyof typeof colors] || colors.pending
}

type SortOption = 'next-up' | 'date-asc' | 'date-desc'

export function BookingList({
  bookings = [],
  isLoading,
  error,
  onView,
  onEdit,
  onDelete,
}: BookingListProps) {
  const [sortOption, setSortOption] = useState<SortOption>('next-up')
  const [statusFilter, setStatusFilter] = useState<BookingWithDetails['status'] | 'all'>('all')

  // Memoized sorted and filtered bookings
  const sortedAndFilteredBookings = useMemo(() => {
    if (!bookings) return []

    let filtered = bookings
    if (statusFilter !== 'all') {
      filtered = bookings.filter((booking) => booking.status === statusFilter)
    }

    return [...filtered].sort((a, b) => {
      const aDate = parseISO(a.startDate)
      const bDate = parseISO(b.startDate)

      switch (sortOption) {
        case 'next-up':
          // Put future bookings first, sorted by closest date
          const aIsFuture = isFuture(aDate)
          const bIsFuture = isFuture(bDate)

          if (aIsFuture && !bIsFuture) return -1
          if (!aIsFuture && bIsFuture) return 1
          return compareAsc(aDate, bDate)

        case 'date-asc':
          return compareAsc(aDate, bDate)

        case 'date-desc':
          return compareAsc(bDate, aDate)

        default:
          return 0
      }
    })
  }, [bookings, sortOption, statusFilter])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={`skeleton-${i}`} className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <div className="text-center text-red-500">{error.message}</div>
        </CardContent>
      </Card>
    )
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-gray-500">No bookings found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <select
            className="form-select rounded-md border-gray-300 text-sm"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
          >
            <option value="next-up">Next Up</option>
            <option value="date-asc">Date (Oldest First)</option>
            <option value="date-desc">Date (Newest First)</option>
          </select>
          <select
            className="form-select rounded-md border-gray-300 text-sm"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as BookingWithDetails['status'] | 'all')
            }
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedAndFilteredBookings.map((booking) => (
          <div
            key={booking.id}
            className="relative group rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onView?.(booking)}
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              <img
                src={
                  booking.yacht?.imageUrl ||
                  'https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&w=2000&q=80'
                }
                alt={booking.yacht?.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/50 to-black/25"></div>
            </div>

            {/* Content */}
            <div className="relative p-6 h-64 flex flex-col">
              {/* Status Badge */}
              <span
                className={`absolute top-4 right-4 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                  booking.status || 'pending'
                )}`}
              >
                {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1) || 'N/A'}
              </span>

              {/* Main Content */}
              <div className="flex-1 text-white">
                <div className="flex items-center space-x-2 mb-2">
                  <UserIcon className="h-4 w-4" />
                  <h3 className="text-lg font-semibold">
                    {booking.mainCharterer?.firstName} {booking.mainCharterer?.lastName}
                  </h3>
                </div>
                <div className="flex items-center space-x-2 mb-2 text-sm">
                  <CalendarIcon className="h-4 w-4" />
                  <span>
                    {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                  </span>
                </div>
                <div className="flex items-center space-x-2 mb-4 text-sm">
                  <MapPinIcon className="h-4 w-4" />
                  <span>{booking.destination?.name || 'N/A'}</span>
                </div>
                <p className="text-lg font-semibold mb-2">{booking.yacht?.name || 'N/A'}</p>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t border-white/20">
                {onEdit && (
                  <Button
                    variant="text"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation() // Prevent card click
                      onEdit(booking)
                    }}
                    title="Edit Booking"
                    className="text-white hover:text-primary"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="text"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation() // Prevent card click
                      onDelete(booking)
                    }}
                    title="Delete Booking"
                    className="text-white hover:text-primary"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
