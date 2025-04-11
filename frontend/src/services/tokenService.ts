// Token service - centralizes token handling across the application
// This solves the issue where different services access tokens in different ways

// Storage keys
export const TOKEN_KEY = 'auth_token'
export const REFRESH_TOKEN_KEY = 'refresh_token'
export const TOKEN_EXPIRY_KEY = 'token_expiry'
export const USER_DATA_KEY = 'user_data'
export const REMEMBER_ME_KEY = 'remember_me'
export const RATE_LIMIT_KEY = 'api_rate_limit'
export const CSRF_TOKEN_KEY = 'csrf_token'
export const LAST_LOGIN_KEY = 'last_successful_login'
export const AUTH_REFRESH_WINDOW = 60 * 60 * 1000 // 1 hour in milliseconds

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
  
  // Get user data with improved parsing and debugging
  getUserData: (): any => {
    try {
      // First, try direct session storage access as this is typically where the most current data is
      let directSessionData = sessionStorage.getItem(USER_DATA_KEY);
      
      // Try to parse it first and return immediately if valid
      try {
        if (directSessionData) {
          const parsedData = JSON.parse(directSessionData);
          if (parsedData && parsedData.id) {
            console.log(`[TokenService] Successfully retrieved user data directly from sessionStorage: ID ${parsedData.id}`);
            return parsedData;
          }
        }
      } catch (parseError) {
        console.warn(`[TokenService] Failed to parse session storage data, continuing with fallbacks`);
      }
      
      // Now try direct access to the separate auth_user fields which might exist even if the full user object doesn't
      const userId = sessionStorage.getItem('auth_user_id');
      const userRole = sessionStorage.getItem('auth_user_role');
      
      if (userId && userRole) {
        console.log(`[TokenService] Found user ID and role in sessionStorage: ${userId}/${userRole}`);
        
        // Create a minimal user object to prevent authentication failure
        return {
          id: parseInt(userId, 10),
          role: userRole,
          _restored: true,
          _timestamp: Date.now()
        };
      }
      
      // Continue with normal storage resolution if direct access fails
      const storage = getStorageType();
      let userData = storage.getItem(USER_DATA_KEY);
      
      // Log the raw storage data to debug parsing issues
      console.log(`[TokenService] Raw user data from ${storage === localStorage ? 'localStorage' : 'sessionStorage'}: ${userData ? 'Found' : 'Not found'}`);
      
      // If not found in preferred storage, check fallback
      if (!userData) {
        const fallbackStorage = storage === localStorage ? sessionStorage : localStorage;
        userData = fallbackStorage.getItem(USER_DATA_KEY);
        
        console.log(`[TokenService] Raw user data from fallback ${fallbackStorage === localStorage ? 'localStorage' : 'sessionStorage'}: ${userData ? 'Found' : 'Not found'}`);
        
        // If found in fallback, migrate to preferred
        if (userData) {
          console.log('[TokenService] Found user data in fallback storage, migrating to preferred');
          storage.setItem(USER_DATA_KEY, userData);
        }
      }
      
      if (!userData) {
        console.warn('[TokenService] No user data found in any storage location');
        
        // As a last resort, try each individual auth field
        const userId = storage.getItem('auth_user_id') || sessionStorage.getItem('auth_user_id') || localStorage.getItem('auth_user_id');
        const userRole = storage.getItem('auth_user_role') || sessionStorage.getItem('auth_user_role') || localStorage.getItem('auth_user_role');
        
        if (userId && userRole) {
          console.log('[TokenService] Reconstructing user data from individual fields');
          return {
            id: parseInt(userId, 10),
            role: userRole,
            _restored: true,
            _timestamp: Date.now()
          };
        }
        
        return null;
      }
      
      try {
        // Try to parse the user data
        const parsedData = JSON.parse(userData);
        
        // If the parsed data doesn't have an ID, it might be invalid
        if (!parsedData || !parsedData.id) {
          console.error('[TokenService] User data is invalid (missing ID):', parsedData);
          return null;
        }
        
        console.log(`[TokenService] Successfully parsed user data for ID ${parsedData.id}`);
        return parsedData;
      } catch (parseError) {
        console.error('[TokenService] Failed to parse user data:', parseError);
        // Clean up invalid data
        storage.removeItem(USER_DATA_KEY);
        
        // If parsing fails, the data might be already parsed and stringified differently
        // Try returning the raw data as a last resort
        if (typeof userData === 'string' && userData.includes('"id":')) {
          try {
            // Try one more time with manual parsing to handle potential edge cases
            const fixedData = userData.replace(/\\"/g, '"').replace(/^"|"$/g, '');
            return JSON.parse(fixedData);
          } catch (e) {
            return null;
          }
        }
        
        return null;
      }
    } catch (error) {
      console.error('[TokenService] Error retrieving user data:', error);
      return null;
    }
  },
  
  // Store user data with error handling
  storeUserData: (userData: any) => {
    try {
      if (!userData) {
        console.warn('[TokenService] Attempted to store null user data');
        return false;
      }
      
      // Add timestamp if missing
      if (!userData._timestamp) {
        userData._timestamp = Date.now();
      }
      
      // Add last updated timestamp
      userData._lastUpdated = Date.now();
      
      // Store in appropriate storage type
      const storage = getStorageType();
      storage.setItem(USER_DATA_KEY, JSON.stringify(userData));
      
      // Also store the user ID and role separately for easier access and recovery
      if (userData.id) {
        storage.setItem('auth_user_id', userData.id.toString());
      }
      
      if (userData.role) {
        storage.setItem('auth_user_role', userData.role.toString());
      }
      
      // Synchronize between storage types to prevent data loss during refresh
      TokenService.syncStorageData();
      
      return true;
    } catch (error) {
      console.error('[TokenService] Error storing user data:', error);
      return false;
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
  },
  
  // Synchronize critical auth data between storage types
  syncStorageData: () => {
    try {
      // This function ensures critical auth data exists in both storage types
      // to prevent data loss during page refresh
      
      // Essential auth keys that should exist in both storage types
      const criticalKeys = [
        TOKEN_KEY,
        'auth_user_id',
        'auth_user_role',
        CSRF_TOKEN_KEY,
        TOKEN_EXPIRY_KEY
      ];
      
      console.log('[TokenService] Synchronizing critical auth data between storage types');
      
      // For each critical key, ensure it exists in both storage types
      criticalKeys.forEach(key => {
        const sessionValue = sessionStorage.getItem(key);
        const localValue = localStorage.getItem(key);
        
        // If session has value but local doesn't, copy to session
        if (sessionValue && !localValue) {
          console.log(`[TokenService] Copying ${key} from session to local storage`);
          localStorage.setItem(key, sessionValue);
        }
        
        // If local has value but session doesn't, copy to local
        if (localValue && !sessionValue) {
          console.log(`[TokenService] Copying ${key} from local to session storage`);
          sessionStorage.setItem(key, localValue);
        }
      });
      
      // Special handling for complete user data (USER_DATA_KEY)
      // We want to ensure we use the most complete user data during sync
      const sessionUserData = sessionStorage.getItem(USER_DATA_KEY);
      const localUserData = localStorage.getItem(USER_DATA_KEY);
      
      // Helper function to get user data completeness score
      const getUserDataScore = (dataString: string | null): number => {
        if (!dataString) return 0;
        try {
          const data = JSON.parse(dataString);
          // Calculate a score based on presence of key fields
          let score = 0;
          if (data.id) score += 5;
          if (data.email) score += 3;
          if (data.firstName) score += 2;
          if (data.lastName) score += 2;
          if (data.role) score += 5;
          if (data._timestamp) score += 1;
          // Newer data is better
          if (data._timestamp && typeof data._timestamp === 'number') {
            // Add 0.001 points per second newer (small enough not to override field presence)
            const ageInSeconds = (Date.now() - data._timestamp) / 1000;
            if (ageInSeconds > 0 && ageInSeconds < 86400) { // Only if within last day
              score += (10 - Math.min(10, ageInSeconds / 8640)); // Max 10 bonus points for very fresh data
            }
          }
          return score;
        } catch (e) {
          return 0;
        }
      };
      
      const sessionScore = getUserDataScore(sessionUserData);
      const localScore = getUserDataScore(localUserData);
      
      if (sessionScore > 0 || localScore > 0) {
        // Choose the better data source
        if (sessionScore >= localScore && sessionUserData) {
          // Session data is better or equal, use it
          if (!localUserData || localScore < sessionScore) {
            console.log(`[TokenService] Copying user data from session to local (score: ${sessionScore} vs ${localScore})`);
            localStorage.setItem(USER_DATA_KEY, sessionUserData);
          }
        } else if (localScore > sessionScore && localUserData) {
          // Local data is better, use it
          console.log(`[TokenService] Copying user data from local to session (score: ${localScore} vs ${sessionScore})`);
          sessionStorage.setItem(USER_DATA_KEY, localUserData);
        }
        
        // If we have parse-able data in either storage, ensure it has all required fields
        try {
          // Use the data source with the highest score
          const bestDataString = sessionScore >= localScore ? sessionUserData : localUserData;
          if (bestDataString) {
            const userData = JSON.parse(bestDataString);
            
            // If we have user ID from other sources but not in the user data, add it
            if (!userData.id) {
              const userId = sessionStorage.getItem('auth_user_id') || localStorage.getItem('auth_user_id');
              if (userId) {
                userData.id = parseInt(userId, 10);
                console.log(`[TokenService] Added missing user ID ${userId} to user data`);
              }
            }
            
            // If we have user role from other sources but not in the user data, add it
            if (!userData.role) {
              const userRole = sessionStorage.getItem('auth_user_role') || localStorage.getItem('auth_user_role');
              if (userRole) {
                userData.role = userRole;
                console.log(`[TokenService] Added missing user role ${userRole} to user data`);
              }
            }
            
            // Add timestamps if missing
            if (!userData._timestamp) {
              userData._timestamp = Date.now();
            }
            
            // If we made changes, update both storage locations
            const updatedDataString = JSON.stringify(userData);
            sessionStorage.setItem(USER_DATA_KEY, updatedDataString);
            localStorage.setItem(USER_DATA_KEY, updatedDataString);
          }
        } catch (e) {
          console.warn('[TokenService] Error enhancing user data during sync:', e);
        }
      } else if (sessionStorage.getItem('auth_user_id') && sessionStorage.getItem('auth_user_role')) {
        // If we have no user data at all but have ID and role, create minimal user data
        try {
          const userId = sessionStorage.getItem('auth_user_id');
          const userRole = sessionStorage.getItem('auth_user_role');
          
          if (userId && userRole) {
            console.log(`[TokenService] Creating minimal user data from ID ${userId} and role ${userRole}`);
            
            const minimalUserData = {
              id: parseInt(userId, 10),
              role: userRole,
              firstName: 'User',
              lastName: userId,
              email: '',
              _timestamp: Date.now(),
              _restored: true
            };
            
            const userDataString = JSON.stringify(minimalUserData);
            sessionStorage.setItem(USER_DATA_KEY, userDataString);
            localStorage.setItem(USER_DATA_KEY, userDataString);
          }
        } catch (e) {
          console.warn('[TokenService] Error creating minimal user data:', e);
        }
      }
      
      return true;
    } catch (error) {
      console.error('[TokenService] Error during storage synchronization:', error);
      return false;
    }
  },
  
  // Record successful login timestamp for refresh protection
  setLastSuccessfulLogin: () => {
    try {
      const timestamp = Date.now();
      localStorage.setItem(LAST_LOGIN_KEY, timestamp.toString());
      sessionStorage.setItem(LAST_LOGIN_KEY, timestamp.toString());
      console.log(`[TokenService] Recorded successful login timestamp: ${new Date(timestamp).toISOString()}`);
      return timestamp;
    } catch (error) {
      console.error('[TokenService] Error setting last login timestamp:', error);
      return 0;
    }
  },
  
  // Get last successful login timestamp
  getLastSuccessfulLogin: () => {
    try {
      // Check both storage types for maximum resilience
      const sessionTimestamp = sessionStorage.getItem(LAST_LOGIN_KEY);
      const localTimestamp = localStorage.getItem(LAST_LOGIN_KEY);
      
      // Use the more recent timestamp if both exist
      if (sessionTimestamp && localTimestamp) {
        const sessionTime = parseInt(sessionTimestamp, 10);
        const localTime = parseInt(localTimestamp, 10);
        return Math.max(sessionTime, localTime);
      }
      
      // Otherwise use whichever exists
      const timestamp = parseInt(sessionTimestamp || localTimestamp || '0', 10);
      
      if (timestamp > 0) {
        console.log(`[TokenService] Found last login timestamp: ${new Date(timestamp).toISOString()}`);
      }
      
      return timestamp;
    } catch (error) {
      console.error('[TokenService] Error getting last login timestamp:', error);
      return 0;
    }
  },
  
  // Check if we're within the auth refresh window (1 hour by default)
  isWithinAuthRefreshWindow: () => {
    const lastLogin = TokenService.getLastSuccessfulLogin();
    if (!lastLogin) return false;
    
    const now = Date.now();
    const elapsed = now - lastLogin;
    const isWithin = elapsed < AUTH_REFRESH_WINDOW;
    
    console.log(`[TokenService] Auth refresh window check: ${isWithin ? 'WITHIN' : 'OUTSIDE'} window (${Math.round(elapsed / 1000 / 60)} minutes elapsed)`);
    
    return isWithin;
  }
};

export default TokenService; 