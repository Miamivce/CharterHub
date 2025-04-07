/**
 * Authentication Helper Functions
 * 
 * This file contains utility functions for JWT authentication in the frontend.
 * These helpers only apply to client authentication, not WordPress admin auth.
 */

import { debugLog } from './logger';
import jwtApi from '@/services/jwtApi';

// Constants
const TOKEN_STORAGE_KEY = 'charterhub_auth_token';
const REFRESH_TOKEN_STORAGE_KEY = 'charterhub_refresh_token';
const USER_STORAGE_KEY = 'charterhub_user';
const TOKEN_EXPIRY_KEY = 'charterhub_token_expiry';

/**
 * Store authentication data in browser storage
 * 
 * @param {Object} authData The authentication data containing token, refreshToken, and user
 * @param {boolean} rememberMe Whether to store in localStorage or sessionStorage
 */
export const storeAuthData = (authData, rememberMe = false) => {
  const storage = rememberMe ? localStorage : sessionStorage;
  
  if (authData.token) {
    storage.setItem(TOKEN_STORAGE_KEY, authData.token);
    
    // Store token expiry time if available in the payload
    try {
      const payload = parseJwt(authData.token);
      if (payload && payload.exp) {
        storage.setItem(TOKEN_EXPIRY_KEY, payload.exp);
      }
    } catch (error) {
      console.error('Failed to parse token expiry:', error);
    }
  }
  
  if (authData.refreshToken) {
    storage.setItem(REFRESH_TOKEN_STORAGE_KEY, authData.refreshToken);
  }
  
  if (authData.user) {
    storage.setItem(USER_STORAGE_KEY, JSON.stringify(authData.user));
  }
};

/**
 * Retrieve authentication data from browser storage
 * 
 * @returns {Object} Authentication data including token, refreshToken, and user
 */
export const getAuthData = () => {
  // Check localStorage first, then sessionStorage
  const token = localStorage.getItem(TOKEN_STORAGE_KEY) || sessionStorage.getItem(TOKEN_STORAGE_KEY);
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY) || sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  const userStr = localStorage.getItem(USER_STORAGE_KEY) || sessionStorage.getItem(USER_STORAGE_KEY);
  const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY) || sessionStorage.getItem(TOKEN_EXPIRY_KEY);
  
  return {
    token,
    refreshToken,
    user: userStr ? JSON.parse(userStr) : null,
    expiry: expiryStr ? parseInt(expiryStr, 10) : null
  };
};

/**
 * Clear all authentication data from browser storage
 */
export const clearAuthData = () => {
  // Clear from both localStorage and sessionStorage to be safe
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(USER_STORAGE_KEY);
  sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
};

/**
 * Format a JWT token for use in Authorization header
 * Ensures the token has the "Bearer " prefix and is properly formatted
 * 
 * @param {string} token The JWT token to format
 * @returns {string} Properly formatted token for Authorization header
 */
export const formatToken = (token) => {
  if (!token) return '';
  return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
};

/**
 * Check if user is authenticated
 * 
 * @returns {boolean} True if authenticated, false otherwise
 */
export const isAuthenticated = async () => {
  try {
    const user = await jwtApi.getCurrentUser();
    return !!user; // Convert to boolean
  } catch (error) {
    debugLog('Error checking authentication status', 'auth', 'error');
    return false;
  }
};

/**
 * Check if token needs to be refreshed (expiring soon)
 * 
 * @param {number} thresholdSeconds Time threshold in seconds
 * @returns {boolean} True if token should be refreshed
 */
export const shouldRefreshToken = (thresholdSeconds = 300) => {
  const { expiry } = getAuthData();
  
  if (!expiry) {
    return false;
  }
  
  const currentTime = Math.floor(Date.now() / 1000);
  return expiry - currentTime < thresholdSeconds;
};

/**
 * Parse JWT token to get payload
 * 
 * @param {string} token The JWT token
 * @returns {Object} The decoded payload
 */
export const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing JWT:', error);
    return null;
  }
};

/**
 * Get the current user's role from stored auth data
 * 
 * @returns {string|null} The user's role or null if not authenticated
 */
export const getUserRole = () => {
  const { user } = getAuthData();
  return user ? user.role : null;
};

/**
 * Check if user has one of the specified roles
 * 
 * @param {string|string[]} roles Role or array of roles to check
 * @returns {boolean} True if user has one of the roles, false otherwise
 */
export const hasRole = async (roles) => {
  try {
    const user = await jwtApi.getCurrentUser();
    if (!user) return false;
    
    // Convert single role to array for uniform processing
    const roleArray = Array.isArray(roles) ? roles : [roles];
    
    // Check if user's role is in the allowed roles array
    return roleArray.includes(user.role);
  } catch (error) {
    debugLog(`Error checking roles: ${error.message}`, 'auth', 'error');
    return false;
  }
};

/**
 * Check if the current user is a client
 * 
 * @returns {boolean} True if user is a client
 */
export const isClient = () => {
  return hasRole('charter_client');
};

/**
 * Check if user is an admin
 * 
 * @returns {boolean} True if user is admin, false otherwise
 */
export const isAdmin = async () => {
  return await hasRole(['administrator', 'admin']);
};

/**
 * Check if the user has any valid authentication (admin or client)
 * 
 * @returns {boolean} True if authenticated with either client or admin auth
 */
export const hasAnyAuthentication = async () => {
  try {
    // Use the unified JWT auth system to check authentication
    const user = await jwtApi.getCurrentUser();
    const isAuthenticatedUser = !!user;
    
    console.log(`Authentication status check - JWT User: ${isAuthenticatedUser ? 'authenticated' : 'not authenticated'}`);
    
    return isAuthenticatedUser;
  } catch (error) {
    debugLog(`Error checking authentication: ${error.message}`, 'auth', 'error');
    return false;
  }
};

export default {
  storeAuthData,
  getAuthData,
  clearAuthData,
  isAuthenticated,
  shouldRefreshToken,
  parseJwt,
  getUserRole,
  hasRole,
  isClient,
  isAdmin,
  formatToken,
  hasAnyAuthentication
}; 