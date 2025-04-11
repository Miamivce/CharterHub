import { BookingWithDetails, Booking } from '@/contexts/types'
import TokenService from './tokenService';

// Utility for API delays (useful for dev/testing)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Base API URL - use environment variable with fallback
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Debug helper to safely log token info without exposing full token
const debugToken = (token: string | null) => {
  if (!token) return 'No token found';
  if (token.length < 20) return 'Token too short';
  return `Token found (starts with: ${token.substring(0, 15)}..., length: ${token.length})`;
};

// Get auth token from centralized token service
const getAuthToken = (): string | null => {
  const token = TokenService.getToken();
  console.log('Token status:', debugToken(token));
  // Don't return string "null" which causes authentication issues
  return token === "null" ? null : token;
};

// Type definitions for API calls
export interface CreateBookingDTO {
  yachtId: string
  startDate: string
  endDate: string
  mainCharterer: any
  guestList?: { id?: string; firstName: string; lastName: string; email: string; notes?: string; role?: string }[]
  guests?: number
  destination?: { id: string; name: string }
  totalPrice?: number
  specialRequests?: string
  notes?: string
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  documents?: any[]
}

export interface UpdateBookingDTO {
  // Add properties as needed
  [key: string]: any
}

export const bookingService = {
  async getBookings(): Promise<BookingWithDetails[]> {
    try {
      const token = getAuthToken();
      // If token is null or undefined, don't attempt the request
      if (!token) {
        console.error('No valid token found, cannot fetch bookings');
        return [];
      }
      
      console.log('Sending request to:', `${API_BASE_URL}/api/client/bookings.php`);
      
      const response = await fetch(`${API_BASE_URL}/api/client/bookings.php`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include' // Include cookies in the request
      });

      console.log('Response status:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`Failed to fetch bookings: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch bookings');
      }

      return data.data || [];
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return [];
    }
  },

  async getBooking(id: string): Promise<BookingWithDetails | null> {
    try {
      const token = getAuthToken();
      if (!token) {
        console.error('No valid token found, cannot fetch booking');
        return null;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/client/bookings.php?id=${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch booking: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch booking');
      }

      return data.data || null;
    } catch (error) {
      console.error(`Error fetching booking with ID ${id}:`, error);
      return null;
    }
  },

  async createBooking(booking: CreateBookingDTO): Promise<Booking> {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No valid token found, cannot create booking');
      }
      
      const response = await fetch(`${API_BASE_URL}/api/client/bookings.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(booking),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to create booking: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to create booking');
      }

      return data.data;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  },

  async updateBooking(id: string, booking: UpdateBookingDTO): Promise<Booking> {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No valid token found, cannot update booking');
      }
      
      const response = await fetch(`${API_BASE_URL}/api/client/bookings.php?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(booking),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to update booking: ${response.statusText}`);
      }

      const data = await response.json();
      
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
      if (!token) {
        throw new Error('No valid token found, cannot delete booking');
      }
      
      const response = await fetch(`${API_BASE_URL}/api/client/bookings.php?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to delete booking: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to delete booking');
      }
    } catch (error) {
      console.error(`Error deleting booking with ID ${id}:`, error);
      throw error;
    }
  },

  async validateBookingDates(yachtId: string, startDate: string, endDate: string): Promise<boolean> {
    // Always return true - all dates are available
    console.log('Validating booking dates:', { yachtId, startDate, endDate });
    return true;
  }
}

// Fetch bookings for a specific customer
export async function getBookingsByCustomerId(customerId: string): Promise<BookingWithDetails[]> {
  try {
    console.log(`Fetching bookings for client user (ID: ${customerId})`);
    
    const token = getAuthToken();
    // If token is null or undefined, don't attempt the request
    if (!token) {
      console.error('No valid token found, cannot fetch bookings');
      throw new Error('No valid authentication token');
    }
    
    const endpoint = `${API_BASE_URL}/api/client/bookings.php?user_id=${customerId}`;
    console.log('Sending request to:', endpoint);
    
    // The client bookings endpoint automatically filters by the authenticated user
    // We pass user_id as a querystring parameter for additional filtering/debugging
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include' // Include cookies in the request
    });
    
    console.log('Response status:', response.status);
    
    // Handle non-200 responses
    if (!response.ok) {
      throw new Error(`Failed to fetch bookings: ${response.status} ${response.statusText}`);
    }
    
    // Check content type for proper JSON response
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.log(`Received non-JSON response: ${response.status} ${contentType}`);
      
      // Try to parse response as JSON anyway
      try {
        const text = await response.text();
        // If response is empty, return empty array
        if (!text.trim()) {
          console.warn('Empty response received');
          return [];
        }
        
        // Try to parse text as JSON
        const data = JSON.parse(text);
        if (data.success && Array.isArray(data.data)) {
          return data.data;
        } else if (data.success && data.data) {
          return [data.data];
        } else {
          console.error('Response format issue:', data);
          throw new Error('API returned unexpected data format');
        }
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error('API returned invalid format');
      }
    }
    
    // Parse response as JSON
    const data = await response.json();
    
    // Validate response structure
    if (!data.success) {
      console.error('API returned error:', data.message || 'Unknown error');
      throw new Error(data.message || 'Failed to fetch bookings');
    }
    
    // Ensure data.data is an array
    const bookings = Array.isArray(data.data) ? data.data : [];
    console.log(`Retrieved ${bookings.length} bookings`);
    
    return bookings;
  } catch (error) {
    console.error('Error fetching client bookings:', error);
    throw error;
  }
}