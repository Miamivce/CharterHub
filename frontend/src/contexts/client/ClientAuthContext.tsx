import { createContext, useContext, useState, useEffect } from 'react'
import type { ClientUser } from '@/contexts/types'
import { clientApi } from '@/services/api'
import type { ContextProviderProps } from '@/contexts/types'
import { debugLog } from '@/utils/logger'

interface ClientAuthContextType {
  user: ClientUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  verifySession: () => Promise<void>
  logout: () => Promise<void>
}

const ClientAuthContext = createContext<ClientAuthContextType | null>(null)

export const ClientAuthProvider = ({ children }: ContextProviderProps) => {
  const [user, setUser] = useState<ClientUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const mapToClientUser = (userData: any): ClientUser => ({
    id: userData.id,
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    displayName: userData.displayName || `${userData.firstName} ${userData.lastName}`,
    role: 'client',
    verified: userData.verified,
  })

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      setError(null)

      debugLog('Starting client login process', 'ClientAuth')
      const response = await clientApi.post('/auth/login.php', { email, password })

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Login failed')
      }

      const clientUser = mapToClientUser(response.data.user)
      setUser(clientUser)
      debugLog('Client login successful', 'ClientAuth')
    } catch (err) {
      setUser(null)
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      setError(errorMessage)
      debugLog(`Client login failed: ${errorMessage}`, 'ClientAuth', 'error')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const verifySession = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await clientApi.get('/auth/verify.php')

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Session verification failed')
      }

      const clientUser = mapToClientUser(response.data.user)
      setUser(clientUser)
      debugLog('Client session verified', 'ClientAuth')
    } catch (err) {
      setUser(null)
      // Don't set error on initial session verification
      if (err instanceof Error && err.message !== 'No active session') {
        setError('Session verification failed')
        debugLog('Client session verification failed', 'ClientAuth', 'error')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      debugLog('Starting client logout process', 'ClientAuth')
      await clientApi.post('/auth/logout.php')
      setUser(null)
      setError(null)
      debugLog('Client logout successful', 'ClientAuth')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed'
      setError(errorMessage)
      debugLog(`Client logout failed: ${errorMessage}`, 'ClientAuth', 'error')
      // Still clear user state even if logout request fails
      setUser(null)
      throw err
    }
  }

  // Verify session on mount
  useEffect(() => {
    verifySession().catch(() => {
      // Error is already handled in verifySession
    })
  }, [])

  return (
    <ClientAuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        verifySession,
        logout,
      }}
    >
      {children}
    </ClientAuthContext.Provider>
  )
}

export const useClientAuth = () => {
  const context = useContext(ClientAuthContext)
  if (!context) {
    throw new Error('useClientAuth must be used within a ClientAuthProvider')
  }
  return context
}
