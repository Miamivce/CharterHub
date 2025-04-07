import { createContext, useContext, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ContextProviderProps, Booking, BookingWithDetails } from '../types'
import { bookingService, CreateBookingDTO, UpdateBookingDTO } from '@/services/bookingService'
import { useNotification } from '../notification/NotificationContext'
import { customerService } from '@/services/customerService'

interface BookingContextType {
  bookings: BookingWithDetails[]
  isLoading: boolean
  error: Error | null
  createBooking: (data: CreateBookingDTO) => Promise<Booking>
  updateBooking: (id: string, data: UpdateBookingDTO) => Promise<Booking>
  deleteBooking: (id: string) => Promise<void>
  validateDates: (yachtId: string, startDate: string, endDate: string) => Promise<boolean>
  getBookingById: (id: string) => BookingWithDetails | undefined
}

const BookingContext = createContext<BookingContextType | undefined>(undefined)

export function BookingProvider({ children }: ContextProviderProps) {
  const queryClient = useQueryClient()
  const { addNotification } = useNotification()

  // Fetch bookings
  const {
    data: bookings = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['bookings'],
    queryFn: bookingService.getBookings,
    gcTime: 1000 * 60 * 5, // 5 minutes
    staleTime: 1000 * 60 * 1, // 1 minute
  })

  // Helper function to get booking by ID
  const getBookingById = useCallback(
    (id: string) => {
      if (isLoading) return undefined;
      
      // First try to find it in the cached bookings
      const cachedBooking = bookings.find((booking) => booking.id === id);
      if (cachedBooking) return cachedBooking;
      
      // If not found in cache, fetch it directly
      console.log('Booking not found in cache, fetching directly:', id);
      return bookingService.getBooking(id).then(booking => {
        if (booking) {
          // Add to query cache so it's available for future lookups
          queryClient.setQueryData(['bookings', id], booking);
          return booking;
        }
        return undefined;
      }).catch(error => {
        console.error('Error fetching booking by ID:', error);
        return undefined;
      });
    },
    [bookings, isLoading, queryClient]
  )

  // Create booking mutation
  const createMutation = useMutation({
    mutationFn: async (bookingData: CreateBookingDTO) => {
      console.log('=== BookingContext: createBooking started ===')
      // Add all guests to the customer service before creating the booking
      // First add the main charterer if not already a customer
      if (bookingData.mainCharterer && bookingData.mainCharterer.id) {
        // Get the complete customer data with correct notes handling
        const mainChartererData = {
          ...bookingData.mainCharterer,
          role: 'customer',
          selfRegistered: false,
          registrationDate: new Date().toISOString(),
        }

        // Extract notes for logging
        const notes = bookingData.mainCharterer.notes || 'No notes'

        console.log(
          'Adding main charterer to customers:',
          JSON.stringify(
            {
              id: mainChartererData.id,
              name: `${mainChartererData.firstName} ${mainChartererData.lastName}`,
              email: mainChartererData.email,
              notes, // Log notes properly
              selfRegistered: mainChartererData.selfRegistered,
            },
            null,
            2
          )
        )

        try {
          // Make sure customer service is aware of this customer and its notes
          await customerService.clearCustomerCache(mainChartererData.id)

          // Fire an event to ensure other components are aware of this customer
          const event = new CustomEvent('customer:updated', {
            detail: {
              customer: mainChartererData,
              eventId: `booking_main_charterer_${Date.now()}`,
            },
          })
          window.dispatchEvent(event)
          console.log(
            `BookingContext: Dispatched customer:updated event for main charterer ${mainChartererData.id}`
          )
          console.log('Main charterer data processed')
        } catch (error) {
          console.error('Failed to process main charterer data:', error)
        }
      }

      // Then add all guests to customer service
      if (bookingData.guestList && bookingData.guestList.length > 0) {
        console.log(`Adding ${bookingData.guestList.length} guests to customers`)

        await Promise.all(
          bookingData.guestList.map(async (guest) => {
            if (guest.id && guest.email) {
              // Create a complete customer record for each guest
              const guestData = {
                ...guest,
                role: 'customer',
                selfRegistered: false,
                registrationDate: new Date().toISOString(),
              }

              // Extract notes for logging safely
              const guestNotes = typeof guest.notes === 'string' ? guest.notes : 'No notes'

              console.log(
                'Adding guest to customers:',
                JSON.stringify(
                  {
                    id: guestData.id,
                    name: `${guestData.firstName} ${guestData.lastName}`,
                    email: guestData.email,
                    notes: guestNotes,
                    selfRegistered: guestData.selfRegistered,
                  },
                  null,
                  2
                )
              )

              try {
                // Make sure customer service is aware of this guest
                await customerService.clearCustomerCache(guest.id.toString())
                console.log(`Guest ${guestData.email} data processed`)
              } catch (error) {
                console.error(`Failed to process guest ${guest.email} data:`, error)
              }
            } else {
              console.warn('Skipping guest with missing id or email:', guest)
            }
          })
        )
      }

      console.log('All guests added, now creating booking')
      // Now create the booking
      return bookingService.createBooking(bookingData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      addNotification({
        type: 'success',
        message: 'Booking created successfully',
        duration: 5000,
      })
      console.log('=== BookingContext: createBooking completed successfully ===')
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to create booking',
        duration: 5000,
      })
      console.error('=== BookingContext: createBooking failed ===', error)
    },
  })

  // Update booking mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateBookingDTO }) => {
      console.log('=== BookingContext: updateBooking started ===')
      // Add any new guests to the customer service before updating the booking
      if (data.guestList && data.guestList.length > 0) {
        console.log(`Adding/updating ${data.guestList.length} guests from booking update`)

        await Promise.all(
          data.guestList.map(async (guest) => {
            if (guest.id && guest.email) {
              // Create a complete customer record for each guest
              const guestData = {
                ...guest,
                role: 'customer',
                selfRegistered: false,
                registrationDate: new Date().toISOString(),
              }

              console.log(
                'Adding/updating guest from booking update:',
                JSON.stringify(
                  {
                    id: guestData.id,
                    name: `${guestData.firstName} ${guestData.lastName}`,
                    email: guestData.email,
                    selfRegistered: guestData.selfRegistered,
                  },
                  null,
                  2
                )
              )

              try {
                // Note: Customer registration endpoint /customers/register is deprecated
                // We'll continue without registering the guest
                console.log(`Guest ${guestData.email} data processed`)
              } catch (error) {
                console.error(`Failed to process guest ${guest.email} data:`, error)
              }
            } else {
              console.warn('Skipping guest with missing id or email:', guest)
            }
          })
        )
      }

      console.log('All guests processed, now updating booking')
      // Now update the booking
      return bookingService.updateBooking(id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      addNotification({
        type: 'success',
        message: 'Booking updated successfully',
        duration: 5000,
      })
      console.log('=== BookingContext: updateBooking completed successfully ===')
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update booking',
        duration: 5000,
      })
      console.error('=== BookingContext: updateBooking failed ===', error)
    },
  })

  // Delete booking mutation
  const deleteMutation = useMutation({
    mutationFn: bookingService.deleteBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      addNotification({
        type: 'success',
        message: 'Booking deleted successfully',
        duration: 5000,
      })
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete booking',
        duration: 5000,
      })
    },
  })

  // Validate booking dates
  const validateDates = useCallback(
    async (yachtId: string, startDate: string, endDate: string) => {
      try {
        return await bookingService.validateBookingDates(yachtId, startDate, endDate)
      } catch (error) {
        addNotification({
          type: 'error',
          message: error instanceof Error ? error.message : 'Failed to validate dates',
          duration: 5000,
        })
        return false
      }
    },
    [addNotification]
  )

  const value = {
    bookings,
    isLoading,
    error: error instanceof Error ? error : null,
    createBooking: createMutation.mutateAsync,
    updateBooking: (id: string, data: UpdateBookingDTO) => updateMutation.mutateAsync({ id, data }),
    deleteBooking: deleteMutation.mutateAsync,
    validateDates,
    getBookingById,
  }

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
}

export function useBooking() {
  const context = useContext(BookingContext)
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider')
  }
  return context
}
