import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { JWTAuthProvider } from '../../frontend/src/contexts/auth/JWTAuthContext';
import App from '../App';

// Mock TokenStorage
jest.mock('../../frontend/src/services/jwtApi', () => {
  const originalModule = jest.requireActual('../../frontend/src/services/jwtApi');
  let mockToken = null;
  let mockTokenExpiry = null;
  let mockUserData = null;

  return {
    ...originalModule,
    TokenStorage: {
      getToken: jest.fn(() => mockToken),
      getTokenExpiry: jest.fn(() => mockTokenExpiry),
      getUserData: jest.fn(() => mockUserData),
      setToken: jest.fn((token) => { mockToken = token; }),
      setTokenExpiry: jest.fn((expiry) => { mockTokenExpiry = expiry; }),
      setUserData: jest.fn((data) => { mockUserData = data; }),
      clearToken: jest.fn(() => { mockToken = null; mockTokenExpiry = null; }),
      clearUserData: jest.fn(() => { mockUserData = null; }),
    },
    login: jest.fn(() => Promise.resolve({
      id: '123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'client',
    })),
    logout: jest.fn(() => Promise.resolve()),
    refreshUserData: jest.fn(() => Promise.resolve({
      id: '123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'client',
    })),
    updateProfile: jest.fn((data) => Promise.resolve({
      ...data,
      id: '123',
      role: 'client',
    })),
  };
});

/**
 * JWT Authentication Context Tests
 */
describe('JWT Authentication System', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Unit Tests
  describe('Unit Tests', () => {
    test('UT-01: JWTAuthContext initialization', async () => {
      const { TokenStorage } = require('../../frontend/src/services/jwtApi');
      
      // Mock initial state with no token
      TokenStorage.getToken.mockReturnValue(null);
      TokenStorage.getUserData.mockReturnValue(null);
      
      let contextValues;
      const TestComponent = () => {
        const jwtAuth = require('../../frontend/src/contexts/auth/JWTAuthContext').useJWTAuth();
        contextValues = jwtAuth;
        return <div>Test Component</div>;
      };
      
      render(
        <BrowserRouter>
          <JWTAuthProvider>
            <TestComponent />
          </JWTAuthProvider>
        </BrowserRouter>
      );
      
      await waitFor(() => {
        expect(contextValues.isInitialized).toBe(true);
        expect(contextValues.isAuthenticated).toBe(false);
        expect(contextValues.user).toBe(null);
      });
    });

    test('UT-02: Login method updates authentication state', async () => {
      const { login } = require('../../frontend/src/services/jwtApi');
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'client',
      };
      
      login.mockResolvedValue(mockUser);
      
      let loginFunction;
      let authState = {};
      
      const TestComponent = () => {
        const jwtAuth = require('../../frontend/src/contexts/auth/JWTAuthContext').useJWTAuth();
        loginFunction = jwtAuth.login;
        authState = {
          isAuthenticated: jwtAuth.isAuthenticated,
          user: jwtAuth.user
        };
        return <div>Login Test</div>;
      };
      
      render(
        <BrowserRouter>
          <JWTAuthProvider>
            <TestComponent />
          </JWTAuthProvider>
        </BrowserRouter>
      );
      
      expect(authState.isAuthenticated).toBe(false);
      expect(authState.user).toBe(null);
      
      await act(async () => {
        await loginFunction('test@example.com', 'password123');
      });
      
      await waitFor(() => {
        expect(login).toHaveBeenCalledWith('test@example.com', 'password123', false);
        expect(authState.isAuthenticated).toBe(true);
        expect(authState.user).toEqual(mockUser);
      });
    });

    test('UT-03: Logout method clears authentication state', async () => {
      const { TokenStorage } = require('../../frontend/src/services/jwtApi');
      
      // Mock authenticated state
      TokenStorage.getToken.mockReturnValue('valid-token');
      TokenStorage.getUserData.mockReturnValue({
        id: '123',
        email: 'test@example.com',
        role: 'client'
      });
      
      let logoutFunction;
      let authState = {};
      
      const TestComponent = () => {
        const jwtAuth = require('../../frontend/src/contexts/auth/JWTAuthContext').useJWTAuth();
        logoutFunction = jwtAuth.logout;
        authState = {
          isAuthenticated: jwtAuth.isAuthenticated,
          user: jwtAuth.user
        };
        return <div>Logout Test</div>;
      };
      
      render(
        <BrowserRouter>
          <JWTAuthProvider>
            <TestComponent />
          </JWTAuthProvider>
        </BrowserRouter>
      );
      
      await waitFor(() => {
        expect(authState.isAuthenticated).toBe(true);
        expect(authState.user).not.toBe(null);
      });
      
      await act(async () => {
        await logoutFunction();
      });
      
      await waitFor(() => {
        expect(authState.isAuthenticated).toBe(false);
        expect(authState.user).toBe(null);
        expect(TokenStorage.clearToken).toHaveBeenCalled();
        expect(TokenStorage.clearUserData).toHaveBeenCalled();
      });
    });
  });

  // Integration Tests
  describe('Integration Tests', () => {
    test('IT-01: JWTLogin + JWTAuthContext integration', async () => {
      const { login } = require('../../frontend/src/services/jwtApi');
      
      login.mockResolvedValue({
        id: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'client',
      });
      
      render(
        <BrowserRouter>
          <JWTAuthProvider>
            <App />
          </JWTAuthProvider>
        </BrowserRouter>
      );
      
      // Wait for login page to render
      await waitFor(() => {
        expect(screen.getByText(/Sign in/i)).toBeInTheDocument();
      });
      
      // Fill login form
      fireEvent.change(screen.getByLabelText(/Email/i), {
        target: { value: 'test@example.com' }
      });
      
      fireEvent.change(screen.getByLabelText(/Password/i), {
        target: { value: 'password123' }
      });
      
      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));
      
      // Verify login was called with correct parameters
      expect(login).toHaveBeenCalledWith('test@example.com', 'password123', false);
      
      // Verify redirect to dashboard after successful login
      await waitFor(() => {
        expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
      });
    });

    test('IT-03: App + ProtectedRoute integration', async () => {
      const { TokenStorage } = require('../../frontend/src/services/jwtApi');
      
      // Mock unauthenticated state
      TokenStorage.getToken.mockReturnValue(null);
      TokenStorage.getUserData.mockReturnValue(null);
      
      render(
        <BrowserRouter>
          <JWTAuthProvider>
            <App />
          </JWTAuthProvider>
        </BrowserRouter>
      );
      
      // Try to access a protected route
      act(() => {
        window.history.pushState({}, 'Dashboard', '/dashboard');
      });
      
      // Verify redirect to login
      await waitFor(() => {
        expect(screen.getByText(/Sign in/i)).toBeInTheDocument();
      });
      
      // Now simulate authenticated state
      TokenStorage.getToken.mockReturnValue('valid-token');
      TokenStorage.getUserData.mockReturnValue({
        id: '123',
        email: 'test@example.com',
        role: 'client'
      });
      
      // Render again with authenticated state
      render(
        <BrowserRouter>
          <JWTAuthProvider>
            <App />
          </JWTAuthProvider>
        </BrowserRouter>
      );
      
      // Try to access protected route again
      act(() => {
        window.history.pushState({}, 'Dashboard', '/dashboard');
      });
      
      // Verify access to dashboard is granted
      await waitFor(() => {
        expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
      });
    });

    test('IT-07: AdminDashboard + ProtectedRoute integration', async () => {
      const { TokenStorage } = require('../../frontend/src/services/jwtApi');
      
      // Mock client user (non-admin)
      TokenStorage.getToken.mockReturnValue('valid-token');
      TokenStorage.getUserData.mockReturnValue({
        id: '123',
        email: 'client@example.com',
        role: 'client'
      });
      
      render(
        <BrowserRouter>
          <JWTAuthProvider>
            <App />
          </JWTAuthProvider>
        </BrowserRouter>
      );
      
      // Try to access admin route
      act(() => {
        window.history.pushState({}, 'Admin', '/admin');
      });
      
      // Verify redirect to dashboard
      await waitFor(() => {
        expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
      });
      
      // Now mock admin user
      TokenStorage.getUserData.mockReturnValue({
        id: '456',
        email: 'admin@example.com',
        role: 'admin'
      });
      
      // Render again with admin state
      render(
        <BrowserRouter>
          <JWTAuthProvider>
            <App />
          </JWTAuthProvider>
        </BrowserRouter>
      );
      
      // Try to access admin route again
      act(() => {
        window.history.pushState({}, 'Admin', '/admin');
      });
      
      // Verify access to admin dashboard is granted
      await waitFor(() => {
        expect(screen.getByText(/Admin Dashboard/i)).toBeInTheDocument();
      });
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    test('EC-01: Network error during login', async () => {
      const { login } = require('../../frontend/src/services/jwtApi');
      
      // Mock network error
      login.mockRejectedValue(new Error('Network error'));
      
      let loginFunction;
      let authError = null;
      
      const TestComponent = () => {
        const jwtAuth = require('../../frontend/src/contexts/auth/JWTAuthContext').useJWTAuth();
        loginFunction = jwtAuth.login;
        authError = jwtAuth.errors.login;
        return <div>Error Test</div>;
      };
      
      render(
        <BrowserRouter>
          <JWTAuthProvider>
            <TestComponent />
          </JWTAuthProvider>
        </BrowserRouter>
      );
      
      await act(async () => {
        try {
          await loginFunction('test@example.com', 'password123');
        } catch (error) {
          // Expected error
        }
      });
      
      await waitFor(() => {
        expect(authError).not.toBe(null);
        expect(authError.message).toBe('Network error');
      });
    });

    test('EC-03: Token expiration handling', async () => {
      const { TokenStorage, refreshUserData } = require('../../frontend/src/services/jwtApi');
      
      // Mock expired token scenario
      TokenStorage.getToken.mockReturnValue('expired-token');
      TokenStorage.getTokenExpiry.mockReturnValue(Date.now() - 1000); // Expired 1 second ago
      TokenStorage.getUserData.mockReturnValue({
        id: '123',
        email: 'test@example.com',
        role: 'client'
      });
      
      let refreshFunction;
      let authState = {};
      
      const TestComponent = () => {
        const jwtAuth = require('../../frontend/src/contexts/auth/JWTAuthContext').useJWTAuth();
        refreshFunction = jwtAuth.refreshUserData;
        authState = {
          isAuthenticated: jwtAuth.isAuthenticated,
          user: jwtAuth.user
        };
        return <div>Token Expiration Test</div>;
      };
      
      render(
        <BrowserRouter>
          <JWTAuthProvider>
            <TestComponent />
          </JWTAuthProvider>
        </BrowserRouter>
      );
      
      // Mock successful token refresh
      refreshUserData.mockResolvedValue({
        id: '123',
        email: 'test@example.com',
        role: 'client'
      });
      
      await act(async () => {
        await refreshFunction();
      });
      
      await waitFor(() => {
        expect(refreshUserData).toHaveBeenCalled();
        expect(authState.isAuthenticated).toBe(true);
      });
      
      // Now test failed refresh
      refreshUserData.mockRejectedValue(new Error('Token refresh failed'));
      
      await act(async () => {
        try {
          await refreshFunction();
        } catch (error) {
          // Expected error
        }
      });
      
      await waitFor(() => {
        expect(authState.isAuthenticated).toBe(false);
      });
    });
  });
}); 