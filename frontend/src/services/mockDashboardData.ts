import { DashboardStats, BookingWithDetails, CustomerWithStats } from '@/contexts/types'

// Mock data
const MOCK_STATS: DashboardStats = {
  totalBookings: 24,
  totalCustomers: 156,
  totalRevenue: 45231,
  availableYachts: 12,
}

const MOCK_RECENT_BOOKINGS: BookingWithDetails[] = [
  {
    id: 'booking-001',
    yachtId: 'yacht-001',
    customerId: 'customer-001',
    startDate: '2024-03-15',
    endDate: '2024-03-22',
    guests: 6,
    status: 'confirmed',
    totalPrice: 12500,
    customer: {
      id: 'customer-001',
      name: 'John Doe',
      email: 'john.doe@example.com'
    },
    yacht: {
      id: 'yacht-001',
      name: 'Ocean Breeze',
      isFromApi: false,
      specifications: {
        length: '30m',
        capacity: 6,
        crew: 4
      },
      pricing: {
        basePrice: 12500,
        currency: 'USD'
      }
    },
    destination: {
      id: 'destination-001',
      name: 'Mediterranean',
      isFromApi: false
    },
    specialRequests: 'Champagne welcome package',
    mainCharterer: {
      id: 'customer-001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com'
    },
    guestList: [],
    documents: []
  },
  {
    id: 'booking-002',
    yachtId: 'yacht-002',
    customerId: 'customer-002',
    startDate: '2024-03-18',
    endDate: '2024-03-25',
    guests: 4,
    status: 'pending',
    totalPrice: 8900,
    customer: {
      id: 'customer-002',
      name: 'Sarah Smith',
      email: 'sarah.smith@example.com'
    },
    yacht: {
      id: 'yacht-002',
      name: 'Sea Spirit',
      isFromApi: false,
      specifications: {
        length: '25m',
        capacity: 4,
        crew: 3
      },
      pricing: {
        basePrice: 8900,
        currency: 'USD'
      }
    },
    destination: {
      id: 'destination-002',
      name: 'Caribbean',
      isFromApi: false
    },
    specialRequests: 'Gluten-free meals',
    mainCharterer: {
      id: 'customer-002',
      firstName: 'Sarah',
      lastName: 'Smith',
      email: 'sarah.smith@example.com'
    },
    guestList: [],
    documents: []
  },
  {
    id: 'booking-003',
    yachtId: 'yacht-003',
    customerId: 'customer-003',
    startDate: '2024-03-20',
    endDate: '2024-03-27',
    guests: 8,
    status: 'confirmed',
    totalPrice: 15700,
    customer: {
      id: 'customer-003',
      name: 'Michael Johnson',
      email: 'michael.johnson@example.com'
    },
    yacht: {
      id: 'yacht-003',
      name: 'Wind Dancer',
      isFromApi: false,
      specifications: {
        length: '35m',
        capacity: 8,
        crew: 5
      },
      pricing: {
        basePrice: 15700,
        currency: 'USD'
      }
    },
    destination: {
      id: 'destination-003',
      name: 'Bahamas',
      isFromApi: false
    },
    specialRequests: 'Diving equipment',
    mainCharterer: {
      id: 'customer-003',
      firstName: 'Michael',
      lastName: 'Johnson',
      email: 'michael.johnson@example.com'
    },
    guestList: [],
    documents: []
  },
]

const MOCK_RECENT_CUSTOMERS: CustomerWithStats[] = [
  {
    id: 'customer-001',
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'client',
    phone: '+1234567890',
    company: 'Tech Corp',
    bookingsCount: 3,
    totalSpent: 35000,
    lastBooking: '2024-03-15',
  },
  {
    id: 'customer-002',
    email: 'sarah.smith@example.com',
    firstName: 'Sarah',
    lastName: 'Smith',
    role: 'client',
    phone: '+1234567891',
    bookingsCount: 1,
    totalSpent: 8900,
    lastBooking: '2024-03-18',
  },
  {
    id: 'customer-003',
    email: 'michael.johnson@example.com',
    firstName: 'Michael',
    lastName: 'Johnson',
    role: 'client',
    phone: '+1234567892',
    company: 'Finance Ltd',
    bookingsCount: 2,
    totalSpent: 28400,
    lastBooking: '2024-03-20',
  },
]

// Simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const mockDashboardService = {
  async getStats(): Promise<DashboardStats> {
    await delay(800)
    return MOCK_STATS
  },

  async getRecentBookings(): Promise<BookingWithDetails[]> {
    await delay(1000)
    return MOCK_RECENT_BOOKINGS
  },

  async getRecentCustomers(): Promise<CustomerWithStats[]> {
    await delay(1000)
    return MOCK_RECENT_CUSTOMERS
  },
}
