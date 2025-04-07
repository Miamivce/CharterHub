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
    customerName: 'John Doe',
    yachtName: 'Ocean Breeze',
    specialRequests: 'Champagne welcome package',
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
    customerName: 'Sarah Smith',
    yachtName: 'Sea Spirit',
    specialRequests: 'Gluten-free meals',
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
    customerName: 'Michael Johnson',
    yachtName: 'Wind Dancer',
    specialRequests: 'Diving equipment',
  },
]

const MOCK_RECENT_CUSTOMERS: CustomerWithStats[] = [
  {
    id: 'customer-001',
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'customer',
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
    role: 'customer',
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
    role: 'customer',
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
