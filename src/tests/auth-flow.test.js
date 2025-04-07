import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { JWTAuthProvider } from '../../frontend/src/contexts/auth/JWTAuthContext';
import App from '../App';

// Mock the TokenStorage
jest.mock('../../frontend/src/services/jwtApi', () => {
  const originalModule = jest.requireActual('../../frontend/src/services/jwtApi');
  
  return {
    ...originalModule,
    TokenStorage: {
      getToken: jest.fn(() => null),
      getTokenExpiry: jest.fn(() => null),
      getUserData: jest.fn(() => null),
      setToken: jest.fn(),
      setTokenExpiry: jest.fn(),
      setUserData: jest.fn(),
      clearToken: jest.fn(),
      clearUserData: jest.fn(),
    },
  };
});

// Mock the JWTApi service
jest.mock('../../frontend/src/services/jwtApi', () => {
  return {
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
  };
});

describe('Authentication Flow', () => {
  test('Login redirects to dashboard on success', async () => {
    render(
      <BrowserRouter>
        <JWTAuthProvider>
          <App />
        </JWTAuthProvider>
      </BrowserRouter>
    );
    
    // Wait for the login page to load
    await waitFor(() => {
      expect(screen.getByText(/Sign in/i)).toBeInTheDocument();
    });
    
    // Fill in the login form
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'test@example.com' },
    });
    
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'password123' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));
    
    // Wait for redirect to dashboard
    await waitFor(() => {
      expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    });
  });
  
  test('Protected routes redirect to login when not authenticated', async () => {
    // Mock the useJWTAuth hook to return not authenticated
    jest.mock('../../frontend/src/contexts/auth/JWTAuthContext', () => {
      return {
        useJWTAuth: () => ({
          isAuthenticated: false,
          isInitialized: true,
          user: null,
        }),
      };
    });
    
    render(
      <BrowserRouter>
        <JWTAuthProvider>
          <App />
        </JWTAuthProvider>
      </BrowserRouter>
    );
    
    // Try to access a protected route
    window.history.pushState({}, 'Dashboard', '/dashboard');
    
    // Wait for redirect to login
    await waitFor(() => {
      expect(screen.getByText(/Sign in/i)).toBeInTheDocument();
    });
  });
  
  test('Admin routes are only accessible to admin users', async () => {
    // Mock the useJWTAuth hook to return client role
    jest.mock('../../frontend/src/contexts/auth/JWTAuthContext', () => {
      return {
        useJWTAuth: () => ({
          isAuthenticated: true,
          isInitialized: true,
          user: {
            id: '123',
            email: 'client@example.com',
            firstName: 'Client',
            lastName: 'User',
            role: 'client',
          },
        }),
      };
    });
    
    render(
      <BrowserRouter>
        <JWTAuthProvider>
          <App />
        </JWTAuthProvider>
      </BrowserRouter>
    );
    
    // Try to access an admin route
    window.history.pushState({}, 'Admin', '/admin');
    
    // Wait for redirect to dashboard
    await waitFor(() => {
      expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    });
  });
}); 