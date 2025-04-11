import axios from 'axios';
import { getAuthToken } from './tokenService';

// Base URL for API requests
const BASE_URL = process.env.REACT_APP_API_URL || 'https://charterhub-api.onrender.com';

/**
 * Special API instance for authentication requests that won't be canceled during navigation
 * Uses fetch with keepalive instead of axios for critical auth operations
 */
class AuthApiService {
  private baseUrl: string;

  constructor(baseUrl = BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Make a request that will survive page navigation
   * This is critical for maintaining auth state during refreshes
   */
  private async survivableRequest(
    endpoint: string,
    method: string = 'GET',
    data?: any,
    options: RequestInit = {}
  ): Promise<any> {
    try {
      // Build the full URL
      const url = `${this.baseUrl}${endpoint}`;
      
      // Get the auth token if available
      const token = getAuthToken();
      
      // Build headers
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };
      
      // Options for fetch with keepalive to survive navigation
      const fetchOptions: RequestInit = {
        method,
        headers,
        credentials: 'include',
        keepalive: true, // Critical flag that makes the request survive navigation
        mode: 'cors',
        ...options,
        ...(data ? { body: JSON.stringify(data) } : {})
      };
      
      console.log(`[AuthAPI] Making survivable ${method} request to ${url}`);
      
      // Make the request with keepalive
      const response = await fetch(url, fetchOptions);
      
      // Parse the response
      const contentType = response.headers.get('content-type');
      let responseData;
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }
      
      // Return a standardized response format
      return {
        data: responseData,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries([...response.headers.entries()]),
        ok: response.ok
      };
    } catch (error) {
      console.error('[AuthAPI] Survivable request failed:', error);
      
      // Fallback to axios as a last resort
      console.log('[AuthAPI] Falling back to axios for auth request');
      try {
        const axiosResponse = await axios({
          method,
          url: `${this.baseUrl}${endpoint}`,
          data,
          headers: {
            ...(getAuthToken() ? { 'Authorization': `Bearer ${getAuthToken()}` } : {})
          },
          withCredentials: true
        });
        
        return {
          data: axiosResponse.data,
          status: axiosResponse.status,
          statusText: axiosResponse.statusText,
          headers: axiosResponse.headers,
          ok: axiosResponse.status >= 200 && axiosResponse.status < 300
        };
      } catch (axiosError) {
        console.error('[AuthAPI] Axios fallback also failed:', axiosError);
        throw axiosError;
      }
    }
  }

  /**
   * Get the current authenticated user
   * Uses survivable request to ensure completion even during navigation
   */
  async getCurrentUser(): Promise<any> {
    console.log('[AuthAPI] Getting current user with survivable request');
    const response = await this.survivableRequest('/auth/me.php');
    
    if (response.ok && response.data && response.data.success) {
      console.log('[AuthAPI] Successfully retrieved user data:', response.data.user);
      return response.data.user;
    }
    
    console.warn('[AuthAPI] Failed to get current user:', response);
    throw new Error('Failed to get current user');
  }

  /**
   * Login with the provided credentials
   * Uses survivable request to ensure completion even during navigation
   */
  async login(email: string, password: string, rememberMe: boolean = false): Promise<any> {
    const response = await this.survivableRequest(
      '/auth/login.php',
      'POST',
      { email, password, rememberMe }
    );
    
    if (response.ok && response.data && response.data.success) {
      return response.data;
    }
    
    throw new Error(response.data?.message || 'Login failed');
  }

  /**
   * Refresh the authentication token
   */
  async refreshToken(): Promise<any> {
    const response = await this.survivableRequest('/auth/refresh-token.php', 'POST');
    
    if (response.ok && response.data && response.data.success) {
      return response.data;
    }
    
    throw new Error('Token refresh failed');
  }

  /**
   * Logout the current user
   */
  async logout(): Promise<any> {
    const response = await this.survivableRequest('/auth/logout.php', 'POST');
    
    if (response.ok) {
      return response.data;
    }
    
    throw new Error('Logout failed');
  }
}

// Export a singleton instance
export const authApi = new AuthApiService();
export default authApi; 