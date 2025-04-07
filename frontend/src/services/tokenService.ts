// Token service - centralizes token handling across the application
// This solves the issue where different services access tokens in different ways

// Import constants from jwtApi.ts
export const TOKEN_KEY = 'auth_token';
export const TOKEN_EXPIRY_KEY = 'token_expiry';
export const REMEMBER_ME_KEY = 'remember_me';
export const USER_DATA_KEY = 'user_data';

// Helper to determine which storage to use based on remember me preference
const getStorageType = (): Storage => {
  const useLocalStorage = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
  return useLocalStorage ? localStorage : sessionStorage;
};

// Centralized token management for consistent access across services
export const TokenService = {
  getToken: (): string | null => {
    return getStorageType().getItem(TOKEN_KEY);
  },

  getTokenExpiry: (): number | null => {
    const expiry = getStorageType().getItem(TOKEN_EXPIRY_KEY);
    if (!expiry) return null;

    try {
      return parseInt(expiry, 10);
    } catch (e) {
      console.error('[TokenService] Error parsing token expiry:', e);
      return null;
    }
  },

  isTokenExpired: (): boolean => {
    const expiry = TokenService.getTokenExpiry();
    if (!expiry) return true;
    return Date.now() > expiry;
  },

  hasValidToken: (): boolean => {
    const token = TokenService.getToken();
    return !!token && !TokenService.isTokenExpired();
  }
};

export default TokenService; 