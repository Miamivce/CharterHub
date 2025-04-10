// Token service - centralizes token handling across the application
// This solves the issue where different services access tokens in different ways

// Import constants from jwtApi.ts
export const TOKEN_KEY = 'auth_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';
export const TOKEN_EXPIRY_KEY = 'token_expiry';
export const USER_DATA_KEY = 'user_data';
export const REMEMBER_ME_KEY = 'remember_me';

// Helper to determine which storage to use based on rememberMe preference
const getStorageType = (): Storage => {
  const useLocalStorage = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
  return useLocalStorage ? localStorage : sessionStorage;
};

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
      const expiry = getStorageType().getItem(TOKEN_EXPIRY_KEY);
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
      
      console.log(`[TokenService] Token stored successfully, expires at ${new Date(expiryTime).toLocaleString()}`);
    } catch (error) {
      console.error('[TokenService] Error storing token:', error);
    }
  },
  
  // Check if token is expired
  isTokenExpired: (): boolean => {
    try {
      const expiry = TokenService.getTokenExpiry();
      if (!expiry) return true;
      
      const now = Date.now();
      return now >= expiry;
    } catch (error) {
      console.error('[TokenService] Error checking token expiration:', error);
      return true; // Assume expired on error
    }
  },
  
  // Clear all token data
  clearTokens: (): void => {
    try {
      [localStorage, sessionStorage].forEach(storage => {
        storage.removeItem(TOKEN_KEY);
        storage.removeItem(REFRESH_TOKEN_KEY);
        storage.removeItem(TOKEN_EXPIRY_KEY);
      });
      console.log('[TokenService] All tokens cleared');
    } catch (error) {
      console.error('[TokenService] Error clearing tokens:', error);
    }
  },
  
  // Get stored user data
  getUserData: () => {
    try {
      const data = getStorageType().getItem(USER_DATA_KEY);
      if (!data) return null;
      
      return JSON.parse(data);
    } catch (error) {
      console.error('[TokenService] Error retrieving user data:', error);
      return null;
    }
  },
  
  // Store user data
  storeUserData: (userData: any): void => {
    try {
      if (!userData) {
        console.error('[TokenService] Attempted to store empty user data');
        return;
      }
      
      // Ensure we don't have circular references
      const userToStore = { ...userData };
      
      // Add timestamps for debugging
      const now = Date.now();
      userToStore._timestamp = userToStore._timestamp || now;
      userToStore._lastUpdated = now;
      
      getStorageType().setItem(USER_DATA_KEY, JSON.stringify(userToStore));
      console.log('[TokenService] User data stored successfully');
    } catch (error) {
      console.error('[TokenService] Error storing user data:', error);
    }
  },
  
  // Clear user data
  clearUserData: (): void => {
    try {
      [localStorage, sessionStorage].forEach(storage => {
        storage.removeItem(USER_DATA_KEY);
      });
      console.log('[TokenService] User data cleared');
    } catch (error) {
      console.error('[TokenService] Error clearing user data:', error);
    }
  },
  
  // Clear all auth data (tokens and user data)
  clearAllAuthData: (): void => {
    TokenService.clearTokens();
    TokenService.clearUserData();
  }
};

export default TokenService; 