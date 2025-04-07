import { createContext, useContext, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ContextProviderProps, Booking, BookingWithDetails } from '../types'
import { adminBookingService, AdminCreateBookingDTO, AdminUpdateBookingDTO } from '@/services/adminBookingService'
import { useNotification } from '../notification/NotificationContext'

interface AdminBookingContextType {
  bookings: BookingWithDetails[]
  isLoading: boolean
  error: Error | null
  createBooking: (data: AdminCreateBookingDTO) => Promise<Booking>
  updateBooking: (id: string, data: AdminUpdateBookingDTO) => Promise<Booking>
  deleteBooking: (id: string) => Promise<void>
  validateDates: (yachtId: string, startDate: string, endDate: string) => Promise<boolean>
  getBookingById: (id: string) => Promise<BookingWithDetails | undefined>
  getBookingsByCustomerId: (customerId: string) => Promise<BookingWithDetails[]>
  refreshBookings: () => Promise<void>
}

const AdminBookingContext = createContext<AdminBookingContextType | undefined>(undefined)
// Add display name for better debugging
AdminBookingContext.displayName = 'AdminBookingContext'

// Helper function to parse error messages
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    const message = error.message;
    
    // Handle common database errors
    if (message.includes('foreign key constraint fails')) {
      return 'Database constraint error: The yacht or customer may not exist in the database.';
    }
    
    // Handle general server errors
    if (message.includes('Server error:')) {
      return message;
    }
    
    return message;
  }
  return 'An unknown error occurred';
};

export function AdminBookingProvider({ children }: ContextProviderProps) {
  const queryClient = useQueryClient()
  const { addNotification } = useNotification()

  // Fetch bookings
  const {
    data: bookings = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['adminBookings'],
    queryFn: adminBookingService.getBookings,
    gcTime: 1000 * 60 * 5, // 5 minutes
    staleTime: 1000 * 60 * 1, // 1 minute
  })

  // Refresh bookings function
  const refreshBookings = async () => {
    await refetch()
  }

  // Helper function to get booking by ID
  const getBookingById = useCallback(
    async (id: string): Promise<BookingWithDetails | undefined> => {
      if (!id) {
        console.error('getBookingById called with empty ID');
        return undefined;
      }

      if (isLoading) {
        console.log(`Still loading bookings, can't fetch booking ${id} yet`);
        return undefined;
      }
      
      // First try to find it in the cached bookings
      console.log(`Searching for booking ${id} in cached bookings (${bookings.length} bookings)`);
      
      // Important: Convert all IDs to strings for comparison
      const cachedBooking = bookings.find((booking) => String(booking.id) === String(id));
      
      if (cachedBooking) {
        console.log(`Found booking ${id} in cache with actual ID ${cachedBooking.id} (type: ${typeof cachedBooking.id})`);
        return cachedBooking;
      }
      
      // If not found in cache, fetch it directly
      console.log(`Booking ${id} not found in cache, fetching directly from API`);
      try {
        const booking = await adminBookingService.getBooking(id);
        
        if (!booking) {
          console.error(`Booking ${id} not found in API`);
          addNotification({
            type: 'error',
            message: `Booking with ID ${id} not found`,
            duration: 5000,
          });
          return undefined;
        }
        
        // Verify the ID match
        if (String(booking.id) !== String(id)) {
          console.warn(`Warning: API returned booking with ID ${booking.id} but we requested ${id}`);
          // Force the correct ID to match the requested one
          booking.id = id;
        }
        
        // Add to query cache so it's available for future lookups
        queryClient.setQueryData(['adminBookings', id], booking);
        console.log(`Fetched booking ${id} from API and added to cache. Actual ID: ${booking.id} (type: ${typeof booking.id})`);
        
        // Debug the booking data
        if (booking) {
          console.log('Booking structure from API:', {
            id: booking.id,
            yacht: booking.yacht ? 'present' : 'missing',
            destination: booking.destination ? 'present' : 'missing',
            mainCharterer: booking.mainCharterer ? 'present' : 'missing',
            guestList: booking.guestList ? `array of ${booking.guestList.length}` : 'missing',
            status: booking.status
          });
        } else {
          console.error('getBookingById: Booking is null even though API service returned a value');
        }
        return booking;
      } catch (error) {
        console.error('Error fetching admin booking by ID:', error);
        addNotification({
          type: 'error',
          message: `Failed to fetch booking: ${error instanceof Error ? error.message : 'Unknown error'}`,
          duration: 5000,
        });
        return undefined;
      }
    },
    [bookings, isLoading, queryClient, addNotification]
  )

  // Get bookings by customer ID
  const getBookingsByCustomerId = useCallback(
    async (customerId: string) => {
      try {
        return await adminBookingService.getBookingsByCustomerId(customerId);
      } catch (error) {
        console.error('Error fetching admin bookings by customer ID:', error);
        return [];
      }
    },
    []
  )

  // Create booking mutation
  const createMutation = useMutation({
    mutationFn: async (bookingData: AdminCreateBookingDTO) => {
      console.log('=== AdminBookingContext: createBooking started ===')
      
      try {
        // Create booking
        console.log('Creating booking with admin service')
        return await adminBookingService.createBooking(bookingData)
      } catch (error) {
        // Log the error with more context
        console.error('AdminBookingContext: Error during booking creation:', error);
        
        // Rethrow to be handled by onError
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminBookings'] })
      addNotification({
        type: 'success',
        message: 'Booking created successfully',
        duration: 5000,
      })
      console.log('=== AdminBookingContext: createBooking completed successfully ===', data)
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error);
      
      addNotification({
        type: 'error',
        message: errorMessage,
        duration: 7000, // Longer duration for error messages
      })
      console.error('=== AdminBookingContext: createBooking failed ===', error)
    },
  })

  // Update booking mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AdminUpdateBookingDTO }) => {
      console.log('=== AdminBookingContext: updateBooking started ===')
      return adminBookingService.updateBooking(id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBookings'] })
      addNotification({
        type: 'success',
        message: 'Booking updated successfully',
        duration: 5000,
      })
      console.log('=== AdminBookingContext: updateBooking completed successfully ===')
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error);
      
      addNotification({
        type: 'error',
        message: errorMessage,
        duration: 7000,
      })
      console.error('=== AdminBookingContext: updateBooking failed ===', error)
    },
  })

  // Delete booking mutation
  const deleteMutation = useMutation({
    mutationFn: adminBookingService.deleteBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBookings'] })
      addNotification({
        type: 'success',
        message: 'Booking deleted successfully',
        duration: 5000,
      })
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error);
      
      addNotification({
        type: 'error',
        message: errorMessage,
        duration: 7000,
      })
    },
  })

  // Function to validate booking dates
  const validateDates = async (yachtId: string, startDate: string, endDate: string) => {
    try {
      // For now, we're not implementing backend validation and returning true always
      console.log('Validating admin booking dates:', { yachtId, startDate, endDate })
      return true
    } catch (error) {
      console.error('Error validating booking dates:', error)
      return true // Default to true in case of error to prevent blocking bookings
    }
  }

  // Create booking function
  const createBooking = async (data: AdminCreateBookingDTO) => {
    return createMutation.mutateAsync(data)
  }

  // Update booking function
  const updateBooking = async (id: string, data: AdminUpdateBookingDTO) => {
    return updateMutation.mutateAsync({ id, data })
  }

  // Delete booking function
  const deleteBooking = async (id: string) => {
    return deleteMutation.mutateAsync(id)
  }

  return (
    <AdminBookingContext.Provider
      value={{
        bookings,
        isLoading,
        error,
        createBooking,
        updateBooking,
        deleteBooking,
        validateDates,
        getBookingById,
        getBookingsByCustomerId,
        refreshBookings,
      }}
    >
      {children}
    </AdminBookingContext.Provider>
  )
}

export function useAdminBooking() {
  const context = useContext(AdminBookingContext)
  if (context === undefined) {
    throw new Error('useAdminBooking must be used within a AdminBookingProvider')
  }
  return context
} 