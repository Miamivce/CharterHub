import { API_BASE_URL } from '../config'
import { Customer, CustomerFormData } from '../types/customer'
import { loadCustomersFromStorage, saveCustomersToStorage } from './customerService'
import { v4 as uuidv4 } from 'uuid'

/**
 * CustomerAPI service
 *
 * Handles interactions with the backend API for customer management
 * Falls back to localStorage if API calls fail
 */

interface Customer {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  company?: string
  role: string
  verified: boolean
  selfRegistered?: boolean
  createdAt: string
  updatedAt?: string
  lastLogin?: string
  bookings?: number
  passportInfo?: {
    number: string
    expiryDate: string
    country: string
  }
}

interface CustomerWithPassport extends Customer {
  phone: string | undefined
  selfRegistered: boolean
}

/**
 * Format customer data from API response
 */
const formatCustomerFromAPI = (apiCustomer: any): Customer => {
  return {
    id: apiCustomer.ID,
    firstName: apiCustomer.first_name || '',
    lastName: apiCustomer.last_name || '',
    email: apiCustomer.user_email || '',
    phone: apiCustomer.phone || '',
    address: apiCustomer.address || '',
    city: apiCustomer.city || '',
    state: apiCustomer.state || '',
    zip: apiCustomer.zip || '',
    country: apiCustomer.country || '',
    notes: apiCustomer.notes || '',
    bookingsCount: apiCustomer.bookings_count || 0,
    totalSpent: apiCustomer.total_spent || 0,
    lastBooking: apiCustomer.last_booking ? new Date(apiCustomer.last_booking) : null,
  }
}

/**
 * Get JWT token from localStorage
 */
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token')
}

/**
 * Check if we're in development mode
 */
const isDevelopmentMode = (): boolean => {
  return (
    import.meta.env.MODE === 'development' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  )
}

/**
 * Fetch all customers from API
 */
export const fetchCustomersFromAPI = async (): Promise<Customer[]> => {
  try {
    const token = getAuthToken()

    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch(`${API_BASE_URL}/customers/list.php`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to fetch customers from API')
    }

    const data = await response.json()

    if (!data.success || !data.customers) {
      throw new Error('Invalid API response format')
    }

    return data.customers.map(formatCustomerFromAPI)
  } catch (error) {
    console.error('Error fetching customers from API:', error)
    throw error
  }
}

/**
 * Fetch a single customer by ID
 */
export const fetchCustomerByIdFromAPI = async (customerId: string): Promise<Customer | null> => {
  try {
    const token = getAuthToken()

    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch(`${API_BASE_URL}/customers/get.php?id=${customerId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.status === 404) {
      return null
    }

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to fetch customer from API')
    }

    const data = await response.json()

    if (!data.success || !data.customer) {
      throw new Error('Invalid API response format')
    }

    return formatCustomerFromAPI(data.customer)
  } catch (error) {
    console.error('Error fetching customer from API:', error)

    // In development mode, fall back to localStorage
    if (isDevelopmentMode()) {
      console.warn('Falling back to localStorage data for customer')
      const customers = loadCustomersFromStorage()
      return customers.find((c) => c.id === customerId) || null
    }

    throw error
  }
}

/**
 * Fetch a customer by email
 */
export const fetchCustomerByEmailFromAPI = async (email: string): Promise<Customer | null> => {
  try {
    const token = getAuthToken()

    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch(
      `${API_BASE_URL}/customers/get.php?email=${encodeURIComponent(email)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (response.status === 404) {
      return null
    }

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to fetch customer from API')
    }

    const data = await response.json()

    if (!data.success || !data.customer) {
      throw new Error('Invalid API response format')
    }

    return formatCustomerFromAPI(data.customer)
  } catch (error) {
    console.error('Error fetching customer from API:', error)

    // In development mode, fall back to localStorage
    if (isDevelopmentMode()) {
      console.warn('Falling back to localStorage data for customer')
      const customers = loadCustomersFromStorage()
      return customers.find((c) => c.email.toLowerCase() === email.toLowerCase()) || null
    }

    throw error
  }
}

/**
 * Create a new customer
 */
export const createCustomerInAPI = async (customerData: CustomerFormData): Promise<Customer> => {
  try {
    const token = getAuthToken()

    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch(`${API_BASE_URL}/customers/save.php`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(customerData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to create customer in API')
    }

    const data = await response.json()

    if (!data.success || !data.customer) {
      throw new Error('Invalid API response format')
    }

    return formatCustomerFromAPI(data.customer)
  } catch (error) {
    console.error('Error creating customer in API:', error)

    // In development mode, fall back to localStorage
    if (isDevelopmentMode()) {
      console.warn('Creating customer in localStorage instead')
      const customers = loadCustomersFromStorage()

      // Generate a truly unique ID using UUID instead of timestamp
      // This prevents duplicate IDs when multiple customers are created close together
      const newId = `local_${uuidv4()}`

      const newCustomer: Customer = {
        id: newId,
        firstName: customerData.firstName || '',
        lastName: customerData.lastName || '',
        email: customerData.email || '',
        phone: customerData.phone || '',
        address: customerData.address || '',
        city: customerData.city || '',
        state: customerData.state || '',
        zip: customerData.zip || '',
        country: customerData.country || '',
        notes: customerData.notes || '',
        bookingsCount: 0,
        totalSpent: 0,
        lastBooking: null,
      }

      // Save to localStorage
      customers.push(newCustomer)
      saveCustomersToStorage(customers)

      return newCustomer
    }

    throw error
  }
}

/**
 * Update an existing customer
 */
export const updateCustomerInAPI = async (
  customerId: string,
  customerData: CustomerFormData
): Promise<Customer> => {
  try {
    const token = getAuthToken()

    if (!token) {
      throw new Error('No authentication token found')
    }

    // Include the ID in the request body
    const requestData = {
      ...customerData,
      id: customerId,
    }

    const response = await fetch(`${API_BASE_URL}/customers/save.php`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to update customer in API')
    }

    const data = await response.json()

    if (!data.success || !data.customer) {
      throw new Error('Invalid API response format')
    }

    return formatCustomerFromAPI(data.customer)
  } catch (error) {
    console.error('Error updating customer in API:', error)

    // In development mode, fall back to localStorage
    if (isDevelopmentMode()) {
      console.warn('Updating customer in localStorage instead')
      let customers = loadCustomersFromStorage()

      // Find and update the customer
      const updatedCustomers = customers.map((customer) => {
        if (customer.id === customerId) {
          return {
            ...customer,
            ...customerData,
          }
        }
        return customer
      })

      // Save to localStorage
      saveCustomersToStorage(updatedCustomers)

      // Return the updated customer
      const updatedCustomer = updatedCustomers.find((c) => c.id === customerId)
      if (!updatedCustomer) {
        throw new Error('Customer not found after update')
      }

      return updatedCustomer
    }

    throw error
  }
}

/**
 * Delete a customer
 */
export const deleteCustomerFromAPI = async (customerId: string): Promise<boolean> => {
  try {
    const token = getAuthToken()

    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch(`${API_BASE_URL}/customers/delete.php?id=${customerId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to delete customer from API')
    }

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.message || 'Failed to delete customer')
    }

    return true
  } catch (error) {
    console.error('Error deleting customer from API:', error)

    // In development mode, fall back to localStorage
    if (isDevelopmentMode()) {
      console.warn('Deleting customer from localStorage instead')
      let customers = loadCustomersFromStorage()

      // Filter out the deleted customer
      const updatedCustomers = customers.filter((customer) => customer.id !== customerId)

      // Save to localStorage
      saveCustomersToStorage(updatedCustomers)

      return true
    }

    throw error
  }
}

/**
 * Sync customers from localStorage to the API
 * This is useful when transitioning from development to production
 */
export const syncCustomersToAPI = async (): Promise<number> => {
  try {
    const token = getAuthToken()

    if (!token) {
      throw new Error('No authentication token found')
    }

    const localCustomers = loadCustomersFromStorage()
    let syncCount = 0

    for (const customer of localCustomers) {
      try {
        // Check if customer exists in API by email
        const existingCustomer = await fetchCustomerByEmailFromAPI(customer.email)

        if (existingCustomer) {
          // Update existing customer
          await updateCustomerInAPI(existingCustomer.id, customer)
        } else {
          // Create new customer
          await createCustomerInAPI(customer)
        }

        syncCount++
      } catch (syncError) {
        console.error(`Error syncing customer: ${syncError}`)
      }
    }

    return syncCount
  } catch (error) {
    console.error('Error syncing customers to API:', error)
    throw error
  }
}
