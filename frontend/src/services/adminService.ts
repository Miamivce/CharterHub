import axios from 'axios'
import axiosInstance from '@/services/api'
import { User } from '@/contexts/types'
import { AdminUserFormData } from '@/components/admin/AdminUserModal'

// Interface for admin users with phone
export interface AdminUser extends Omit<User, 'role'> {
  phone?: string
  role: 'admin'
  username?: string
}

// Base API path for admin endpoints
const ADMIN_API_BASE = '/api/admin'
// Backend server URL - use environment variable if available or default to localhost:8000
const BACKEND_URL = import.meta.env.VITE_PHP_API_URL || 'http://localhost:8000'

// Constants for token storage keys (these should match what's used in the auth system)
const TOKEN_KEY = 'auth_token'
const SESSION_TOKEN_KEY = 'auth_token' // Same key, but we'll check both storage types

/**
 * Get the auth token from either localStorage or sessionStorage
 * This ensures we support both "Remember Me" (localStorage) and session-only storage
 */
const getAuthToken = (): string | null => {
  // First try localStorage
  const localToken = localStorage.getItem(TOKEN_KEY)
  if (localToken) {
    return localToken
  }

  // Then try sessionStorage
  const sessionToken = sessionStorage.getItem(SESSION_TOKEN_KEY)
  if (sessionToken) {
    return sessionToken
  }

  return null
}

// Helper function to create an authenticated axios instance
const createAuthAxios = () => {
  const token = getAuthToken()

  return axios.create({
    baseURL: BACKEND_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    validateStatus: () => true, // Don't throw errors on non-2xx responses
  })
}

export const adminService = {
  // Get all admin users
  async getAdminUsers(): Promise<AdminUser[]> {
    try {
      console.log('Fetching admin users...')

      // Get the token using our helper function
      const token = getAuthToken()
      console.log('Auth token available:', !!token)

      if (!token) {
        console.warn('No auth token found - user may not be properly authenticated')
      }

      // Create a special axios instance for this request
      const adminAxios = createAuthAxios()

      // First try the direct endpoint which has better error handling
      const directResponse = await adminAxios.get('/api/admin/direct-admin-users.php', {
        params: { role: 'admin' },
      })

      console.log('Direct admin users response:', {
        status: directResponse.status,
        data: directResponse.data,
      })

      if (directResponse.status === 200 && directResponse.data.success) {
        console.log(`Found ${directResponse.data.users.length} admin users in direct API response`)
        return directResponse.data.users || []
      }

      // If direct endpoint fails for any reason, try the original endpoint as fallback
      // (This is just a fallback in case the direct endpoint has issues)
      console.log('Direct endpoint failed, trying original endpoint...')
      const response = await adminAxios.get(`/api/admin/users`, {
        params: { role: 'admin' },
      })

      console.log('Original endpoint response:', {
        status: response.status,
        data: response.data,
      })

      // Handle 401/404 errors from the original endpoint
      if (response.status === 401 || response.status === 404) {
        console.warn(
          `${response.status} error from original endpoint. Falling back to direct-users.php...`
        )

        // Last resort: Try the basic users endpoint
        const basicResponse = await adminAxios.get('/api/admin/direct-users.php')

        if (basicResponse.status === 200 && basicResponse.data.success) {
          console.log('Fallback endpoint succeeded:', basicResponse.data)
          return basicResponse.data.admin_users || []
        }

        return []
      }

      // Parse response from original endpoint if it worked
      if (response.data && response.data.users && Array.isArray(response.data.users)) {
        return response.data.users
      }

      if (Array.isArray(response.data)) {
        return response.data
      }

      console.error('All endpoints failed. No admin users retrieved.')
      return []
    } catch (error) {
      console.error('Failed to fetch admin users:', error)

      // Try basic direct endpoint as final fallback
      try {
        const adminAxios = createAuthAxios()
        const basicResponse = await adminAxios.get('/api/admin/direct-users.php')

        if (basicResponse.status === 200 && basicResponse.data.success) {
          console.log('Final fallback endpoint succeeded:', basicResponse.data)
          return basicResponse.data.admin_users || []
        }
      } catch (fallbackError) {
        console.error('All fallback attempts failed:', fallbackError)
      }

      return []
    }
  },

  // Get a specific admin user
  async getAdminUser(id: string): Promise<AdminUser> {
    try {
      const adminAxios = createAuthAxios()

      // First try the direct endpoint
      const directResponse = await adminAxios.get(`/api/admin/direct-admin-users.php`, {
        params: { id },
      })

      if (
        directResponse.status === 200 &&
        directResponse.data.success &&
        directResponse.data.user
      ) {
        return directResponse.data.user
      }

      // Fall back to original endpoint if direct fails
      const response = await adminAxios.get(`${ADMIN_API_BASE}/users/user.php`, {
        params: { id },
      })

      if (response.status === 200 && response.data.user) {
        return response.data.user
      }

      throw new Error('User not found')
    } catch (error) {
      console.error('Failed to fetch admin user:', error)
      throw new Error('Failed to fetch user details. Please try again later.')
    }
  },

  // Create a new admin user
  async createAdminUser(data: AdminUserFormData): Promise<AdminUser> {
    try {
      console.log('Creating admin user with data:', {
        ...data,
        password: data.password ? '********' : undefined, // Mask password in logs
        creatorPassword: data.creatorPassword ? '********' : undefined, // Mask creator password in logs
      })

      const adminAxios = createAuthAxios()

      // Ensure role is admin
      const userData = {
        ...data,
        role: 'admin',
      }

      console.log('Trying direct endpoint for admin user creation...')
      // First try direct endpoint
      const directResponse = await adminAxios.post('/api/admin/direct-admin-users.php', userData)
      console.log(
        'Direct endpoint response:',
        directResponse.status,
        directResponse.data.success ? 'Success' : 'Failed',
        directResponse.data.message || ''
      )

      if (
        directResponse.status === 200 &&
        directResponse.data.success &&
        directResponse.data.user
      ) {
        console.log('Admin user created successfully with direct endpoint')
        return directResponse.data.user
      }

      // If direct endpoint failed, log the error
      if (directResponse.data && !directResponse.data.success) {
        console.error('Direct endpoint error:', directResponse.data.message)
        throw new Error(directResponse.data.message || 'Failed to create user with direct endpoint')
      }

      console.log('Direct endpoint failed, trying original endpoint...')
      // Fall back to original endpoint
      const response = await adminAxios.post(`${ADMIN_API_BASE}/users/create.php`, userData)
      console.log('Original endpoint response:', response.status, response.data)

      if (response.status === 200 && response.data.user) {
        console.log('Admin user created successfully with original endpoint')
        return response.data.user
      }

      throw new Error('Failed to create user: No user data returned from any endpoint')
    } catch (error: any) {
      console.error('Failed to create admin user:', error)
      let message = 'Failed to create admin user'

      // Handle specific verification errors
      if (error.response?.data?.message) {
        if (error.response.data.message.includes('verification failed')) {
          message = error.response.data.message
        } else if (error.response.status === 401) {
          message = 'Authentication failed. Please check your credentials.'
        } else {
          message = error.response.data.message
        }
      } else if (error.message) {
        message = error.message
      }

      throw new Error(message)
    }
  },

  // Update an admin user
  async updateAdminUser(id: string, data: Partial<AdminUserFormData>): Promise<AdminUser> {
    try {
      const adminAxios = createAuthAxios()

      // Ensure role is admin
      const userData = {
        ...data,
        id, // Include ID for the direct endpoint
        role: 'admin',
      }

      // First try direct endpoint
      const directResponse = await adminAxios.post('/api/admin/direct-admin-users.php', userData)

      if (
        directResponse.status === 200 &&
        directResponse.data.success &&
        directResponse.data.user
      ) {
        return directResponse.data.user
      }

      // Fall back to original endpoint
      const response = await adminAxios.post(`${ADMIN_API_BASE}/users/user.php?id=${id}`, data)

      if (response.status === 200 && response.data.user) {
        return response.data.user
      }

      throw new Error('Failed to update user: No user data returned')
    } catch (error: any) {
      console.error(`Failed to update admin user ID ${id}:`, error)
      const message =
        error.response?.data?.message || error.message || 'Failed to update admin user'
      throw new Error(`Failed to update admin user: ${message}`)
    }
  },

  // Delete an admin user
  async deleteAdminUser(id: string): Promise<void> {
    try {
      const adminAxios = createAuthAxios()

      // First try direct endpoint
      const directResponse = await adminAxios.delete('/api/admin/direct-admin-users.php', {
        params: { id },
      })

      if (directResponse.status === 200 && directResponse.data.success) {
        return
      }

      // Fall back to original endpoint
      const response = await adminAxios.delete(`${ADMIN_API_BASE}/users/user.php?id=${id}`)

      if (response.status === 200) {
        return
      }

      throw new Error('Failed to delete user')
    } catch (error: any) {
      console.error(`Failed to delete admin user ID ${id}:`, error)
      const message =
        error.response?.data?.message || error.message || 'Failed to delete admin user'
      throw new Error(`Failed to delete admin user: ${message}`)
    }
  },
}
