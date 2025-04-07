/**
 * Auth types for the JWT authentication system
 */

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phoneNumber?: string
  company?: string
  role: 'admin' | 'client'
  verified: boolean
  createdAt?: string
  updatedAt?: string
  // Internal tracking field for UI updates
  _lastUpdated?: number
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  phoneNumber?: string
  company?: string
  role?: string
  rememberMe?: boolean
}

export interface PasswordResetData {
  token: string
  email: string
  newPassword: string
}

export interface UserProfileUpdateData {
  firstName?: string
  lastName?: string
  email?: string
  phoneNumber?: string
  company?: string
}

export interface AuthState {
  isInitialized: boolean
  isAuthenticated: boolean
  user: User | null
}

export interface AuthResponse {
  user: User
  token: string
  refreshToken?: string
}
