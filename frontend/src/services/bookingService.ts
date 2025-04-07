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
  // Add other properties as needed
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
    console.log(`Fetching bookings for authenticated user (customer ID: ${customerId})`);
    
    const token = getAuthToken();
    // If token is null or undefined, don't attempt the request
    if (!token) {
      console.error('No valid token found, cannot fetch bookings');
      throw new Error('No valid authentication token');
    }
    
    console.log('Sending request to:', `${API_BASE_URL}/api/client/bookings.php`);
    
    // The client bookings endpoint automatically filters by the authenticated user
    // No need to pass customer_id as it's determined from the JWT token
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
      throw new Error(`Failed to fetch customer bookings: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch customer bookings');
    }

    console.log(`Found ${data.data?.length || 0} bookings for authenticated user`);
    return data.data || [];
  } catch (error) {
    console.error('Error fetching customer bookings:', error);
    throw new Error(`Failed to fetch customer bookings: ${(error as Error).message}`);
  }
}