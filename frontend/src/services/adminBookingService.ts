import { BookingWithDetails, Booking } from '@/contexts/types'
import { TOKEN_KEY } from '@/services/jwtApi'

// Base URL for API requests
const API_BASE_URL = import.meta.env.VITE_PHP_API_URL || 'http://localhost:8000'

// Type definitions for admin API calls
export interface AdminCreateBookingDTO {
  yachtId: string
  startDate: string
  endDate: string
  totalPrice?: number
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  mainCharterer: {
    id?: string
    firstName: string
    lastName: string
    email: string
    phoneNumber?: string
    notes?: string
  }
  guests?: Array<{
    id?: string
    firstName: string
    lastName: string
    email: string
    phoneNumber?: string
    notes?: string
  }>
}

export interface AdminUpdateBookingDTO {
  yachtId?: string
  startDate?: string
  endDate?: string
  totalPrice?: number
  status?: string
  mainCharterer?: {
    id?: string
    firstName?: string
    lastName?: string
    email?: string
    phoneNumber?: string
    notes?: string
  }
  guests?: Array<{
    id?: string
    firstName: string
    lastName: string
    email: string
    phoneNumber?: string
    notes?: string
  }>
}

// Helper function to get auth token
const getAuthToken = (): string | null => {
  const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  console.log('AdminBookingService - Auth token exists:', !!token);
  
  // For debugging - show part of the token (but not the whole thing for security)
  if (token) {
    const tokenPrefix = token.substring(0, 15);
    const tokenSuffix = token.substring(token.length - 10);
    console.log(`AdminBookingService - Token sample: ${tokenPrefix}...${tokenSuffix}`);
  }
  
  return token;
};

export const adminBookingService = {
  async getBookings(): Promise<BookingWithDetails[]> {
    try {
      const token = getAuthToken();
      console.log('Fetching admin bookings with token:', !!token);
      
      // Log request details for debugging
      console.log(`Making request to: ${API_BASE_URL}/api/admin/direct-bookings.php`);
      
      const response = await fetch(`${API_BASE_URL}/api/admin/direct-bookings.php`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        credentials: 'include'
      })

      // Capture the raw response text for debugging
      const responseText = await response.text();
      console.log('Raw booking API response:', responseText.substring(0, 500)); // Log first 500 chars to keep console clean

      if (!response.ok) {
        console.error(`API error (${response.status}): ${responseText.substring(0, 200)}`);
        throw new Error(`Failed to fetch bookings: ${response.statusText}`);
      }

      // Parse the response text
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        console.error('Response text (first 200 chars):', responseText.substring(0, 200));
        throw parseError;
      }
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch bookings');
      }

      console.log('Successfully fetched bookings:', data.data?.length || 0);
      return data.data || [];
    } catch (error) {
      console.error('Error fetching admin bookings:', error);
      return [];
    }
  },

  async getBookingsByCustomerId(customerId: string): Promise<BookingWithDetails[]> {
    try {
      console.log(`Fetching bookings for customer ID: ${customerId}`);
      const token = getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/api/admin/direct-bookings.php?customer_id=${customerId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        credentials: 'include'
      })

      // Read the raw response
      const responseText = await response.text();
      
      if (!response.ok) {
        console.error(`API error (${response.status}): ${responseText.substring(0, 200)}`);
        throw new Error(`Failed to fetch customer bookings: ${response.statusText}`);
      }

      // Parse the response text
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse customer bookings response as JSON:', parseError);
        console.error('Response text (first 200 chars):', responseText.substring(0, 200));
        throw parseError;
      }
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch customer bookings');
      }

      console.log(`Found ${data.data?.length || 0} bookings for customer ID: ${customerId}`);
      return data.data || [];
    } catch (error) {
      console.error('Error fetching customer bookings:', error);
      return [];
    }
  },

  async getBooking(id: string): Promise<BookingWithDetails | null> {
    try {
      console.log(`Direct API call to fetch booking with ID ${id}`);
      const token = getAuthToken();
      
      // First try to get the booking directly from the API
      const response = await fetch(`${API_BASE_URL}/api/admin/direct-bookings.php?id=${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        credentials: 'include'
      });

      // Log the raw response status
      console.log(`Booking API response status: ${response.status}`);

      // If the API doesn't support direct booking fetch or returns an error,
      // fallback to getting all bookings and filtering
      if (!response.ok) {
        console.log(`API doesn't support direct booking fetch, falling back to getBookings() and filter`);
        const bookings = await this.getBookings();
        console.log(`Searching for booking ID '${id}' (string) in ${bookings.length} bookings`);
        
        // Convert all IDs to strings for comparison to ensure proper matching
        const booking = bookings.find(b => String(b.id) === String(id));
        
        if (!booking) {
          console.error(`Booking with ID ${id} not found in both API and cached list`);
          return null;
        }
        
        console.log(`Found booking in cache with ID: ${booking.id}. Booking: `, booking);
        return booking;
      }
      
      // Try to parse the response
      const responseText = await response.text();
      console.log(`Raw booking API response (first 500 chars): ${responseText.substring(0, 500)}`);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse booking response as JSON:', parseError);
        console.error('Response text (first 200 chars):', responseText.substring(0, 200));
        
        // Fallback to getting all bookings and filtering
        console.log(`API response parsing failed, falling back to getBookings() and filter`);
        const bookings = await this.getBookings();
        // Convert all IDs to strings for comparison
        const booking = bookings.find(b => String(b.id) === String(id));
        
        if (!booking) {
          console.error(`Booking with ID ${id} not found in cache after API parse failure`);
          return null;
        }
        
        return booking;
      }
      
      if (!data.success) {
        console.error(`API error: ${data.message || 'Unknown error'}`);
        throw new Error(data.message || 'Failed to fetch booking');
      }
      
      // For a specific booking ID, the API might return the booking directly or in a data array
      const bookingData = Array.isArray(data.data) ? data.data[0] : data.data;
      
      if (!bookingData) {
        console.error('No booking data returned from API');
        return null;
      }
      
      console.log('Successfully retrieved booking details:', JSON.stringify(bookingData, null, 2));
      return bookingData;
    } catch (error) {
      console.error(`Error fetching booking with ID ${id}:`, error);
      return null;
    }
  },

  async createBooking(booking: AdminCreateBookingDTO): Promise<Booking> {
    try {
      console.log('Creating admin booking with data:', JSON.stringify(booking, null, 2));
      const token = getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/api/admin/direct-bookings.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        credentials: 'include',
        body: JSON.stringify(booking)
      });

      // Log the raw response for debugging
      const responseText = await response.text();
      console.log('Raw response from booking creation:', responseText.substring(0, 500));

      // Parse the response text
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse booking creation response:', parseError);
        console.error('Response text (first 200 chars):', responseText.substring(0, 200));
        
        // Extract error message from HTML response if possible
        let errorMessage = "Invalid server response";
        if (responseText.includes("<b>Fatal error</b>:")) {
          const errorMatch = responseText.match(/<b>Fatal error<\/b>:\s*(.*?)(<br|<\/b>)/);
          if (errorMatch && errorMatch[1]) {
            errorMessage = errorMatch[1].trim();
          }
        } else if (responseText.includes("Failed to create booking")) {
          const errorMatch = responseText.match(/Failed to create booking: (.*?)(<br|\n|$)/);
          if (errorMatch && errorMatch[1]) {
            errorMessage = errorMatch[1].trim();
          }
        }
        
        throw new Error(`Server error: ${errorMessage}`);
      }
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || `Failed to create booking: ${response.statusText}`);
      }

      console.log('Successfully created booking:', data);
      return data.data;
    } catch (error) {
      console.error('Error creating admin booking:', error);
      throw error;
    }
  },

  async updateBooking(id: string, booking: AdminUpdateBookingDTO): Promise<Booking> {
    try {
      const token = getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/api/admin/direct-bookings.php?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        credentials: 'include',
        body: JSON.stringify(booking)
      });

      // Read the raw response
      const responseText = await response.text();
      
      if (!response.ok) {
        console.error(`API error (${response.status}): ${responseText.substring(0, 200)}`);
        throw new Error(`Failed to update booking: ${response.statusText}`);
      }

      // Parse the response text
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse booking update response as JSON:', parseError);
        console.error('Response text (first 200 chars):', responseText.substring(0, 200));
        throw parseError;
      }
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to update booking');
      }

      return data.data;
    } catch (error) {
      console.error(`Error updating booking with ID ${id}:`, error);
      throw error;
    }
  },

  async deleteBooking(id: string): Promise<void> {
    try {
      const token = getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/api/admin/direct-bookings.php?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        credentials: 'include'
      });

      // Read the raw response
      const responseText = await response.text();
      
      if (!response.ok) {
        console.error(`API error (${response.status}): ${responseText.substring(0, 200)}`);
        throw new Error(`Failed to delete booking: ${response.statusText}`);
      }

      // Parse the response text
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse booking deletion response as JSON:', parseError);
        console.error('Response text (first 200 chars):', responseText.substring(0, 200));
        throw parseError;
      }
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to delete booking');
      }
    } catch (error) {
      console.error(`Error deleting booking with ID ${id}:`, error);
      throw error;
    }
  }
} 