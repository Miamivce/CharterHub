import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared'
import { mockApi } from '@/services/mockApi'
import { BookingWithDetails } from '@/contexts/types'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { format } from 'date-fns'

interface AdminDashboardStats {
  totalBookings: number
  activeCharters: number
  totalRevenue: number
  nextMonthBookings: number
}

function StatSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton width={150} height={24} />
      </CardHeader>
      <CardContent>
        <Skeleton width={80} height={36} className="mb-2" />
        <Skeleton width={120} />
      </CardContent>
    </Card>
  )
}

function BookingSkeleton() {
  return (
    <tr>
      <td colSpan={5} className="p-4">
        <Skeleton count={1} height={40} />
      </td>
    </tr>
  )
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminDashboardStats>({
    totalBookings: 0,
    activeCharters: 0,
    totalRevenue: 0,
    nextMonthBookings: 0,
  })
  const [recentBookings, setRecentBookings] = useState<BookingWithDetails[]>([])
  const [upcomingBookings, setUpcomingBookings] = useState<BookingWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadDashboardData() {
      try {
        setIsLoading(true)
        setError(null)

        // Get current date for calculations
        const now = new Date()
        const oneMonthLater = new Date()
        oneMonthLater.setMonth(oneMonthLater.getMonth() + 1)

        // Fetch mock bookings
        const mockBookings: BookingWithDetails[] = [
          {
            id: 'booking-001',
            customerId: 'customer-001',
            yachtId: 'yacht-001',
            guests: 8,
            mainCharterer: {
              id: 'customer-001',
              firstName: 'John',
              lastName: 'Smith',
              email: 'john@example.com',
            },
            guestList: [],
            documents: [],
            destination: {
              id: 'destination-001',
              name: 'Caribbean',
              isFromApi: false,
            },
            customer: {
              id: 'customer-001',
              name: 'John Smith',
              email: 'john@example.com',
            },
            yacht: {
              id: 'yacht-001',
              name: 'Ocean Breeze',
              isFromApi: false,
              specifications: {
                length: '40m',
                capacity: 12,
                crew: 6,
              },
              pricing: {
                basePrice: 15000,
                currency: 'USD',
              },
            },
            status: 'confirmed',
            startDate: '2024-07-01',
            endDate: '2024-07-08',
            totalPrice: 105000,
          },
          {
            id: 'booking-002',
            customerId: 'customer-002',
            yachtId: 'yacht-002',
            guests: 6,
            mainCharterer: {
              id: 'customer-002',
              firstName: 'Jane',
              lastName: 'Doe',
              email: 'jane@example.com',
            },
            guestList: [],
            documents: [],
            destination: {
              id: 'destination-002',
              name: 'Mediterranean',
              isFromApi: false,
            },
            customer: {
              id: 'customer-002',
              name: 'Jane Doe',
              email: 'jane@example.com',
            },
            yacht: {
              id: 'yacht-002',
              name: 'Sea Harmony',
              isFromApi: false,
              specifications: {
                length: '35m',
                capacity: 10,
                crew: 5,
              },
              pricing: {
                basePrice: 12000,
                currency: 'USD',
              },
            },
            status: 'confirmed',
            startDate: '2024-06-15',
            endDate: '2024-06-22',
            totalPrice: 84000,
          },
          {
            id: 'booking-003',
            customerId: 'customer-003',
            yachtId: 'yacht-003',
            guests: 10,
            mainCharterer: {
              id: 'customer-003',
              firstName: 'Robert',
              lastName: 'Johnson',
              email: 'robert@example.com',
            },
            guestList: [],
            documents: [],
            destination: {
              id: 'destination-003',
              name: 'Bahamas',
              isFromApi: false,
            },
            customer: {
              id: 'customer-003',
              name: 'Robert Johnson',
              email: 'robert@example.com',
            },
            yacht: {
              id: 'yacht-003',
              name: 'Ocean Explorer',
              isFromApi: false,
              specifications: {
                length: '45m',
                capacity: 14,
                crew: 7,
              },
              pricing: {
                basePrice: 18000,
                currency: 'USD',
              },
            },
            status: 'pending',
            startDate: '2024-08-10',
            endDate: '2024-08-17',
            totalPrice: 126000,
          },
          {
            id: 'booking-004',
            customerId: 'customer-004',
            yachtId: 'yacht-004',
            guests: 12,
            mainCharterer: {
              id: 'customer-004',
              firstName: 'Sarah',
              lastName: 'Wilson',
              email: 'sarah@example.com',
            },
            guestList: [],
            documents: [],
            destination: {
              id: 'destination-004',
              name: 'Greek Islands',
              isFromApi: false,
            },
            customer: {
              id: 'customer-004',
              name: 'Sarah Wilson',
              email: 'sarah@example.com',
            },
            yacht: {
              id: 'yacht-004',
              name: 'Crystal Waters',
              isFromApi: false,
              specifications: {
                length: '50m',
                capacity: 16,
                crew: 8,
              },
              pricing: {
                basePrice: 22000,
                currency: 'USD',
              },
            },
            status: 'confirmed',
            startDate: '2024-05-20',
            endDate: '2024-05-27',
            totalPrice: 154000,
          },
          {
            id: 'booking-005',
            customerId: 'customer-005',
            yachtId: 'yacht-005',
            guests: 14,
            mainCharterer: {
              id: 'customer-005',
              firstName: 'Michael',
              lastName: 'Brown',
              email: 'michael@example.com',
            },
            guestList: [],
            documents: [],
            destination: {
              id: 'destination-005',
              name: 'French Riviera',
              isFromApi: false,
            },
            customer: {
              id: 'customer-005',
              name: 'Michael Brown',
              email: 'michael@example.com',
            },
            yacht: {
              id: 'yacht-005',
              name: 'Royal Wave',
              isFromApi: false,
              specifications: {
                length: '55m',
                capacity: 18,
                crew: 9,
              },
              pricing: {
                basePrice: 25000,
                currency: 'USD',
              },
            },
            status: 'completed',
            startDate: '2024-04-05',
            endDate: '2024-04-12',
            totalPrice: 175000,
          },
        ]

        // Calculate stats from the mock bookings
        const activeCharters = mockBookings.filter(
          (booking) => booking.status === 'confirmed' && new Date(booking.endDate) >= now
        ).length

        const nextMonthBookings = mockBookings.filter((booking) => {
          const startDate = new Date(booking.startDate)
          return startDate >= now && startDate <= oneMonthLater
        }).length

        // Filter for upcoming and recent bookings
        const upcomingBookingsList = mockBookings
          .filter((booking) => new Date(booking.startDate) >= now)
          .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
          .slice(0, 5)

        const recentBookingsList = [...mockBookings]
          .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
          .slice(0, 5)

        // Create stats object
        const mockStats: AdminDashboardStats = {
          totalBookings: mockBookings.length,
          activeCharters: activeCharters,
          totalRevenue: 2500000,
          nextMonthBookings: nextMonthBookings,
        }

        const [statsData, bookingsData] = await Promise.all([
          mockApi.get<AdminDashboardStats>(mockStats),
          mockApi.get<BookingWithDetails[]>(mockBookings),
        ])

        if (isMounted) {
          setStats(statsData)
          setRecentBookings(recentBookingsList)
          setUpcomingBookings(upcomingBookingsList)
          setError(null)
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
        if (isMounted) {
          setError('Failed to load dashboard data. Please try again.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadDashboardData()

    return () => {
      isMounted = false
    }
  }, [])

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        {error}
        <button
          onClick={() => window.location.reload()}
          className="ml-4 text-sm underline hover:no-underline"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-text-secondary mt-2">Overview of charter operations</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Total Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.totalBookings}</p>
                <p className="text-text-secondary text-sm">All time bookings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Charters</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.activeCharters}</p>
                <p className="text-text-secondary text-sm">Currently confirmed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
                <p className="text-text-secondary text-sm">Gross revenue</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Next Month Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.nextMonthBookings}</p>
                <p className="text-text-secondary text-sm">Starting in 30 days</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Recent Bookings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Bookings</h2>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Customer</th>
                    <th className="text-left p-4">Yacht</th>
                    <th className="text-left p-4">Dates</th>
                    <th className="text-right p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <>
                      <BookingSkeleton />
                      <BookingSkeleton />
                      <BookingSkeleton />
                    </>
                  ) : recentBookings.length > 0 ? (
                    recentBookings.map((booking) => (
                      <tr key={booking.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">{booking.customer.name}</td>
                        <td className="p-4">{booking.yacht.name}</td>
                        <td className="p-4">
                          <div className="text-sm">
                            {new Date(booking.startDate).toLocaleDateString()}
                            <span className="text-text-secondary mx-1">to</span>
                            {new Date(booking.endDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              booking.status === 'confirmed'
                                ? 'bg-green-100 text-green-800'
                                : booking.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-text-secondary">
                        No recent bookings found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 text-center">
              <a href="/admin/bookings" className="text-blue-600 hover:text-blue-800 font-medium">
                View all bookings →
              </a>
            </div>
          </Card>
        </div>

        {/* Upcoming Bookings */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Upcoming Bookings</h2>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Customer</th>
                    <th className="text-left p-4">Yacht</th>
                    <th className="text-left p-4">Dates</th>
                    <th className="text-right p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <>
                      <BookingSkeleton />
                      <BookingSkeleton />
                      <BookingSkeleton />
                    </>
                  ) : upcomingBookings.length > 0 ? (
                    upcomingBookings.map((booking) => (
                      <tr key={booking.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">{booking.customer.name}</td>
                        <td className="p-4">{booking.yacht.name}</td>
                        <td className="p-4">
                          <div className="text-sm">
                            {new Date(booking.startDate).toLocaleDateString()}
                            <span className="text-text-secondary mx-1">to</span>
                            {new Date(booking.endDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              booking.status === 'confirmed'
                                ? 'bg-green-100 text-green-800'
                                : booking.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-text-secondary">
                        No upcoming bookings found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 text-center">
              <a href="/admin/bookings" className="text-blue-600 hover:text-blue-800 font-medium">
                View all bookings →
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
