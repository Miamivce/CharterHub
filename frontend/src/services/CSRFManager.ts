import axios from 'axios'

// Constants
const CSRF_TOKEN_KEY = 'csrf_token'
const CSRF_TOKEN_TIMESTAMP_KEY = 'csrf_token_timestamp'
const TOKEN_EXPIRY_MS = 30 * 60 * 1000 // 30 minutes
const DEVELOPMENT_MODE = import.meta.env.MODE === 'development'

/**
 * CSRF Token Manager
 *
 * This module provides efficient management of CSRF tokens with features like:
 * - Automatic token fetching when needed
 * - Token caching and expiration handling
 * - Promise deduplication to prevent multiple concurrent fetches
 * - Debug logging for development environments
 */
class CSRFTokenManager {
  private tokenPromise: Promise<string | null> | null = null
  private tokenPromiseTimestamp: number = 0
  private API_URL = import.meta.env.VITE_PHP_API_URL || 'http://localhost:8888'
  private retryAttempts: number = 0
  private MAX_RETRIES = 3

  /**
   * Get the current CSRF token from storage
   */
  getToken(): string | null {
    return sessionStorage.getItem(CSRF_TOKEN_KEY)
  }

  /**
   * Get the current token or empty string, never returns null
   * This is useful for non-critical operations where we want to proceed
   * even if the token fetch fails
   */
  getCachedTokenOrEmpty(): string {
    const token = this.getToken()
    return token || ''
  }

  /**
   * Store a CSRF token in session storage
   */
  setToken(token: string): void {
    if (!token) return
    sessionStorage.setItem(CSRF_TOKEN_KEY, token)
    sessionStorage.setItem(CSRF_TOKEN_TIMESTAMP_KEY, Date.now().toString())
    if (DEVELOPMENT_MODE) {
      console.log('CSRF token stored:', token.substring(0, 6) + '...')
    }
  }

  /**
   * Remove the stored CSRF token
   */
  removeToken(): void {
    sessionStorage.removeItem(CSRF_TOKEN_KEY)
    sessionStorage.removeItem(CSRF_TOKEN_TIMESTAMP_KEY)
    this.tokenPromise = null
    this.tokenPromiseTimestamp = 0
    this.retryAttempts = 0
  }

  /**
   * Check if the stored token has expired
   */
  isTokenExpired(): boolean {
    const timestamp = sessionStorage.getItem(CSRF_TOKEN_TIMESTAMP_KEY)
    if (!timestamp) return true

    const tokenAge = Date.now() - parseInt(timestamp, 10)
    return tokenAge > TOKEN_EXPIRY_MS
  }

  /**
   * Ensure a valid CSRF token is available
   * This will fetch a new token if none exists or if the current one is expired
   */
  async ensureToken(forceRefresh = false): Promise<string | null> {
    // Check if we already have a valid token and don't need to force refresh
    const currentToken = this.getToken()
    if (currentToken && !this.isTokenExpired() && !forceRefresh) {
      if (DEVELOPMENT_MODE) {
        console.log('Using existing CSRF token:', currentToken.substring(0, 6) + '...')
      }
      return currentToken
    }

    // If we have a pending token fetch that's less than 5 seconds old, reuse it
    if (this.tokenPromise && Date.now() - this.tokenPromiseTimestamp < 5000) {
      if (DEVELOPMENT_MODE) {
        console.log('Reusing pending CSRF token promise')
      }
      try {
        return await this.tokenPromise
      } catch (error) {
        // If the promise is rejected, clear it immediately so we can try again
        console.warn('Previous token fetch failed, will try again')
        this.tokenPromise = null
        // Fall through to fetch a new token
      }
    }

    // Create a new token promise
    this.tokenPromiseTimestamp = Date.now()
    this.tokenPromise = this.fetchNewToken()

    try {
      const token = await this.tokenPromise
      // Reset retry counter on success
      this.retryAttempts = 0
      return token
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error)

      // Clear the failed promise immediately
      this.tokenPromise = null

      // Try to handle recovery with retries (for non-CORS errors)
      if (this.retryAttempts < this.MAX_RETRIES) {
        this.retryAttempts++
        console.log(`Retrying CSRF token fetch (attempt ${this.retryAttempts}/${this.MAX_RETRIES})`)

        // Add a small delay before retry
        await new Promise((resolve) => setTimeout(resolve, 1000 * this.retryAttempts))
        return this.ensureToken(true)
      }

      this.retryAttempts = 0
      return null
    }
  }

  /**
   * Fetch a new CSRF token from the server
   * @private
   */
  private async fetchNewToken(): Promise<string | null> {
    try {
      if (DEVELOPMENT_MODE) {
        console.log('Fetching fresh CSRF token')
      }

      // Create a completely isolated axios instance with no inheritance from global defaults
      const tokenClient = axios.create({
        baseURL: this.API_URL,
        timeout: 10000,
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          // Removed problematic headers that cause CORS issues
        },
      })

      if (DEVELOPMENT_MODE) {
        console.log('[CSRFManager] Requesting token from:', this.API_URL + '/auth/csrf-token.php')
        console.log(
          '[CSRFManager] CSRF request headers:',
          JSON.stringify(tokenClient.defaults.headers)
        )
      }

      try {
        // No interceptors or other configuration that could add unwanted headers
        const response = await tokenClient.get('/auth/csrf-token.php')

        if (response.data?.csrf_token || response.data?.token) {
          const token = response.data?.csrf_token || response.data?.token
          this.setToken(token)
          if (DEVELOPMENT_MODE) {
            console.log('[CSRFManager] Successfully retrieved and stored new CSRF token')
          }
          return token
        }

        console.warn('[CSRFManager] Server did not return a CSRF token')
        return null
      } catch (requestError) {
        // Special handling for CORS errors
        if (axios.isAxiosError(requestError) && requestError.message.includes('CORS')) {
          console.warn(
            '[CSRFManager] CORS error during token fetch, will use empty token as fallback'
          )
          return ''
        }
        throw requestError
      }
    } catch (error) {
      // Log detailed error information to help diagnose CORS issues
      if (axios.isAxiosError(error)) {
        if (error.message === 'Network Error') {
          console.error(
            '[CSRFManager] CSRF token fetch failed with network error. Possible CORS issue.'
          )
        } else if (error.response) {
          console.error('[CSRFManager] CSRF token fetch failed with status:', error.response.status)
          console.error('[CSRFManager] Response data:', error.response.data)
        }

        // Log request details that might reveal header issues
        if (error.config) {
          console.error('[CSRFManager] Request URL:', error.config.url)
          console.error('[CSRFManager] Request headers:', error.config.headers)
        }
      } else {
        console.error('[CSRFManager] Failed to fetch CSRF token with error:', error)
      }

      throw error
    }
  }
}

// Create singleton instance
const CSRFManager = new CSRFTokenManager()
export default CSRFManager
