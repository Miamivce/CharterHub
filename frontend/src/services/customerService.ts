import { API_BASE_URL } from '../config'
import { Customer, CustomerFormData } from '@/types/customer'
import { getApi } from './wpApi'
import { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { debugLog } from '@/utils/logger'
import axios from 'axios'
import jwtApi from '@/services/jwtApi'
import { TokenService } from '@/services/tokenService'

// Use environment variable for API URL
const api = getApi(import.meta.env.VITE_PHP_API_URL || 'http://localhost:8000')

// Use the existing API instance and add debugging to requests
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Add debugging info to the request
  debugLog(`Making request to ${config.url}`, 'info')
  return config
})

interface CustomerData {
  id: number
  email: string
  firstName: string
  lastName: string
  role: 'customer' // Only allow customer role
  phone: string
  company: string
}

export interface CreateCustomerDTO {
  firstName: string
  lastName: string
  email: string
  phone?: string
  company?: string
  country?: string
  address?: string
  notes?: string
}

export interface RegisteredCustomer {
  id: string | number
  email: string
  firstName: string
  lastName: string
  role: 'customer'
  phone?: string
  company?: string
}

// Define CustomerBooking interface for customer booking data
export interface CustomerBooking {
  id: string
  startDate: string
  endDate: string
  status: string
  totalPrice: number
  role: 'main_charterer' | 'guest'
  yacht: {
    id: string
    name: string
  }
  // Add other fields as needed
}

// Local storage utility functions
export const loadCustomersFromStorage = (): Customer[] => {
  try {
    const customersJSON = localStorage.getItem('customers')
    if (customersJSON) {
      return JSON.parse(customersJSON)
    }
  } catch (error) {
    console.error('Error loading customers from localStorage:', error)
  }
  return []
}

export const saveCustomersToStorage = (customers: Customer[]): void => {
  try {
    localStorage.setItem('customers', JSON.stringify(customers))
  } catch (error) {
    console.error('Error saving customers to localStorage:', error)
  }
}

export class CustomerService {
  private customerMap = new Map<string, Customer>()
  private initialized = false
  private baseUrl: string
  private lastFetchTime = 0
  private fetchInProgress: boolean = false
  private authCheckInProgress: boolean = false
  private deleteInProgress: Record<string, boolean> = {}
  private lastDeleteTime: Record<string, number> = {}

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private updateCustomerInMap(customer: Customer): void {
    this.customerMap.set(customer.id.toString(), customer)
  }

  private getCustomerFromMap(id: string | number): Customer | undefined {
    return this.customerMap.get(id.toString())
  }

  private deleteCustomerFromMap(id: string | number): void {
    this.customerMap.delete(id.toString())
  }

  private clearCustomerMap(): void {
    this.customerMap.clear()
  }

  private getAllCustomers(): Customer[] {
    return Array.from(this.customerMap.values())
  }

  async initialize() {
    if (this.initialized) {
      return
    }

    try {
      await this.fetchCustomers(true)
      this.initialized = true
    } catch (error) {
      debugLog('Failed to initialize customer service', 'error')
      throw error
    }
  }

  private formatCustomerData(data: any): Customer {
    const formattedCustomer = {
      id: data.id,
      email: data.email,
      firstName: data.firstName || data.first_name || '',
      lastName: data.lastName || data.last_name || '',
      phone: data.phone || data.phoneNumber || data.phone_number || '',
      company: data.company || '',
      notes: data.notes || '', // Ensure notes field is properly extracted
      country: data.country || '', // Add country field
      address: data.address || '', // Add address field
      role: 'customer' as const, // Use as const to specify the exact string literal type
      verified: data.verified || false,
      createdAt: data.createdAt || data.created_at || new Date().toISOString(),
      selfRegistered: data.selfRegistered || false,
      bookings: data.bookings_count ? parseInt(data.bookings_count, 10) : 0,
    }

    console.log(
      'Formatted customer data:',
      JSON.stringify({
        id: formattedCustomer.id,
        name: `${formattedCustomer.firstName} ${formattedCustomer.lastName}`,
        notes: formattedCustomer.notes || 'No notes found in response',
        country: formattedCustomer.country || 'No country found in response',
        address: formattedCustomer.address || 'No address found in response',
      })
    )

    return formattedCustomer
  }

  async fetchCustomers(forceRefresh = false) {
    // Check if we need to refresh the data
    const now = Date.now()
    const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

    if (
      !forceRefresh &&
      this.initialized &&
      now - this.lastFetchTime < CACHE_DURATION &&
      this.customerMap.size > 0
    ) {
      return this.getAllCustomers()
    }

    // Prevent multiple simultaneous fetches
    if (this.fetchInProgress) {
      debugLog('Fetch already in progress, waiting...', 'info')
      await new Promise((resolve) => setTimeout(resolve, 100))
      return this.getAllCustomers()
    }

    this.fetchInProgress = true

    try {
      // Verify admin session using JWT auth
      const currentUser = await jwtApi.getCurrentUser()
      if (!currentUser || currentUser.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required')
      }

      // Create a custom Axios instance for direct endpoint access
      const directAxios = this.createDirectAxiosInstance()

      // First try the direct endpoint which has better error handling
      debugLog('Attempting to fetch customers from direct endpoint...', 'info')
      try {
        const directResponse = await directAxios.get('/api/admin/direct-customers.php')

        console.log('Direct customers endpoint response:', {
          status: directResponse.status,
          data: directResponse.data,
        })

        if (directResponse.status === 200 && directResponse.data.success) {
          const customersData = directResponse.data.customers
          console.log(`Found ${customersData.length} customers in direct API response`)

          // Map the customer data to our format
          const customers = customersData.map((item: any) => this.formatCustomerData(item))

          // Update the cache
          this.clearCustomerMap()
          customers.forEach((customer: Customer) => this.updateCustomerInMap(customer))
          this.lastFetchTime = now

          return customers
        } else {
          debugLog('Direct endpoint failed, falling back to original endpoint...', 'info')
        }
      } catch (directError) {
        console.error('Error with direct customers endpoint:', directError)
        debugLog('Direct endpoint error, falling back to original endpoint...', 'info')
      }

      // If direct endpoint fails, try the original endpoint
      const response = await api.get('/api/admin/direct-customers.php')

      // Log the response data structure for debugging
      console.log('Original customers API response:', response.data)

      let customersData

      // Handle different response formats:
      // 1. Direct array of customers (new format from our backend/customers/index.php)
      // 2. Object with customers property (old format)
      if (Array.isArray(response.data)) {
        customersData = response.data
      }
      // Check if response.data is an object with a customers property
      else if (
        response.data &&
        typeof response.data === 'object' &&
        response.data.customers &&
        Array.isArray(response.data.customers)
      ) {
        customersData = response.data.customers
      }
      // If we can't determine the format, use an empty array
      else {
        console.error('Unexpected customers API response format:', response.data)
        customersData = []
      }

      // Map the customer data to our format
      const customers = customersData.map((item: any) => this.formatCustomerData(item))

      // Update the cache
      this.clearCustomerMap()
      customers.forEach((customer: Customer) => this.updateCustomerInMap(customer))
      this.lastFetchTime = now

      return customers
    } catch (error) {
      debugLog('Failed to fetch customers', 'error')
      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          throw new Error('Unauthorized: Please log in again')
        }
      }
      throw error
    } finally {
      this.fetchInProgress = false
    }
  }

  // Create Axios instance for direct endpoint access
  private createDirectAxiosInstance() {
    // Use the TokenService for reliable token access
    const token = TokenService.getToken();
    
    // Add detailed debug logging
    console.log('[CustomerService] Creating direct API instance with auth token:', token ? 'Token exists' : 'No token found');
    
    if (!token) {
      // Log detailed information for debugging purposes
      console.warn('[CustomerService] Authentication token missing! Token sources:');
      console.warn(`- localStorage.auth_token: ${localStorage.getItem('auth_token') ? 'exists' : 'missing'}`);
      console.warn(`- sessionStorage.auth_token: ${sessionStorage.getItem('auth_token') ? 'exists' : 'missing'}`);
      
      // Try to get current user data to see if we're properly authenticated
      try {
        const userData = TokenService.getUserData();
        console.warn(`- User data: ${userData ? `Found (ID: ${userData.id}, Role: ${userData.role})` : 'Not found'}`);
      } catch (e) {
        console.error('[CustomerService] Error retrieving user data:', e);
      }
    }

    const baseURL = import.meta.env.VITE_PHP_API_URL || 'http://localhost:8000';
    console.log(`[CustomerService] Using API base URL: ${baseURL}`);

    const instance = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      withCredentials: true, // Important for CORS with credentials
      validateStatus: () => true, // Don't throw errors on non-2xx responses
    });

    // Log request details for debugging
    instance.interceptors.request.use(
      (config) => {
        console.log(`[CustomerService] Making ${config.method?.toUpperCase()} request to ${config.url}`);
        console.log(`[CustomerService] Auth header present: ${config.headers.Authorization ? 'Yes' : 'No'}`);
        
        // Convert PUT/DELETE methods to POST with X-HTTP-Method-Override header
        // This avoids CORS preflight issues with PUT/DELETE methods
        if (config.method?.toUpperCase() === 'PUT' || config.method?.toUpperCase() === 'DELETE') {
          config.headers['X-HTTP-Method-Override'] = config.method.toUpperCase();
          config.method = 'post';
        }
        return config;
      },
      (error) => {
        console.error('[CustomerService] Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Log responses for debugging
    instance.interceptors.response.use(
      (response) => {
        console.log(`[CustomerService] Response status: ${response.status} ${response.statusText}`);
        if (response.status === 401) {
          console.error('[CustomerService] Authentication failed - token may be invalid or expired');
        }
        return response;
      },
      (error) => {
        console.error('[CustomerService] Response error:', error);
        return Promise.reject(error);
      }
    );

    return instance;
  }

  // Add timestamp to prevent duplicate update requests
  private lastUpdateTime: Record<string, number> = {}
  private updateInProgress: Record<string, boolean> = {}

  async updateCustomer(id: string | number, data: CustomerFormData): Promise<Customer | null> {
    debugLog('Updating customer', 'info')
    console.log(
      'Updating customer with data:',
      JSON.stringify({
        id,
        ...data,
        notes: data.notes || 'No notes provided', // Log the notes value
        country: data.country || 'No country provided', // Log the country value
        address: data.address || 'No address provided', // Log the address value
      })
    )

    // Simple debounce to prevent multiple updates
    const now = Date.now()
    const updateKey = `update-${id}`
    if (this.updateInProgress[updateKey]) {
      debugLog('Update already in progress, skipping duplicate request', 'info')
      return this.getCustomerFromMap(id) || null
    }

    if (this.lastUpdateTime[updateKey] && now - this.lastUpdateTime[updateKey] < 2000) {
      debugLog('Skipping duplicate update request (debounced)', 'info')
      return this.getCustomerFromMap(id) || null
    }

    this.lastUpdateTime[updateKey] = now
    this.updateInProgress[updateKey] = true

    try {
      // Prepare the request data
      const requestData = {
        ...data,
        id,
        update_only: true, // Always set update_only for updates
      }

      debugLog('Sending update request', 'info')

      // Create a custom axios instance for the direct endpoint
      const directAxios = this.createDirectAxiosInstance()

      // Call the direct endpoint with the updated data
      debugLog('Attempting to update customer via direct endpoint', 'info')

      // Use the /api prefix which has correct CORS headers
      console.log(
        'Sending update request to direct-customers.php with data:',
        JSON.stringify(requestData)
      )
      const directResponse = await directAxios.post('/api/admin/direct-customers.php', requestData)
      console.log('Direct update customer response:', directResponse)

      if (directResponse.status === 200 && directResponse.data.success) {
        debugLog('Customer updated successfully via direct endpoint', 'info')
        const customer = this.formatCustomerData(directResponse.data.customer)

        // Ensure cache is cleared for this customer
        this.clearCustomerCache(customer.id)

        // Update customer in map
        this.updateCustomerInMap(customer)
        return customer
      } else {
        // Log error details
        debugLog(
          `Direct endpoint failed with status ${directResponse.status}: ${JSON.stringify(directResponse.data)}`,
          'error'
        )

        // If unauthorized, try to handle token issues
        if (directResponse.status === 401) {
          debugLog('Unauthorized access. Checking authentication...', 'info')
          // You could potentially refresh the token here
        }
      }

      // Fall back to the original endpoint if direct endpoint fails
      debugLog('Attempting to update customer via original endpoint', 'info')
      const response = await api.post('/customers/save.php', requestData)

      if (response.data?.success) {
        const customer = this.formatCustomerData(response.data.customer)

        // Ensure cache is cleared for this customer
        this.clearCustomerCache(customer.id)

        // Update customer in map
        this.updateCustomerInMap(customer)
        debugLog('Update successful via original endpoint', 'info')
        return customer
      } else {
        throw new Error(response.data?.message || 'Failed to update customer')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      debugLog(`Error updating customer: ${errorMessage}`, 'error')

      // Specific handling for CORS errors
      if (errorMessage.includes('Network Error')) {
        debugLog('Possible CORS issue detected. Try refreshing your authentication.', 'error')
      }

      throw error
    } finally {
      this.updateInProgress[updateKey] = false
    }
  }

  async getCustomers(forceRefresh = false) {
    // Initialize if not already done
    if (!this.initialized) {
      await this.initialize()
    } else if (forceRefresh) {
      // If forcing refresh, fetch new data
      await this.fetchCustomers(true)
    }

    return Array.from(this.customerMap.values())
  }

  async getCustomer(id: string) {
    await this.initialize()

    try {
      // First check cache for performance
      const cachedCustomer = this.getCustomerFromMap(id)

      // Attempt to fetch fresh data directly from the API for the single customer
      debugLog(`Fetching customer data for ID: ${id}`, 'info')

      // Create direct axios instance
      const directAxios = this.createDirectAxiosInstance()

      try {
        // Use direct API endpoint for a single customer with ID parameter
        const directResponse = await directAxios.get(`/api/admin/direct-customers.php?id=${id}`)

        if (directResponse.status === 200 && directResponse.data.success) {
          const customerData = directResponse.data.customer
          debugLog(`Fetched fresh customer data for ID: ${id}`, 'info')

          // Format and update cache with fresh data
          const formattedCustomer = this.formatCustomerData(customerData)
          this.updateCustomerInMap(formattedCustomer)

          return formattedCustomer
        }
      } catch (directError) {
        console.error(`Error fetching individual customer with ID ${id}:`, directError)
        debugLog(`Falling back to cached customer data for ID: ${id}`, 'info')
      }

      // Return cached customer if API fetch failed
      return cachedCustomer || null
    } catch (error) {
      debugLog(
        `Error in getCustomer for ID ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      )
      return this.getCustomerFromMap(id) || null
    }
  }

  async getCustomerByEmail(email: string): Promise<Customer | null> {
    if (!email) return null

    debugLog(`Looking for customer with email: ${email}`, 'info')

    // Try to find in cache first
    const normalizedEmail = email.toLowerCase()
    for (const customer of this.customerMap.values()) {
      if (customer.email.toLowerCase() === normalizedEmail) {
        debugLog(`Found customer in cache with ID: ${customer.id}`, 'info')
        return customer
      }
    }

    // If not in cache, try to refresh the cache
    debugLog(`Customer not found in cache, fetching latest data...`, 'info')
    try {
      await this.fetchCustomers(true) // Force refresh

      // Check again after refresh
      for (const customer of this.customerMap.values()) {
        if (customer.email.toLowerCase() === normalizedEmail) {
          debugLog(`Found customer after refresh with ID: ${customer.id}`, 'info')
          return customer
        }
      }

      debugLog(`Customer with email ${email} not found after refresh`, 'info')
      return null
    } catch (error) {
      debugLog(`Error fetching customers to find email ${email}`, 'error')
      return null
    }
  }

  /**
   * Find a customer by ID or email - useful for profile syncing
   * @param id Customer ID to look up
   * @param email Customer email as fallback
   * @returns Found customer or null
   */
  async findCustomer(id?: string | number, email?: string): Promise<Customer | null> {
    debugLog(
      `Finding customer with ${id ? `ID: ${id}` : ''} ${email ? `email: ${email}` : ''}`,
      'info'
    )

    try {
      // If we have an ID, try to find in cache first
      if (id) {
        const idStr = String(id)
        debugLog(`Checking cache for customer ID: ${idStr}`, 'info')
        const cachedCustomer = this.getCustomerFromMap(idStr)
        if (cachedCustomer) {
          debugLog(`Found customer in cache with ID: ${idStr}`, 'info')
          return cachedCustomer
        }

        // If not found in cache, try to fetch directly from API
        debugLog(`Customer ID ${idStr} not found in cache, fetching from API...`, 'info')
        try {
          // Create a direct access instance
          const directAxios = this.createDirectAxiosInstance()
          const response = await directAxios.get(`/api/admin/direct-customers.php?id=${idStr}`)

          if (response.status === 200 && response.data.success && response.data.customer) {
            const customer = this.formatCustomerData(response.data.customer)
            this.updateCustomerInMap(customer)
            debugLog(`Found customer via direct API with ID: ${idStr}`, 'info')
            return customer
          }
        } catch (directErr) {
          debugLog(
            `Direct customer API fetch failed: ${directErr instanceof Error ? directErr.message : 'Unknown error'}`,
            'error'
          )
          // Continue with fallback methods if direct fetch fails
        }
      }

      // If not found with direct ID access or no ID provided, try API lookup
      if (id || email) {
        try {
          debugLog(`Fetching customer from search API`, 'info')
          const searchParams = new URLSearchParams()
          if (id) searchParams.append('id', String(id))
          if (email) searchParams.append('email', email)

          const response = await api.get(`/customers/find?${searchParams.toString()}`)

          if (response.data?.success && response.data?.customer) {
            const customer = this.formatCustomerData(response.data.customer)
            this.updateCustomerInMap(customer)
            debugLog(`Found customer via search API`, 'info')
            return customer
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          debugLog(`Error fetching customer: ${errorMessage}`, 'error')
          debugLog(`Falling back to cache refresh and lookup`, 'info')
        }
      }

      // As a last resort, force refresh of all customers and search again
      debugLog(`Refreshing all customers and searching again`, 'info')
      await this.fetchCustomers(true) // Force refresh of all customers

      // If we have an ID, try to find by ID after refresh
      if (id) {
        const refreshedCustomer = this.getCustomerFromMap(id)
        if (refreshedCustomer) {
          debugLog(`Found customer by ID after refresh`, 'info')
          return refreshedCustomer
        }
      }

      // If we have an email and previous attempts failed, try email lookup
      if (email) {
        debugLog(`Attempting email lookup as fallback`, 'info')
        const customers = this.getAllCustomers()
        const customer = customers.find((c) => c.email.toLowerCase() === email.toLowerCase())
        if (customer) {
          debugLog(`Found customer via email lookup`, 'info')
          return customer
        }
      }

      debugLog(`No customer found with provided criteria after all attempts`, 'info')
      return null
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      debugLog(`Error in findCustomer: ${errorMessage}`, 'error')
      return null
    }
  }

  async createCustomer(customerData: CustomerFormData): Promise<Customer | null> {
    debugLog('Creating customer', 'info')
    console.log(
      'Creating customer with data:',
      JSON.stringify({
        ...customerData,
        notes: customerData.notes || 'No notes provided', // Log the notes value
      })
    )

    try {
      // Modified validation to require only firstName and lastName
      if (!customerData.firstName || !customerData.lastName) {
        const error = new Error('First name and last name are required')
        debugLog(`Validation error: ${error.message}`, 'error')
        throw error
      }

      // Extract notes from additional data if present (any custom fields in extended interface)
      const notes = (customerData as any).notes || ''

      // Ensure we have a valid email - always create a placeholder if not provided
      let formattedCustomerData = { ...customerData }
      if (!formattedCustomerData.email || formattedCustomerData.email.trim() === '') {
        // We'll create a temporary placeholder email that will be updated by the customer later
        formattedCustomerData.email = `${customerData.firstName.toLowerCase()}.${customerData.lastName.toLowerCase()}@invited.ys`
        debugLog(`Generated placeholder email: ${formattedCustomerData.email}`, 'info')
      }

      // Ensure the role is explicitly set with the correct type
      formattedCustomerData.role = 'customer' as const

      // Check if this customer already exists before creating a new one
      debugLog('Checking if customer already exists', 'info')
      const existingCustomer = await this.findCustomer(customerData.id, formattedCustomerData.email)

      if (existingCustomer) {
        debugLog('Customer already exists, updating instead of creating', 'info')
        return this.updateCustomer(existingCustomer.id, formattedCustomerData)
      }

      // Create a custom axios instance for the direct endpoint
      const directAxios = this.createDirectAxiosInstance()

      // Call the direct endpoint
      debugLog('Attempting to create customer via direct endpoint', 'info')

      // Use the /api prefix which has correct CORS headers
      const requestData = {
        ...formattedCustomerData,
        notes, // Include notes in the request
        // Add a username to prevent duplicate empty username errors
        username: `${formattedCustomerData.firstName.toLowerCase()}${formattedCustomerData.lastName.toLowerCase()}_${Date.now().toString().slice(-5)}`,
        // Include a randomly generated password for new customers
        password:
          formattedCustomerData.password ||
          Math.random().toString(36).slice(-10) +
            Math.random().toString(36).toUpperCase().slice(-2) +
            '!',
      }

      console.log(
        'Sending create request to direct-customers.php with data:',
        JSON.stringify(requestData)
      )
      const directResponse = await directAxios.post('/api/admin/direct-customers.php', requestData)
      console.log('Direct customer response:', directResponse)

      if (directResponse.status === 200 && directResponse.data.success) {
        debugLog('Customer created successfully via direct endpoint', 'info')
        const customer = this.formatCustomerData(directResponse.data.customer)
        this.updateCustomerInMap(customer)
        return customer
      } else {
        // Log error details from direct endpoint
        debugLog(
          `Direct endpoint failed with status ${directResponse.status}: ${JSON.stringify(directResponse.data)}`,
          'error'
        )
      }

      // Fall back to the original endpoint if direct endpoint fails
      debugLog('Attempting to create customer via original endpoint', 'info')
      const fallbackRequestData = {
        ...formattedCustomerData,
        email: formattedCustomerData.email, // Make sure email is explicitly included
        role: 'customer' as const, // Ensure role is explicitly set
        update_only: false,
      }

      console.log(
        'Sending fallback request to /customers/save.php with data:',
        JSON.stringify(fallbackRequestData)
      )
      const response = await api.post('/customers/save.php', fallbackRequestData)

      debugLog('Customer creation successful via original endpoint', 'info')

      if (response.data && response.data.success) {
        const customer = this.formatCustomerData(response.data.customer)
        this.updateCustomerInMap(customer)
        return customer
      } else {
        throw new Error(response.data?.message || 'Failed to create customer')
      }
    } catch (error) {
      if (error instanceof Error) {
        debugLog(`Error creating customer: ${error.message}`, 'error')

        // Add more detailed error information
        if ('response' in error && error.response) {
          const responseError = error.response as { status: number; data: any }
          debugLog(
            `Error response: ${responseError.status} - ${JSON.stringify(responseError.data)}`,
            'error'
          )
        }
      } else {
        debugLog('Unknown error creating customer', 'error')
      }

      throw error
    }
  }

  async deleteCustomer(id: string) {
    try {
      // Simple debounce to prevent multiple delete operations
      const now = Date.now()
      const deleteKey = `delete-${id}`

      if (this.deleteInProgress[deleteKey]) {
        debugLog('Delete already in progress, skipping duplicate request', 'info')
        return true
      }

      if (this.lastDeleteTime[deleteKey] && now - this.lastDeleteTime[deleteKey] < 2000) {
        debugLog('Skipping duplicate delete request (debounced)', 'info')
        return true
      }

      this.lastDeleteTime[deleteKey] = now
      this.deleteInProgress[deleteKey] = true

      debugLog(`Attempting to delete customer with ID: ${id}`, 'info')

      // Create a custom axios instance for the direct endpoint
      const directAxios = this.createDirectAxiosInstance()

      // ONLY use the /api path which has correct CORS headers
      debugLog('Trying direct API endpoint for delete', 'info')
      const directResponse = await directAxios.delete(`/api/admin/direct-customers.php?id=${id}`)

      // Log the response for debugging
      console.log('Direct delete customer response:', directResponse)

      if (directResponse.status === 200 && directResponse.data.success) {
        debugLog('Customer deleted successfully via direct endpoint', 'info')
        this.deleteCustomerFromMap(id)
        return true
      } else {
        // Log error details
        debugLog(
          `Direct endpoint failed with status ${directResponse.status}: ${JSON.stringify(directResponse.data)}`,
          'error'
        )

        // If unauthorized, try to handle token issues
        if (directResponse.status === 401) {
          debugLog('Unauthorized access. Checking authentication...', 'info')
          // You could potentially refresh the token here
        }
      }

      // Fall back to the original endpoint if direct endpoint fails
      const response = await api.delete(`/customers/${id}`)

      if (response.status === 200) {
        debugLog('Customer deleted successfully via original endpoint', 'info')
        this.deleteCustomerFromMap(id)
        return true
      } else {
        throw new Error(response.data?.message || 'Failed to delete customer')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      debugLog(`Failed to delete customer: ${errorMessage}`, 'error')

      // Specific handling for CORS errors
      if (errorMessage.includes('Network Error')) {
        debugLog('Possible CORS issue detected. Try refreshing your authentication.', 'error')
      }

      throw error
    } finally {
      const deleteKey = `delete-${id}`
      this.deleteInProgress[deleteKey] = false
    }
  }

  /**
   * Check if a client has completed registration before trying to generate an invitation
   *
   * @param clientId The ID of the client to check
   * @param options Optional parameters
   * @returns Client registration status information
   */
  async checkClientRegistrationStatus(
    clientId: number,
    options: { force?: boolean; skipAdminFallback?: boolean } = {}
  ): Promise<any> {
    try {
      debugLog(`Checking registration status for client ID: ${clientId}`)

      // Preemptively create a fallback response to use if all API calls fail
      const fallbackResponse = {
        success: true,
        client_id: clientId,
        registration_status: {
          is_registered: false,
          is_verified: false,
          has_logged_in: false,
          is_fully_registered: false,
          has_active_invitations: false,
          account_status: 'unknown',
        },
        can_generate_invitation: true,
        should_disable_invitation_button: false,
      }

      // First try the direct endpoint
      let directApiAttempted = false
      try {
        directApiAttempted = true
        const directAxios = this.createDirectAxiosInstance()
        // Add timestamp to prevent caching
        const timestamp = new Date().getTime()
        const response = await directAxios.get(
          `/auth/check-client-registration.php?client_id=${clientId}&_t=${timestamp}`,
          {
            timeout: 5000, // 5 second timeout (reduced to fail faster)
            headers: {
              'Cache-Control': 'no-cache',
              Pragma: 'no-cache',
            },
          }
        )

        if (response.data && response.data.success) {
          debugLog('Client registration status response via direct API:', response.data)
          return response.data
        } else if (response.data) {
          debugLog('Direct API returned non-success response:', response.data)
        }
      } catch (directError: any) {
        const errorMessage = directError?.message || 'Unknown error'

        // Check specifically for CORS errors
        const isCorsError =
          errorMessage.includes('CORS') ||
          errorMessage.includes('Network Error') ||
          (directError && directError.name === 'AxiosError' && directError.code === 'ERR_NETWORK')

        if (isCorsError) {
          debugLog(
            '[Network Error] [Network Error] Error checking client registration via direct API:'
          )

          // For CORS errors, we can immediately return the fallback without trying the admin endpoint
          // This speeds up the process when we know CORS issues are preventing access to the endpoints
          if (options.skipAdminFallback) {
            debugLog(
              'Skipping admin endpoint fallback due to CORS error and skipAdminFallback option'
            )
            return fallbackResponse
          }
        } else {
          debugLog('Error checking client registration via direct API:', errorMessage)
        }
      }

      // If direct endpoint fails, try the admin endpoint
      try {
        debugLog(
          '[info] Making request to /api/admin/check-client-status.php?client_id=' + clientId
        )
        const timestamp = new Date().getTime() // Add cache busting here too
        const response = await api.get(
          `/api/admin/check-client-status.php?client_id=${clientId}&_t=${timestamp}`,
          {
            timeout: 5000, // 5 second timeout
            headers: {
              'Cache-Control': 'no-cache',
              Pragma: 'no-cache',
            },
          }
        )

        if (response.data && response.data.success) {
          const data = response.data
          debugLog('Client registration status response via admin API:', data)

          // Transform the data to match the direct endpoint format
          return {
            success: true,
            client_id: data.client_id,
            email: data.email,
            name: data.name || '',
            registration_status: {
              is_registered: data.registration_status?.is_registered || false,
              is_verified: data.registration_status?.is_verified || false,
              has_logged_in: data.registration_status?.has_logged_in || false,
              is_fully_registered: data.registration_status?.is_fully_registered || false,
              has_active_invitations: data.registration_status?.has_active_invitations || false,
              account_status: data.registration_status?.account_status || 'unknown',
            },
            can_generate_invitation: data.can_generate_invitation || true,
            should_disable_invitation_button: data.should_disable_invitation_button || false,
          }
        } else if (response.data) {
          debugLog('Admin API returned non-success response:', response.data)
        }
      } catch (adminError: any) {
        debugLog(
          '[' +
            (adminError?.message || 'Unknown error') +
            '] Error checking client registration via admin endpoint:'
        )
      }

      // If both endpoints fail, return the fallback response
      debugLog('Both registration status endpoints failed, using fallback response')
      return fallbackResponse
    } catch (error: any) {
      debugLog('Error checking client registration status:', error?.message || 'Unknown error')
      // Return fallback instead of throwing - better to continue than to block invitation generation
      return {
        success: true,
        client_id: clientId,
        registration_status: {
          is_registered: false,
          is_verified: false,
          has_logged_in: false,
          is_fully_registered: false,
          account_status: 'unknown',
        },
        can_generate_invitation: true,
        should_disable_invitation_button: false,
      }
    }
  }

  /**
   * Get an invitation link for a client
   *
   * @param clientId The ID of the client to invite
   * @param force Whether to force generating a new invitation even if one exists
   * @returns The invitation link
   */
  async getInviteLink(clientId: number, force: boolean = false): Promise<string> {
    try {
      debugLog(`Getting invite link for customer ID: ${clientId}`)

      // Try to check registration status, but don't block if it fails
      let shouldPreventInvitation = false
      try {
        const registrationStatus = await this.checkClientRegistrationStatus(clientId, {
          force,
          skipAdminFallback: true, // Skip admin endpoint if direct endpoint fails with CORS error
        })

        // Only prevent invitation if we get a definitive "should_disable" response
        if (registrationStatus?.should_disable_invitation_button === true && !force) {
          debugLog(`Client ${clientId} has already registered and completed account setup.`)
          shouldPreventInvitation = true
        }
      } catch (checkError) {
        // If checking registration status fails (e.g., due to CORS), log and continue
        debugLog(
          'Registration check failed but proceeding with invitation generation:',
          checkError instanceof Error ? checkError.message : 'Unknown error'
        )
        // Don't let CORS errors stop the invitation generation
      }

      // If we definitively know the client is registered, block the invitation
      if (shouldPreventInvitation && !force) {
        throw new Error(
          'This client has already registered and completed account setup. Invitation links cannot be generated for registered clients. Use "Force" option if you need to override this.'
        )
      }

      // Try the direct endpoint first
      try {
        const directAxios = this.createDirectAxiosInstance()
        const timestamp = new Date().getTime()
        const response = await directAxios.post(
          '/api/admin/direct-invitations.php',
          {
            clientId: clientId.toString(),
            force,
            timestamp, // Add cache busting
          },
          {
            timeout: 8000, // 8 second timeout - increased for reliability
            headers: {
              'Cache-Control': 'no-cache',
              Pragma: 'no-cache',
            },
          }
        )

        debugLog('Direct invitation response:', response.data)

        if (response.data?.success) {
          return response.data.invitation_url
        } else if (response.data) {
          debugLog(`Direct endpoint failed: ${response.data.message || 'No error message'}`)
        }
      } catch (directError: any) {
        const errorMessage = directError?.message || 'Unknown error'
        debugLog('Error getting invite link from direct endpoint:', errorMessage)

        // If we get a security-related error, don't try the fallback
        if (
          errorMessage.includes('already registered') ||
          errorMessage.includes('completed account setup')
        ) {
          throw directError
        }

        // Log CORS errors specifically but continue to fallback
        if (
          errorMessage.includes('Network Error') ||
          errorMessage.includes('CORS') ||
          errorMessage.includes('ERR_NETWORK')
        ) {
          debugLog('Possible CORS error detected, continuing to fallback')
        }
      }

      // Fall back to original invitation endpoint
      debugLog('Falling back to original invitation endpoint')

      try {
        debugLog(`Making request to /api/admin/generate-invitation`)
        const timestamp = new Date().getTime()
        const response = await api.post(
          '/api/admin/generate-invitation',
          {
            clientId: clientId.toString(),
            force,
            timestamp, // Add cache busting
          },
          {
            timeout: 8000, // 8 second timeout - increased for reliability
            headers: {
              'Cache-Control': 'no-cache',
              Pragma: 'no-cache',
            },
          }
        )

        if (response.data?.success) {
          return response.data.invitation_url
        } else {
          throw new Error(response.data?.message || 'Failed to generate invitation')
        }
      } catch (fallbackError: any) {
        const errorMessage = fallbackError?.message || 'Unknown error'
        debugLog('Failed to generate invite link via fallback:', errorMessage)

        // Specific handling for CORS errors in the fallback
        const isCorsOrNetworkError =
          errorMessage.includes('Network Error') ||
          errorMessage.includes('CORS') ||
          fallbackError.code === 'ERR_NETWORK'

        if (isCorsOrNetworkError) {
          throw new Error(
            `Failed to generate invitation link due to network issues. The server may be experiencing CORS configuration problems. Please try again later or check with your server administrator.`
          )
        } else {
          throw new Error(`Failed to generate invitation link: ${errorMessage}`)
        }
      }
    } catch (error: any) {
      debugLog('Error getting invite link:', error)
      throw error
    }
  }

  /**
   * Check the invitation status for a customer
   * @param customerId The ID of the customer to check
   * @returns Information about the customer's invitation status
   */
  async checkInvitationStatus(customerId: string): Promise<{
    success: boolean
    hasInvitations: boolean
    hasActiveInvitation: boolean
    expiresAt?: string
    invitations?: Array<{
      id: string
      token: string
      createdAt: string
      expiresAt: string
      isExpired: boolean
      isUsed: boolean
      usedAt?: string
      status: 'active' | 'used' | 'expired'
    }>
    message?: string
    error?: string
  }> {
    try {
      debugLog(`Checking invitation status for customer ID: ${customerId}`, 'info')

      // Try the direct endpoint first
      try {
        const directAxios = this.createDirectAxiosInstance()
        const directResponse = await directAxios.get(
          `/api/admin/direct-invitations.php?client_id=${customerId}`
        )

        debugLog('Direct invitation status response:', 'info')
        console.log('Direct invitation status response:', directResponse.data)

        if (directResponse.data.success) {
          debugLog('Successfully fetched invitation status via direct API', 'info')

          const hasActiveInvitation = Boolean(directResponse.data.has_active_invitation)

          // If we have invitations, find the active one to get expiration date
          let expiresAt: string | undefined
          if (directResponse.data.invitations && directResponse.data.invitations.length > 0) {
            const activeInvitation = directResponse.data.invitations.find(
              (inv: any) => inv.status === 'active'
            )
            if (activeInvitation) {
              expiresAt = activeInvitation.expires_at
            }
          }

          return {
            success: true,
            hasInvitations: Boolean(directResponse.data.has_invitations),
            hasActiveInvitation: hasActiveInvitation,
            expiresAt,
            invitations: directResponse.data.invitations,
            message: directResponse.data.message,
          }
        } else {
          // If direct endpoint fails but provides a message, log it
          debugLog(
            `Direct invitation status endpoint failed: ${directResponse.data.message || 'Unknown error'}`,
            'warn'
          )
        }
      } catch (directError) {
        // Log error but don't throw yet - try the original endpoint
        const errorMessage = directError instanceof Error ? directError.message : 'Unknown error'
        debugLog(`Error with direct invitation status endpoint: ${errorMessage}`, 'warn')
        console.warn('Direct invitation status endpoint error:', directError)
      }

      // Fall back to original endpoint
      debugLog('Falling back to original invitation status endpoint', 'info')
      const response = await api.get(
        `/api/admin/check-invitation-status.php?client_id=${customerId}`
      )

      if (response.data.success) {
        const hasActiveInvitation = Boolean(response.data.has_active_invitation)

        // If we have invitations, find the active one to get expiration date
        let expiresAt: string | undefined
        if (response.data.invitations && response.data.invitations.length > 0) {
          const activeInvitation = response.data.invitations.find(
            (inv: any) => inv.status === 'active'
          )
          if (activeInvitation) {
            expiresAt = activeInvitation.expires_at
          }
        }

        return {
          success: true,
          hasInvitations: Boolean(response.data.has_invitations),
          hasActiveInvitation: hasActiveInvitation,
          expiresAt,
          invitations: response.data.invitations,
          message: response.data.message,
        }
      } else {
        debugLog(`Failed to retrieve invitation status: ${response.data.message}`, 'error')
        return {
          success: false,
          hasInvitations: false,
          hasActiveInvitation: false,
          message: response.data.message,
          error: response.data.error || 'unknown_error',
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      debugLog(`Error checking invitation status: ${errorMessage}`, 'error')

      return {
        success: false,
        hasInvitations: false,
        hasActiveInvitation: false,
        message: 'Failed to check invitation status',
        error: errorMessage,
      }
    }
  }

  async attachPassport(customerId: string, documentId: string): Promise<boolean> {
    // Implementation of attachPassport method
    // This is a placeholder and should be implemented based on your actual requirements
    return false // Placeholder return, actual implementation needed
  }

  /**
   * @deprecated This function is deprecated and will always return a warning.
   * The backend endpoint '/customers/register' no longer exists.
   * Customer registration is now handled directly in the database.
   */
  async addRegisteredCustomer(customerData: CustomerData): Promise<void> {
    console.warn(
      'DEPRECATED FUNCTION: addRegisteredCustomer is no longer supported as the /customers/register endpoint was removed'
    )
    console.warn('This is a no-op function that will not perform any operations')
    return
  }

  /**
   * Clear the customer cache for a specific customer or the entire cache
   */
  clearCustomerCache(id?: string | number): void {
    if (id) {
      // Clear specific customer
      console.log(`Clearing cache for customer ID: ${id}`)
      this.deleteCustomerFromMap(id)

      // Also reset fetch timestamp to force a refresh on next request
      this.lastFetchTime = 0

      // Clear any update in progress flags for this customer
      if (id in this.updateInProgress) {
        delete this.updateInProgress[id.toString()]
      }

      // Clear any delete in progress flags for this customer
      if (id in this.deleteInProgress) {
        delete this.deleteInProgress[id.toString()]
      }
    } else {
      // Clear entire cache
      console.log('Clearing entire customer cache')
      this.clearCustomerMap()
      this.lastFetchTime = 0
      this.updateInProgress = {}
      this.deleteInProgress = {}
    }

    // Reset initialization to force refresh on next getCustomers
    this.initialized = false
  }

  /**
   * Update customer profile data
   */
  async updateCustomerProfile(customerId: string | number, data: Partial<Customer>) {
    debugLog(`Updating customer profile ${customerId}`, 'info')

    try {
      const response = await api.patch(`/customers/${customerId}/profile`, data)
      if (response.data?.success) {
        const updatedCustomer = this.formatCustomerData(response.data.customer)
        this.updateCustomerInMap(updatedCustomer)
        return updatedCustomer
      }
      throw new Error('Failed to update customer profile')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      debugLog(`Error updating customer profile: ${errorMessage}`, 'error')
      throw error
    }
  }

  /**
   * Get all bookings for a specific customer
   */
  async getCustomerBookings(customerId: string): Promise<CustomerBooking[]> {
    try {
      debugLog(`Getting bookings for customer ID: ${customerId}`, 'info')

      // Try the direct endpoint first (with proper CORS headers)
      try {
        const directAxios = this.createDirectAxiosInstance()
        const directResponse = await directAxios.get(
          `/api/admin/direct-bookings.php?customer_id=${customerId}`
        )

        // Check if the direct endpoint worked
        if (directResponse.status === 200 && directResponse.data.success) {
          debugLog(
            `Successfully retrieved bookings from direct endpoint: ${directResponse.data.data.length} bookings found`,
            'info'
          )
          return directResponse.data.data.map((booking: any) => {
            // Determine if this customer is the main charterer or a guest
            const isMainCharterer = String(booking.mainCharterer?.id) === customerId

            return {
              ...booking,
              role: isMainCharterer ? 'main_charterer' : 'guest',
              // Ensure totalPrice always has a value to prevent toLocaleString errors
              totalPrice: booking.totalPrice || 0,
            }
          })
        } else {
          debugLog(`Direct bookings endpoint failed with status ${directResponse.status}`, 'info')
          // Return empty array instead of trying fallback that doesn't exist
          return []
        }
      } catch (directError) {
        const errorMessage = directError instanceof Error ? directError.message : 'Unknown error'
        debugLog(`Error using direct bookings endpoint: ${errorMessage}`, 'error')
        // Return empty array instead of trying fallback that doesn't exist
        return []
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      debugLog(`Error getting customer bookings: ${errorMessage}`, 'error')
      return []
    }
  }

  /**
   * Update only the notes for a customer
   * This is a more focused method than updateCustomer to handle just notes updates
   */
  async updateCustomerNotes(id: string | number, notes: string): Promise<boolean> {
    debugLog(`Updating notes for customer ID: ${id}`, 'info')

    try {
      // Create a custom axios instance for the direct endpoint
      const directAxios = this.createDirectAxiosInstance()

      // Prepare the request data - only include what's needed
      const requestData = {
        id,
        notes,
      }

      console.log(
        'Sending notes update request to direct-customers.php with data:',
        JSON.stringify(requestData)
      )

      // Call the direct endpoint with the notes data
      const directResponse = await directAxios.post('/api/admin/direct-customers.php', requestData)
      console.log('Notes update response:', directResponse)

      if (directResponse.status === 200 && directResponse.data.success) {
        debugLog('Notes updated successfully', 'info')

        // If we have a customer in the map, update it with the new notes
        const existingCustomer = this.getCustomerFromMap(id)
        if (existingCustomer) {
          const updatedCustomer = {
            ...existingCustomer,
            notes,
          }

          // Update the cache
          this.updateCustomerInMap(updatedCustomer as Customer)

          // Return the updated customer record from the API response if available
          if (directResponse.data.customer) {
            // This includes more complete customer data from the backend
            const apiCustomer = directResponse.data.customer

            // Update the cache with the complete data
            this.updateCustomerInMap({
              ...existingCustomer,
              ...apiCustomer,
              notes: apiCustomer.notes || notes, // Ensure notes are used even if API doesn't return them
            } as Customer)
          }
        }

        return true
      } else {
        // Log error details
        debugLog(
          `Notes update failed with status ${directResponse.status}: ${JSON.stringify(directResponse.data)}`,
          'error'
        )
        return false
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      debugLog(`Error updating notes: ${errorMessage}`, 'error')
      throw error
    }
  }

  /**
   * Ensure customer notes are properly synchronized
   * This is a utility method to make sure notes are preserved across components
   */
  async ensureCustomerNotesSynced(customerId: string | number, notes?: string): Promise<boolean> {
    try {
      if (notes === undefined) {
        // Just invalidate cache if no notes provided
        this.clearCustomerCache(customerId)
        return true
      }

      debugLog(`Ensuring notes are synced for customer ID: ${customerId}`, 'info')
      console.log(`Syncing notes for customer: ${customerId}, notes: "${notes || ''}"`)

      // Get the current customer data first
      const customer = await this.getCustomer(customerId.toString())

      // If customer has no notes but we have notes, update them
      if (
        customer &&
        (!customer.notes || customer.notes.trim() === '') &&
        notes &&
        notes.trim() !== ''
      ) {
        debugLog(`Customer ${customerId} has no notes but we have notes to sync`, 'info')

        // Update the notes
        const updated = await this.updateCustomerNotes(customerId.toString(), notes)
        if (updated) {
          debugLog(`Successfully synced notes for customer ${customerId}`, 'info')
          return true
        }
      } else if (customer) {
        // Customer already has notes or we don't have notes to sync
        // Just ensure cache is fresh
        this.clearCustomerCache(customerId)
        return true
      }

      return false
    } catch (error) {
      debugLog(
        `Error syncing notes for customer ${customerId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      )
      return false
    }
  }
}

export const customerService = new CustomerService(
  import.meta.env.VITE_PHP_API_URL || 'http://localhost:8888'
)
