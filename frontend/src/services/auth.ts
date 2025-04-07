import api from './api'
import { User, AdminUser, ClientUser } from '@/contexts/types'
import { customerService, CreateCustomerDTO } from './customerService'

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterData extends LoginCredentials {
  firstName: string
  lastName: string
  phoneNumber?: string
  company?: string
}

interface AuthResponse {
  token: string
  user: User
}

// Mock user data for development
const MOCK_USER: User = {
  id: 'user-001',
  email: 'demo@charterhub.com',
  firstName: 'Demo',
  lastName: 'User',
  role: 'customer',
}

// Mock credentials for development
const MOCK_CREDENTIALS = {
  email: 'demo@charterhub.com',
  password: 'demo123',
}

// Test user credentials
const TEST_USER = {
  id: 'user-test1',
  email: 'test1@me.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'customer',
  password: 'password123',
}

// Initialize dev_users in localStorage if none exist
export const initializeDevUsers = () => {
  try {
    const existingUsers = localStorage.getItem('dev_users')

    if (!existingUsers) {
      console.log('No dev_users found in localStorage. Initializing with default users...')
      const defaultUsers = [
        {
          ...MOCK_USER,
          password: MOCK_CREDENTIALS.password,
        },
        TEST_USER,
      ]

      localStorage.setItem('dev_users', JSON.stringify(defaultUsers))
      console.log('Initialized dev_users with default mock users.')
    }
  } catch (error) {
    console.error('Error initializing dev_users:', error)
  }
}

// Call initialization on import
if (process.env.NODE_ENV === 'development' || import.meta.env.DEV) {
  initializeDevUsers()

  // Development helper to show credentials in console
  console.log('Development Login Credentials:', {
    demo: {
      email: MOCK_CREDENTIALS.email,
      password: MOCK_CREDENTIALS.password,
    },
    test: {
      email: TEST_USER.email,
      password: TEST_USER.password,
    },
  })
}

// Use a minimal delay to avoid blocking operations
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Minimal delay (100ms instead of 800ms)
    await delay(100)

    // Simple credential check without extensive modifications
    if (
      credentials.email.toLowerCase() === MOCK_CREDENTIALS.email.toLowerCase() &&
      credentials.password === MOCK_CREDENTIALS.password
    ) {
      return {
        token: 'mock-jwt-token',
        user: MOCK_USER,
      }
    }

    // Add test user but with minimal code - case insensitive email check
    if (
      credentials.email.toLowerCase() === TEST_USER.email.toLowerCase() &&
      credentials.password === TEST_USER.password
    ) {
      // Construct the proper user type based on role
      const userRole = TEST_USER.role
      let testUser: User

      if (userRole === 'admin') {
        testUser = {
          id: TEST_USER.id,
          email: TEST_USER.email,
          firstName: TEST_USER.firstName,
          lastName: TEST_USER.lastName,
          role: 'admin',
          permissions: ['all'], // Default permissions for admin
        }
      } else {
        testUser = {
          id: TEST_USER.id,
          email: TEST_USER.email,
          firstName: TEST_USER.firstName,
          lastName: TEST_USER.lastName,
          role: 'customer',
          phone: (TEST_USER as any).phone,
          company: (TEST_USER as any).company,
        }
      }

      return {
        token: 'mock-jwt-token',
        user: testUser,
      }
    }

    // Check dev_users in localStorage
    try {
      const devUsers = JSON.parse(localStorage.getItem('dev_users') || '[]')
      const devUser = devUsers.find(
        (user: any) =>
          user.email.toLowerCase() === credentials.email.toLowerCase() &&
          user.password === credentials.password
      )

      if (devUser) {
        console.log('Found matching user in dev_users:', devUser.email)

        // Create the correct user type based on role
        const userRole = devUser.role === 'admin' ? 'admin' : 'customer'
        let user: User

        if (userRole === 'admin') {
          user = {
            id: devUser.id,
            email: devUser.email,
            firstName: devUser.firstName,
            lastName: devUser.lastName,
            role: 'admin',
            permissions: devUser.permissions || ['all'],
          }
        } else {
          user = {
            id: devUser.id,
            email: devUser.email,
            firstName: devUser.firstName,
            lastName: devUser.lastName,
            role: 'customer',
            phone: devUser.phone || devUser.phoneNumber,
            company: devUser.company,
          }
        }

        return {
          token: 'mock-jwt-token',
          user: user,
        }
      }
    } catch (err) {
      console.error('Error checking dev_users:', err)
    }

    // Check for users created during registration (development mode only)
    if (process.env.NODE_ENV === 'development') {
      try {
        const MOCK_USERS = JSON.parse(localStorage.getItem('charterhub_mock_users') || '[]')
        const mockUser = MOCK_USERS.find(
          (user: any) =>
            user.email.toLowerCase() === credentials.email.toLowerCase() &&
            user.password === credentials.password
        )

        if (mockUser) {
          console.log('Development mode: Authenticated registered user:', mockUser.email)

          // Find the actual user data from customerService
          const allCustomers = await customerService.getCustomers()
          const userRecord = allCustomers.find(
            (c) => c.id === mockUser.userId || c.email === mockUser.email
          )

          // If user exists in authentication but not in customer list, add them to customers
          if (!userRecord && mockUser.userId) {
            try {
              // Create a customer record for this authenticated user
              await customerService.createCustomer({
                firstName: mockUser.firstName || 'New',
                lastName: mockUser.lastName || 'User',
                email: mockUser.email,
                // Add any other available fields
              })
              console.log('Created missing customer record for authenticated user:', mockUser.email)
            } catch (err) {
              console.error('Failed to create customer record for authenticated user:', err)
            }
          }

          // Retry getting user record after potential creation
          const updatedCustomers = await customerService.getCustomers()
          const updatedUserRecord = updatedCustomers.find(
            (c) => c.id === mockUser.userId || c.email === mockUser.email
          )

          if (updatedUserRecord) {
            // Create a properly typed user based on role
            const isAdmin =
              updatedUserRecord.role &&
              typeof updatedUserRecord.role === 'string' &&
              updatedUserRecord.role.toLowerCase() === 'admin'

            if (isAdmin) {
              const adminUser: AdminUser = {
                id: updatedUserRecord.id,
                email: updatedUserRecord.email,
                firstName: updatedUserRecord.firstName,
                lastName: updatedUserRecord.lastName,
                role: 'admin',
                permissions: ['all'],
              }

              return {
                token: 'mock-jwt-token',
                user: adminUser,
              }
            } else {
              const clientUser: ClientUser = {
                id: updatedUserRecord.id,
                email: updatedUserRecord.email,
                firstName: updatedUserRecord.firstName,
                lastName: updatedUserRecord.lastName,
                role: 'customer',
                phone: updatedUserRecord.phone,
                company: updatedUserRecord.company,
                country: updatedUserRecord.country,
                address: updatedUserRecord.address,
                notes: updatedUserRecord.notes,
              }

              return {
                token: 'mock-jwt-token',
                user: clientUser,
              }
            }
          }
        }
      } catch (err) {
        console.error('Error checking mock users:', err)
      }
    }

    throw new Error('Invalid credentials')
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    // Minimal delay (100ms instead of 800ms)
    await delay(100)

    // Simulate registration
    const userId = `user-${Math.floor(Math.random() * 10000)}`
    const newUser: User = {
      id: userId,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: 'customer',
    }

    // Save in localStorage for development (this is mock data - never store real credentials)
    if (process.env.NODE_ENV === 'development') {
      try {
        const MOCK_USERS = JSON.parse(localStorage.getItem('charterhub_mock_users') || '[]')
        MOCK_USERS.push({
          userId,
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          created: new Date().toISOString(),
        })
        localStorage.setItem('charterhub_mock_users', JSON.stringify(MOCK_USERS))
      } catch (error) {
        console.error('Error storing mock user:', error)
      }
    }

    // Add user to customerService to ensure synchronization
    try {
      await customerService.createCustomer({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phoneNumber,
        company: data.company,
      })
      console.log('Created customer record for newly registered user:', data.email)
    } catch (err) {
      console.error('Failed to create customer record for registered user:', err)
      // Continue with authentication even if customer creation fails
      // This prevents blocking the user from accessing the app
    }

    // Return token and user data
    return {
      token: 'mock-jwt-token',
      user: newUser,
    }
  },

  async forgotPassword(email: string): Promise<void> {
    await delay(100)
    if (email !== MOCK_CREDENTIALS.email) {
      throw new Error('User not found')
    }
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await delay(100)
    if (!token || !password) {
      throw new Error('Invalid token or password')
    }
  },

  async getProfile(): Promise<User> {
    await delay(100)
    return MOCK_USER
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    await delay(100)

    try {
      // First, try to get the current user data from localStorage or sessionStorage
      const userData = localStorage.getItem('user_data') || sessionStorage.getItem('user_data')
      const currentUser = userData ? JSON.parse(userData) : null

      console.log('Updating profile for user:', currentUser?.email, 'with data:', data)

      // The user we're going to update
      let userToUpdate = currentUser || MOCK_USER

      // Create the updated user object, preserving the ID and role from the current user
      const updatedUser: User = {
        ...userToUpdate,
        ...data,
        id: userToUpdate.id, // Ensure we don't lose the ID
        role: userToUpdate.role, // Preserve the original role
      }

      // Update the dev_users in localStorage
      try {
        const devUsers = JSON.parse(localStorage.getItem('dev_users') || '[]')
        const userIndex = devUsers.findIndex(
          (u: any) =>
            u.email &&
            userToUpdate.email &&
            u.email.toLowerCase() === userToUpdate.email.toLowerCase()
        )

        if (userIndex !== -1) {
          // Update the existing user
          devUsers[userIndex] = {
            ...devUsers[userIndex],
            ...data,
            id: devUsers[userIndex].id, // Keep the original ID
          }

          // Save back to localStorage
          localStorage.setItem('dev_users', JSON.stringify(devUsers))
          console.log('Updated user in dev_users')
        }
      } catch (error) {
        console.error('Error updating dev_users:', error)
      }

      // Also update user_data in localStorage and sessionStorage to ensure consistency
      if (userData) {
        const storageToUpdate = localStorage.getItem('user_data') ? localStorage : sessionStorage
        storageToUpdate.setItem('user_data', JSON.stringify(updatedUser))
        console.log('Updated user_data in storage')
      }

      // If it's a customer role, also sync with customer service
      if (updatedUser.role === 'customer') {
        try {
          // Find the correct ID format used in the customer service for this user
          const customers = await customerService.getCustomers()
          const matchingCustomer = customers.find(
            (c) => c.email.toLowerCase() === updatedUser.email.toLowerCase()
          )

          if (matchingCustomer) {
            console.log('Found matching customer in customer service:', matchingCustomer.id)

            // Map the user data fields to customer data fields
            const customerData = {
              firstName: updatedUser.firstName,
              lastName: updatedUser.lastName,
              email: updatedUser.email,
              phone: (updatedUser as any).phone || (updatedUser as any).phoneNumber || '',
              company: (updatedUser as any).company || '',
            }

            // Use the ID from the customer service
            await customerService.updateCustomer(matchingCustomer.id, customerData)

            console.log('Successfully synchronized with customer service')
          } else {
            console.warn(
              'No matching customer found in customer service. Attempting to create one.'
            )

            // If no matching customer is found, try to create one
            try {
              const newCustomer = await customerService.createCustomer({
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                email: updatedUser.email,
                phone: (updatedUser as any).phone || (updatedUser as any).phoneNumber || '',
                company: (updatedUser as any).company || '',
              })

              console.log('Created new customer record:', newCustomer.id)
            } catch (createError) {
              console.error('Failed to create new customer record:', createError)
            }
          }
        } catch (syncError) {
          console.error('Error syncing with customer service:', syncError)
        }
      }

      return updatedUser
    } catch (error) {
      console.error('Error in updateProfile:', error)

      // Fallback to basic update
      const updatedUser: User = {
        ...MOCK_USER,
        ...data,
        role: 'customer',
      }
      return updatedUser
    }
  },

  logout(): void {
    // Simple logout without token manipulation
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    sessionStorage.removeItem('auth_token')
    sessionStorage.removeItem('user_data')
  },

  async validateToken(token: string): Promise<boolean> {
    await delay(100)
    return token === 'mock-jwt-token'
  },
}
