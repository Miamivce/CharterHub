import React, { createContext, useContext, useState } from 'react';

// Define User interface
interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  verified: boolean;
  phoneNumber?: string;
  company?: string;
}

interface ApiStatus {
  connected: boolean;
  message: string;
}

// Create a mock context with basic auth functionality
const AuthContext = createContext({
  user: null as User | null,
  isAuthenticated: false,
  error: null as string | null,
  isLoading: false,
  apiStatus: { connected: true, message: 'Mock API connected' } as ApiStatus,
  login: async (email: string, password: string, rememberMe: boolean) => ({} as any),
  logout: async () => {},
  register: async (userData: any) => ({} as any),
  refreshTokenIfNeeded: async () => true,
  clearError: () => {},
  updateProfile: async (userData: Partial<User>) => {},
  forgotPassword: async (email: string) => {},
  resetPassword: async (data: any) => {},
  verifyEmail: async (token: string) => {},
  fetchAuthStatus: async () => ({ connected: true, message: 'Mock API connected' }),
  testConnection: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<ApiStatus>({ connected: true, message: 'Mock API connected' });

  // We're removing the auto-loading of user data to fix the tests
  // This way tests can explicitly control the user state

  const login = async (email: string, password: string, rememberMe: boolean) => {
    setIsLoading(true);
    setError(null);
    try {
      // Mock implementation for test - modify to match expected test email/password
      if (email === 'test@example.com') {
        const mockUser = {
          id: 1,
          email,
          firstName: 'Test',
          lastName: 'User',
          role: 'customer',
          verified: true,
          phoneNumber: '',
          company: ''
        };
        
        setUser(mockUser);
        
        // Store tokens
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('auth_token', 'test-token');
        storage.setItem('refresh_token', 'test-refresh');
        storage.setItem('token_expiry', (Date.now() + 3600000).toString());
        localStorage.setItem('remember_me', rememberMe.toString());
        storage.setItem('user_data', JSON.stringify(mockUser));
        
        return { user: mockUser };
      }
      
      setError('Invalid credentials');
      throw new Error('Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      // Clear user state
      setUser(null);
      
      // Clear storage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token_expiry');
      localStorage.removeItem('user_data');
      localStorage.removeItem('remember_me');
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('refresh_token');
      sessionStorage.removeItem('token_expiry');
      sessionStorage.removeItem('user_data');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any) => {
    setIsLoading(true);
    setError(null);
    try {
      // For testing error cases - throw error for specific email
      if (userData.email === 'existing@example.com') {
        setError('Email already exists');
        throw new Error('Email already exists');
      }
      
      // Mock implementation for test
      const mockUser = {
        id: 2,
        email: userData.email,
        firstName: userData.firstName || 'New',
        lastName: userData.lastName || 'User',
        role: 'customer',
        verified: false,
        phoneNumber: userData.phoneNumber || '',
        company: userData.company || ''
      };
      
      setUser(mockUser);
      
      // Store tokens
      const storage = userData.rememberMe ? localStorage : sessionStorage;
      storage.setItem('auth_token', 'new-token');
      storage.setItem('refresh_token', 'new-refresh');
      storage.setItem('token_expiry', (Date.now() + 3600000).toString());
      localStorage.setItem('remember_me', (userData.rememberMe || false).toString());
      localStorage.setItem('user_data', JSON.stringify(mockUser));
      
      return { user: mockUser };
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  const refreshTokenIfNeeded = async () => {
    // Mock implementation for test
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
    
    if (!token || !refreshToken) {
      return false;
    }
    
    // Directly set mock tokens
    localStorage.setItem('auth_token', 'new-refreshed-token');
    localStorage.setItem('refresh_token', 'new-refresh-token');
    localStorage.setItem('token_expiry', (Date.now() + 3600000).toString());
    
    return true;
  };
  
  // Additional mock methods to match the real AuthContext
  const updateProfile = async () => {
    // No return value needed
  };
  
  const forgotPassword = async () => {
    // No return value needed
  };
  
  const resetPassword = async () => {
    // No return value needed
  };
  
  const verifyEmail = async () => {
    // No return value needed
  };
  
  const fetchAuthStatus = async () => {
    return apiStatus;
  };
  
  const testConnection = async () => {
    // No return value needed
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        error,
        isLoading,
        apiStatus,
        login,
        logout,
        register,
        refreshTokenIfNeeded,
        clearError,
        updateProfile,
        forgotPassword,
        resetPassword,
        verifyEmail,
        fetchAuthStatus,
        testConnection,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 