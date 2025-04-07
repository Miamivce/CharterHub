/**
 * Authentication utilities for token management
 */

const TOKEN_KEY = 'auth_token'

/**
 * Retrieves the authentication token from storage
 *
 * @returns string | null The authentication token or null if not found
 */
export function getAuthToken(): string | null {
  // Determine which storage to use based on how the token was saved
  const useLocalStorage = localStorage.getItem('remember_me') === 'true'
  const storage = useLocalStorage ? localStorage : sessionStorage

  // Get the token from storage
  return storage.getItem(TOKEN_KEY)
}

/**
 * Sets the authentication token in storage
 *
 * @param token The token to store
 * @param rememberMe Whether to store in localStorage (persistent) or sessionStorage
 */
export function setAuthToken(token: string, rememberMe: boolean = false): void {
  const storage = rememberMe ? localStorage : sessionStorage

  // Remember the storage choice
  localStorage.setItem('remember_me', rememberMe.toString())

  // Store the token
  storage.setItem(TOKEN_KEY, token)
}

/**
 * Removes the authentication token from storage
 */
export function removeAuthToken(): void {
  // Clear from both storages to be safe
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
}

/**
 * Checks if a user is authenticated (has a token)
 *
 * @returns boolean True if authenticated, false otherwise
 */
export function isAuthenticated(): boolean {
  return getAuthToken() !== null
}
