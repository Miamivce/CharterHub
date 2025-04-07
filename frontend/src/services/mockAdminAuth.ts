import { AdminUser } from '@/contexts/types'

// Mock admin users for development
const MOCK_ADMINS = [
  {
    id: '1',
    wpUserId: '1',
    email: 'admin@charterhub.com',
    username: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    role: 'administrator' as const,
    permissions: ['manage_users', 'manage_content', 'view_analytics'],
    lastLogin: new Date().toISOString(),
  },
]

// Mock admin tokens for development
interface MockToken {
  token: string
  refreshToken: string
  expiry: number
  userId: number
}

// In-memory token storage for development
const MOCK_TOKENS: MockToken[] = []

// Helper to generate a JWT token
const generateToken = async (userId: string, role: string, expiry: number): Promise<string> => {
  // Create JWT header and payload
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  }

  const payload = {
    sub: userId,
    role: role,
    exp: expiry,
    iat: Math.floor(Date.now() / 1000),
  }

  // Base64Url encode header and payload
  const base64UrlEncode = (str: string): string => {
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))

  // Create signature using Web Crypto API
  const encoder = new TextEncoder()
  const data = encoder.encode(encodedHeader + '.' + encodedPayload)
  const secretKey = 'charterhub_jwt_secret_key_change_in_production' // Match backend secret exactly

  // Import key for HMAC
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secretKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  // Sign the data
  const signature = await crypto.subtle.sign('HMAC', key, data)

  // Convert signature to Base64Url
  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

  // Return complete JWT
  return `${encodedHeader}.${encodedPayload}.${signatureBase64}`
}

// Generate expiry time based on remember me setting
const getExpiryTime = (rememberMe: boolean): number => {
  const now = Date.now()
  return rememberMe ? now + 30 * 24 * 60 * 60 * 1000 : now + 1 * 60 * 60 * 1000
}

// Helper to determine which storage to use
const getStorage = (rememberMe: boolean = false): Storage => {
  return rememberMe ? localStorage : sessionStorage
}

export const mockAdminAuthService = {
  async login(
    usernameOrEmail: string,
    password: string,
    rememberMe = false
  ): Promise<{ token: string; refreshToken: string; user: AdminUser }> {
    // Get credentials from environment
    const validUsername = import.meta.env.VITE_WORDPRESS_USERNAME || 'admin'
    const validPassword = import.meta.env.VITE_WORDPRESS_PASSWORD || 'Admin@123!'
    const apiUrl = import.meta.env.VITE_PHP_API_URL || 'http://localhost:8000'

    // Check credentials
    const isValidCredentials =
      (usernameOrEmail === validUsername || usernameOrEmail === 'admin@charterhub.com') &&
      password === validPassword

    if (isValidCredentials) {
      // Use first mock admin
      const admin = MOCK_ADMINS[0]

      // Generate expiry time
      const expiry = getExpiryTime(rememberMe)

      // Generate new tokens
      const token = await generateToken(admin.id, 'administrator', expiry)
      const refreshToken = await generateToken(admin.id, 'administrator', expiry + 3600000)

      // Store refresh token in database via API
      try {
        const response = await fetch(`${apiUrl}/auth/store-refresh-token.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Origin: import.meta.env.VITE_FRONTEND_URL || 'http://localhost:3000',
          },
          credentials: 'include',
          body: JSON.stringify({
            userId: admin.id,
            refreshToken: refreshToken,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to store refresh token')
        }
      } catch (error) {
        console.error('Error storing refresh token:', error)
        throw new Error('Authentication failed: Could not store refresh token')
      }

      // Store token in mock storage
      MOCK_TOKENS.push({
        token,
        refreshToken,
        expiry,
        userId: Number(admin.id),
      })

      // Store in browser storage
      const storage = getStorage(rememberMe)
      storage.setItem('admin_token', token)
      storage.setItem('admin_refresh_token', refreshToken)
      storage.setItem('admin_token_expiry', expiry.toString())
      storage.setItem('remember_me', rememberMe.toString())

      console.log('Mock Admin Login Successful:', { admin, token })

      return {
        token,
        refreshToken,
        user: admin as AdminUser,
      }
    }

    throw new Error(
      'Invalid credentials. Use username "admin" or email "admin@charterhub.com" with password "Admin@123!"'
    )
  },

  async logout(): Promise<void> {
    console.log('Mock Admin Logout')
    // Clear both storage locations
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_refresh_token')
    localStorage.removeItem('admin_token_expiry')
    localStorage.removeItem('remember_me')

    sessionStorage.removeItem('admin_token')
    sessionStorage.removeItem('admin_refresh_token')
    sessionStorage.removeItem('admin_token_expiry')
    sessionStorage.removeItem('remember_me')

    // Clear mock storage
    MOCK_TOKENS.length = 0
  },

  async refreshToken(refreshToken: string, rememberMe = false): Promise<string> {
    // Find token in mock storage
    const existingToken = MOCK_TOKENS.find((t) => t.refreshToken === refreshToken)

    if (!existingToken) {
      throw new Error('Invalid refresh token')
    }

    // Generate new tokens
    const newToken = await generateToken(
      existingToken.userId.toString(),
      'administrator',
      existingToken.expiry
    )
    const newRefreshToken = await generateToken(
      existingToken.userId.toString(),
      'administrator',
      existingToken.expiry + 3600000
    )
    const expiry = getExpiryTime(rememberMe)

    // Update token in mock storage
    const tokenIndex = MOCK_TOKENS.findIndex((t) => t.refreshToken === refreshToken)
    MOCK_TOKENS[tokenIndex] = {
      token: newToken,
      refreshToken: newRefreshToken,
      expiry,
      userId: existingToken.userId,
    }

    // Store in browser storage
    const storage = getStorage(rememberMe)
    storage.setItem('admin_token', newToken)
    storage.setItem('admin_refresh_token', newRefreshToken)
    storage.setItem('admin_token_expiry', expiry.toString())

    console.log('Mock Token Refreshed:', {
      newToken,
      expiry: new Date(expiry).toISOString(),
      storage: rememberMe ? 'localStorage' : 'sessionStorage',
    })

    return newToken
  },

  async getCurrentAdmin(): Promise<AdminUser | null> {
    // Check if we have a valid token
    const token = this.getStoredToken()
    const refreshToken = this.getStoredRefreshToken()

    if (!token || !refreshToken) {
      return null
    }

    // In development mode, return mock admin
    return MOCK_ADMINS[0] as AdminUser
  },

  isAuthenticated(): boolean {
    const token = this.getStoredToken()
    const refreshToken = this.getStoredRefreshToken()
    return !!(token && refreshToken)
  },

  getStoredToken(): string | null {
    return localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token')
  },

  getStoredRefreshToken(): string | null {
    return (
      localStorage.getItem('admin_refresh_token') || sessionStorage.getItem('admin_refresh_token')
    )
  },
}
