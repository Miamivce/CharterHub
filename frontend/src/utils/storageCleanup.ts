/**
 * Storage Cleanup Utility
 *
 * This utility helps ensure no development data or sensitive information
 * is left in localStorage or sessionStorage, especially in production.
 */
import {
  TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  TOKEN_EXPIRY_KEY,
  USER_DATA_KEY,
  REMEMBER_ME_KEY,
} from '../services/jwtApi'

// List of legitimate token/auth keys that should NOT be removed
const LEGITIMATE_AUTH_KEYS = [
  TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  TOKEN_EXPIRY_KEY,
  USER_DATA_KEY,
  REMEMBER_ME_KEY,
  'loginInProgress', // Session flag for login process
]

// List of known development keys that should never be in production
const DEV_STORAGE_KEYS = [
  // Development verification keys
  'dev_verification_email',
  'dev_verification_timestamp',
  'dev_verification_token',

  // Mock data
  'mock_admin_session',

  // Any other development keys
  'debug_mode',
  'test_user',
  'dev_flags',
]

// List of temporary keys that should be cleaned up after they've served their purpose
const TEMPORARY_KEYS = ['verificationLink', 'pendingVerificationEmail', 'registeredEmail']

// Redirection keys need special handling - they are legitimate but temporary
const REDIRECT_KEY = 'redirectAfterLogin'

/**
 * Removes all development keys from both localStorage and sessionStorage
 */
export const cleanupDevStorage = (): void => {
  DEV_STORAGE_KEYS.forEach((key) => {
    try {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    } catch (error) {
      console.error(`Error removing key ${key} from storage:`, error)
    }
  })
}

/**
 * Removes temporary storage keys that are no longer needed
 */
export const cleanupTemporaryStorage = (): void => {
  TEMPORARY_KEYS.forEach((key) => {
    try {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    } catch (error) {
      console.error(`Error removing temporary key ${key} from storage:`, error)
    }
  })
}

/**
 * Securely stores a redirect URL in sessionStorage
 * This ensures we're only storing temporary navigation state, not sensitive data
 */
export const setRedirectUrl = (url: string): void => {
  try {
    if (url && typeof url === 'string') {
      // Only store valid internal paths, not full URLs (security measure)
      if (url.startsWith('/') && !url.includes('//')) {
        sessionStorage.setItem(REDIRECT_KEY, url)
      }
    }
  } catch (error) {
    console.error('Error setting redirect URL:', error)
  }
}

/**
 * Gets and clears the redirect URL in one operation
 * This ensures the redirect URL is only used once
 */
export const getAndClearRedirectUrl = (): string => {
  try {
    const url = sessionStorage.getItem(REDIRECT_KEY)
    sessionStorage.removeItem(REDIRECT_KEY)
    return url || '/dashboard' // Default to dashboard if no redirect URL
  } catch (error) {
    console.error('Error getting/clearing redirect URL:', error)
    return '/dashboard' // Default to dashboard if there's an error
  }
}

/**
 * Checks if the current environment is production
 */
export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production'
}

/**
 * Performs a complete cleanup on application startup
 * In production, this removes ALL development keys
 * In development, this is more selective
 */
export const performStartupStorageCleanup = (): void => {
  // In production, be aggressive about removing development data
  if (isProduction()) {
    cleanupDevStorage()

    // Clean up any items with obvious development prefixes but preserve legitimate auth keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (
        key &&
        !LEGITIMATE_AUTH_KEYS.includes(key) &&
        (key.startsWith('dev_') || key.startsWith('test_') || key.startsWith('mock_'))
      ) {
        localStorage.removeItem(key)
      }
    }

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (
        key &&
        !LEGITIMATE_AUTH_KEYS.includes(key) &&
        (key.startsWith('dev_') || key.startsWith('test_') || key.startsWith('mock_'))
      ) {
        sessionStorage.removeItem(key)
      }
    }

    // Handle redirect key - only keep if it's a valid internal path
    const redirectUrl = sessionStorage.getItem(REDIRECT_KEY)
    if (
      redirectUrl &&
      (!redirectUrl.startsWith('/') ||
        redirectUrl.includes('//') ||
        redirectUrl.includes('javascript:'))
    ) {
      // Remove potentially dangerous redirect URLs
      sessionStorage.removeItem(REDIRECT_KEY)
    }
  } else {
    // In development, just clean up known dev keys to avoid disrupting testing
    cleanupDevStorage()
  }

  // Always clean up temporary storage keys that might have been left from a previous session
  cleanupTemporaryStorage()

  console.log('[StorageCleanup] Storage cleanup completed')
}

/**
 * Immediately removes all sensitive or development data from storage
 * Use this function for emergency cleanup or when switching from dev to prod
 */
export const emergencyCleanup = (): void => {
  // First, clean up all known development keys
  cleanupDevStorage()

  // Clean up temporary storage
  cleanupTemporaryStorage()

  // Clean up redirectAfterLogin if it contains suspicious values
  const redirectUrl = sessionStorage.getItem(REDIRECT_KEY)
  if (
    redirectUrl &&
    (!redirectUrl.startsWith('/') ||
      redirectUrl.includes('//') ||
      redirectUrl.includes('javascript:'))
  ) {
    sessionStorage.removeItem(REDIRECT_KEY)
  }

  // Clean up all wp_ prefixed items (WordPress-related data)
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('wp_')) {
      localStorage.removeItem(key)
    }
  }

  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i)
    if (key && key.startsWith('wp_')) {
      sessionStorage.removeItem(key)
    }
  }

  // Remove any other potentially sensitive data
  localStorage.removeItem('user_data')
  localStorage.removeItem('user_token')
  localStorage.removeItem('admin_session')
  localStorage.removeItem('dev_users')
  sessionStorage.removeItem('user_data')
  sessionStorage.removeItem('user_token')
  sessionStorage.removeItem('admin_session')
  sessionStorage.removeItem('dev_users')

  console.log('[StorageCleanup] Emergency cleanup completed')
}

/**
 * Checks if there is any sensitive data in storage
 * @returns Object containing information about sensitive data found
 */
export const checkForSensitiveData = (): {
  hasSensitiveData: boolean
  items: Array<{ storage: string; key: string }>
} => {
  const sensitiveItems: Array<{ storage: string; key: string }> = []

  // Check for development keys
  DEV_STORAGE_KEYS.forEach((key) => {
    if (localStorage.getItem(key)) {
      sensitiveItems.push({ storage: 'localStorage', key })
    }
    if (sessionStorage.getItem(key)) {
      sensitiveItems.push({ storage: 'sessionStorage', key })
    }
  })

  // Check for items with sensitive prefixes
  const sensitivePatterns = [
    'dev_',
    'mock_',
    'test_',
    'password',
    'token',
    'auth_',
    'secret',
    'api_key',
  ]

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) {
      const isLegitimate = LEGITIMATE_AUTH_KEYS.includes(key)
      const isSensitive = sensitivePatterns.some((pattern) => key.toLowerCase().includes(pattern))

      if (isSensitive && !isLegitimate) {
        sensitiveItems.push({ storage: 'localStorage', key })
      }
    }
  }

  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i)
    if (key) {
      const isLegitimate = LEGITIMATE_AUTH_KEYS.includes(key)
      const isSensitive = sensitivePatterns.some((pattern) => key.toLowerCase().includes(pattern))

      if (isSensitive && !isLegitimate) {
        sensitiveItems.push({ storage: 'sessionStorage', key })
      }
    }
  }

  return {
    hasSensitiveData: sensitiveItems.length > 0,
    items: sensitiveItems,
  }
}

// Export a default function for convenient imports
export default performStartupStorageCleanup
