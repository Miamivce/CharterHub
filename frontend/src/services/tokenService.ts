// Token service - centralizes token handling across the application
// This solves the issue where different services access tokens in different ways

// Storage keys
export const TOKEN_KEY = 'auth_token'
export const REFRESH_TOKEN_KEY = 'refresh_token'
export const TOKEN_EXPIRY_KEY = 'token_expiry'
export const USER_DATA_KEY = 'user_data'
export const REMEMBER_ME_KEY = 'remember_me'
export const RATE_LIMIT_KEY = 'api_rate_limit'

// Helper to determine which storage to use based on rememberMe preference
const getStorageType = (): Storage => {
  const rememberMe = localStorage.getItem(REMEMBER_ME_KEY)
  return rememberMe === 'true' ? localStorage : sessionStorage
}

// Enhanced token storage service with better error handling and fallbacks
export const TokenService = {
  // Get token with enhanced error handling and fallback
  getToken: (): string | null => {
    try {
      // Attempt to get token from preferred storage
      const storage = getStorageType();
      let token = storage.getItem(TOKEN_KEY);
      
      // If token not found in preferred storage, check the other storage as fallback
      if (!token) {
        const fallbackStorage = storage === localStorage ? sessionStorage : localStorage;
        token = fallbackStorage.getItem(TOKEN_KEY);
        
        // If found in fallback, migrate to preferred storage for future access
        if (token) {
          console.log('[TokenService] Found token in fallback storage, migrating to preferred storage');
          storage.setItem(TOKEN_KEY, token);
          
          // Also migrate other auth-related data for consistency
          const userData = fallbackStorage.getItem(USER_DATA_KEY);
          const expiry = fallbackStorage.getItem(TOKEN_EXPIRY_KEY);
          
          if (userData) storage.setItem(USER_DATA_KEY, userData);
          if (expiry) storage.setItem(TOKEN_EXPIRY_KEY, expiry);
        }
      }
      
      // Sanity check to prevent null tokens
      if (token === 'null' || token === 'undefined') {
        console.warn('[TokenService] Found invalid token value, returning null instead');
        return null;
      }
      
      return token;
    } catch (error) {
      console.error('[TokenService] Error retrieving token:', error);
      return null;
    }
  },
  
  // Get token expiry with error handling
  getTokenExpiry: (): number | null => {
    try {
      const storage = getStorageType();
      let expiry = storage.getItem(TOKEN_EXPIRY_KEY);
      
      // If not found in preferred storage, check fallback
      if (!expiry) {
        const fallbackStorage = storage === localStorage ? sessionStorage : localStorage;
        expiry = fallbackStorage.getItem(TOKEN_EXPIRY_KEY);
        
        // If found in fallback, migrate to preferred
        if (expiry) {
          console.log('[TokenService] Found expiry in fallback storage, migrating to preferred');
          storage.setItem(TOKEN_EXPIRY_KEY, expiry);
        }
      }
      
      if (!expiry) return null;
      
      const expiryNum = parseInt(expiry, 10);
      return isNaN(expiryNum) ? null : expiryNum;
    } catch (error) {
      console.error('[TokenService] Error retrieving token expiry:', error);
      return null;
    }
  },
  
  // Store token with proper error handling
  storeToken: (token: string, expiresIn: number, rememberMe?: boolean): void => {
    try {
      if (!token) {
        console.error('[TokenService] Attempted to store empty token');
        return;
      }
      
      const storage = rememberMe !== undefined 
        ? (rememberMe ? localStorage : sessionStorage) 
        : getStorageType();
      
      // Update remember me preference if specified
      if (rememberMe !== undefined) {
        localStorage.setItem(REMEMBER_ME_KEY, rememberMe.toString());
      }
      
      const expiryTime = Date.now() + expiresIn * 1000;
      storage.setItem(TOKEN_KEY, token);
      storage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
      
      // Clear token from the other storage to avoid inconsistency
      const otherStorage = storage === localStorage ? sessionStorage : localStorage;
      otherStorage.removeItem(TOKEN_KEY);
      otherStorage.removeItem(TOKEN_EXPIRY_KEY);
      
      // Store a token timestamp to help troubleshoot auth issues
      storage.setItem('auth_token_timestamp', Date.now().toString());
      
      console.log(`[TokenService] Token stored successfully, expires at ${new Date(expiryTime).toLocaleString()}`);
    } catch (error) {
      console.error('[TokenService] Error storing token:', error);
    }
  },
  
  // Get user data with fallback mechanism
  getUserData: (): any => {
    try {
      const storage = getStorageType();
      let userData = storage.getItem(USER_DATA_KEY);
      
      // If not found in preferred storage, check fallback
      if (!userData) {
        const fallbackStorage = storage === localStorage ? sessionStorage : localStorage;
        userData = fallbackStorage.getItem(USER_DATA_KEY);
        
        // If found in fallback, migrate to preferred
        if (userData) {
          console.log('[TokenService] Found user data in fallback storage, migrating to preferred');
          storage.setItem(USER_DATA_KEY, userData);
        }
      }
      
      if (!userData) {
        console.warn('[TokenService] No user data found in any storage location');
        return null;
      }
      
      try {
        return JSON.parse(userData);
      } catch (parseError) {
        console.error('[TokenService] Failed to parse user data:', parseError);
        // Clean up invalid data
        storage.removeItem(USER_DATA_KEY);
        return null;
      }
    } catch (error) {
      console.error('[TokenService] Error retrieving user data:', error);
      return null;
    }
  },
  
  // Store user data with error handling
  storeUserData: (userData: any): void => {
    try {
      if (!userData || !userData.id) {
        console.error('[TokenService] Attempted to store invalid user data');
        return;
      }
      
      // Ensure we store a clean object without circular references
      // Create a sanitized version with just the essential fields
      const sanitizedUserData = {
        id: userData.id,
        email: userData.email || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        role: userData.role || 'client',
        displayName: userData.displayName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
        verified: !!userData.verified,
        // Add a timestamp for debugging
        _stored: Date.now()
      };
      
      const userDataString = JSON.stringify(sanitizedUserData);
      
      const storage = getStorageType();
      storage.setItem(USER_DATA_KEY, userDataString);
      
      // Also store user ID and role separately for quick access
      storage.setItem('auth_user_id', sanitizedUserData.id.toString());
      if (sanitizedUserData.role) storage.setItem('auth_user_role', sanitizedUserData.role.toString());
      
      // For consistency, store in both storage locations to prevent refresh issues
      const otherStorage = storage === localStorage ? sessionStorage : localStorage;
      otherStorage.setItem(USER_DATA_KEY, userDataString);
      otherStorage.setItem('auth_user_id', sanitizedUserData.id.toString());
      if (sanitizedUserData.role) otherStorage.setItem('auth_user_role', sanitizedUserData.role.toString());
      
      console.log('[TokenService] User data stored successfully in both storage locations');
    } catch (error) {
      console.error('[TokenService] Error storing user data:', error);
    }
  },
  
  // Check if token is expired
  isTokenExpired: (): boolean => {
    try {
      const expiry = TokenService.getTokenExpiry();
      if (!expiry) return true;
      
      const now = Date.now();
      // Add a 5-second buffer to prevent edge-case timing issues
      return now >= (expiry - 5000);
    } catch (error) {
      console.error('[TokenService] Error checking token expiration:', error);
      return true; // Assume expired on error
    }
  },
  
  // Check if we have valid authentication
  hasValidAuth: (): boolean => {
    try {
      const token = TokenService.getToken();
      const userData = TokenService.getUserData();
      
      // Only consider valid if we have both token and user data
      return !!token && !TokenService.isTokenExpired() && !!userData && !!userData.id;
    } catch (error) {
      console.error('[TokenService] Error checking auth validity:', error);
      return false;
    }
  },
  
  // Clear all token data
  clearTokens: (): void => {
    try {
      [localStorage, sessionStorage].forEach(storage => {
        storage.removeItem(TOKEN_KEY);
        storage.removeItem(REFRESH_TOKEN_KEY);
        storage.removeItem(TOKEN_EXPIRY_KEY);
        storage.removeItem(USER_DATA_KEY);
        storage.removeItem('auth_user_id');
        storage.removeItem('auth_user_role');
        storage.removeItem('auth_token_timestamp');
      });
      console.log('[TokenService] All tokens cleared');
    } catch (error) {
      console.error('[TokenService] Error clearing tokens:', error);
    }
  },
  
  // Mark that we've just logged in (to help with race conditions)
  markLoginRedirect: (userId: string, userRole: string): void => {
    try {
      sessionStorage.setItem('auth_redirect_timestamp', Date.now().toString());
      sessionStorage.setItem('auth_user_id', userId);
      sessionStorage.setItem('auth_user_role', userRole);
      console.log('[TokenService] Login redirect marked');
    } catch (error) {
      console.error('[TokenService] Error marking login redirect:', error);
    }
  }
};

export default TokenService; 