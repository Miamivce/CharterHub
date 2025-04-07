import { useEffect, useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  ImageWithFallback,
} from '@/components/shared'
import { BookingWithDetails } from '@/contexts/types'
import { Yacht } from '@/types/yacht'
import { Destination } from '@/types/destination'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { yachtService } from '@/services/yachtService'
import { destinationService } from '@/services/destinationService'
import { useJWTAuth } from '@/contexts/auth/JWTAuthContext'
import { IdentificationIcon } from '@heroicons/react/24/outline'
import { getBookingsByCustomerId } from '@/services/bookingService'

interface DashboardStats {
  daysUntilNextCharter: number | null
  nextCharterDate: string | null
  hasPassport: boolean
  totalBookings: number
}

function FeaturedCardSkeleton() {
  return (
    <Card>
      <div className="aspect-w-16 aspect-h-9">
        <Skeleton height="100%" />
      </div>
      <CardContent className="p-4">
        <Skeleton width={150} height={24} className="mb-2" />
        <Skeleton width={200} />
      </CardContent>
    </Card>
  )
}

function StatCard({
  title,
  value,
  icon: Icon,
  variant = 'default',
  onClick,
}: {
  title: string
  value: string | number | React.ReactNode
  icon: React.ComponentType<any>
  variant?: 'default' | 'success'
  onClick?: () => void
}) {
  const cardClasses = `p-6 rounded-lg ${
    variant === 'success' ? 'bg-green-50 border border-green-100' : 'bg-white'
  } ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`

  return (
    <div className={cardClasses} onClick={onClick}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p
            className={`text-2xl font-semibold mt-1 ${
              variant === 'success' ? 'text-green-600' : 'text-gray-900'
            }`}
          >
            {value}
          </p>
        </div>
        <Icon className={`h-8 w-8 ${variant === 'success' ? 'text-green-500' : 'text-gray-400'}`} />
      </div>
    </div>
  )
}

function FeaturedCard({
  title,
  image,
  onClick,
  type = 'other',
}: {
  title: string
  image: string
  onClick: () => void
  type?: 'yacht' | 'destination' | 'other'
}) {
  return (
    <Card
      variant="hover"
      className="cursor-pointer group transition-all duration-300 hover:shadow-lg"
      onClick={onClick}
    >
      <div className="aspect-w-16 aspect-h-9 relative overflow-hidden rounded-t-lg">
        <ImageWithFallback
          src={image}
          alt={title}
          type={type}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-semibold text-lg text-white group-hover:text-orange-200 transition-colors">
            {title}
          </h3>
        </div>
      </div>
    </Card>
  )
}

export function ClientDashboard() {
  const navigate = useNavigate()
  const { user, refreshUserData } = useJWTAuth()
  const [userName, setUserName] = useState(user ? `${user.firstName} ${user.lastName}` : 'Guest')
  const [stats, setStats] = useState<DashboardStats>({
    daysUntilNextCharter: null,
    nextCharterDate: null,
    hasPassport: false,
    totalBookings: 0,
  })
  const [userBookings, setUserBookings] = useState<BookingWithDetails[]>([])

  // Get all yachts and destinations
  const [yachts, setYachts] = useState<Yacht[]>([])
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [yachtsLoading, setYachtsLoading] = useState(true)
  const [destinationsLoading, setDestinationsLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Add a ref to track initial mount
  const initialMountRef = useRef(true)
  // Add a ref to prevent unnecessary refreshes
  const isRefreshingRef = useRef(false)

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

  // Refresh user data only on initial mount
  useEffect(() => {
    // Skip if the Layout has already refreshed or a refresh is in progress
    if (initialMountRef.current && !isRefreshingRef.current) {
      initialMountRef.current = false

      async function refreshUserDataOnMount() {
        console.log('Dashboard: Initial user data refresh on mount')
        try {
          isRefreshingRef.current = true
          await refreshUserData()

          // After refreshing user data, check if the user object is available
          if (user) {
            console.log('Dashboard: Initial user data refresh successful')
            setUserName(`${user.firstName} ${user.lastName}`)
          }
        } catch (error) {
          console.error('Dashboard: Error refreshing user data:', error)
        } finally {
          isRefreshingRef.current = false
        }
      }

      refreshUserDataOnMount()
    }
  }, [refreshUserData]) // Add refreshUserData to dependency array

  // Update userName whenever user data changes, without triggering refresh
  useEffect(() => {
    if (user) {
      // Track changes to user data including timestamp changes for synchronization
      console.log(
        'Dashboard: User data updated, timestamp:',
        user._timestamp,
        'lastName:',
        user.lastName
      )
      setUserName(`${user.firstName} ${user.lastName}`)
    }
  }, [user?.firstName, user?.lastName]) // Directly depend on the name properties that we're using

  // Create a seeded random selection that changes every 2 hours
  const getFeaturedItems = useMemo(() => {
    if (!yachts.length || !destinations.length) return { featuredYacht: null, featuredDestination: null }

    // Create a seed based on the current 2-hour block
    const now = new Date()
    const twoHourBlock = Math.floor(now.getTime() / (2 * 60 * 60 * 1000))
    let seedValue = twoHourBlock

    // Fisher-Yates shuffle with seeded random
    const shuffle = <T,>(array: T[]): T[] => {
      const shuffled = [...array]
      for (let i = shuffled.length - 1; i > 0; i--) {
        seedValue = (seedValue * 16807) % 2147483647
        const j = seedValue % (i + 1)
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      return shuffled
    }

    // Shuffle both arrays with the same seed
    const shuffledYachts = shuffle(yachts)
    const shuffledDestinations = shuffle(destinations)

    return {
      featuredYacht: shuffledYachts[0] || null,
      featuredDestination: shuffledDestinations[0] || null,
    }
  }, [yachts, destinations])

  // Load the user's bookings and calculate stats
  useEffect(() => {
    let isMounted = true

    async function loadBookingsAndStats() {
      if (!user) return;
      
      try {
        setIsLoading(true)
        
        // Get user's bookings
        const bookings = await getBookingsByCustomerId(user.id.toString())
        
        if (isMounted) {
          setUserBookings(bookings)
          
          // Calculate stats from real data
          const confirmedBookings = bookings.filter((b: BookingWithDetails) => b.status === 'confirmed')
          
          // Find the next upcoming booking
          const today = new Date()
          const upcomingBookings = confirmedBookings
            .filter((b: BookingWithDetails) => new Date(b.startDate) > today)
            .sort((a: BookingWithDetails, b: BookingWithDetails) => 
              new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
            )
          
          const nextBooking = upcomingBookings.length > 0 ? upcomingBookings[0] : null
          
          // Calculate days until next charter
          let daysUntil = null
          let nextDate = null
          
          if (nextBooking) {
            const bookingDate = new Date(nextBooking.startDate)
            const timeDiff = bookingDate.getTime() - today.getTime()
            daysUntil = Math.ceil(timeDiff / (1000 * 3600 * 24))
            nextDate = nextBooking.startDate
          }
          
          // Check for passport documents
          const hasPassport = false // This would need to be based on document checks
          
          setStats({
            daysUntilNextCharter: daysUntil,
            nextCharterDate: nextDate,
            hasPassport: hasPassport,
            totalBookings: bookings.length,
          })
          
          setError(null)
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
        if (isMounted) {
          setError('Failed to load dashboard data. Please try again.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadBookingsAndStats()

    return () => {
      isMounted = false
    }
  }, [user])

  const { featuredYacht, featuredDestination } = getFeaturedItems

  const handlePassportClick = () => {
    navigate('/client/documents')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {userName}</h1>
        <p className="text-text-secondary mt-2">Explore your luxury charter experience</p>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Days Until Next Charter"
          value={stats.daysUntilNextCharter !== null ? stats.daysUntilNextCharter : 'No upcoming'}
          icon={(props) => (
            <svg
              {...props}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
        />
        <StatCard
          title="Passport"
          value={stats.hasPassport ? 'View Passport' : 'Upload Passport'}
          variant={stats.hasPassport ? 'success' : 'default'}
          onClick={handlePassportClick}
          icon={(props) => <IdentificationIcon {...props} />}
        />
        <StatCard
          title="Total Bookings"
          value={stats.totalBookings}
          icon={(props) => (
            <svg
              {...props}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" />
            </svg>
          )}
        />
      </div>

      {/* Featured Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Featured Yacht */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Featured Yacht</h2>
            <Button
              variant="secondary"
              className="border-primary text-primary hover:bg-primary/5"
              onClick={() => navigate('/yachts')}
            >
              View All
            </Button>
          </div>
          {yachtsLoading ? (
            <FeaturedCardSkeleton />
          ) : featuredYacht ? (
            <FeaturedCard
              title={featuredYacht.name}
              image={
                featuredYacht.featuredImage ||
                'https://images.unsplash.com/photo-1540946485063-a23a339b98df?w=800&q=80'
              }
              onClick={() => navigate(`/yachts/${featuredYacht.id}`)}
              type="yacht"
            />
          ) : (
            <Card>
              <CardContent className="p-4 text-center text-gray-500">
                No yachts available
              </CardContent>
            </Card>
          )}
        </div>

        {/* Featured Destination */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Featured Destination</h2>
            <Button
              variant="secondary"
              className="border-primary text-primary hover:bg-primary/5"
              onClick={() => navigate('/destinations')}
            >
              View All
            </Button>
          </div>
          {destinationsLoading ? (
            <FeaturedCardSkeleton />
          ) : featuredDestination ? (
            <FeaturedCard
              title={featuredDestination.name}
              image={
                featuredDestination.featuredImage ||
                'https://images.unsplash.com/photo-1530538095376-a4936b35b5f0?w=800&q=80'
              }
              onClick={() => navigate(`/destinations/${featuredDestination.id}`)}
              type="destination"
            />
          ) : (
            <Card>
              <CardContent className="p-4 text-center text-gray-500">
                No destinations available
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
