# JWT Authentication Architecture

## Overview

The JWT authentication system implements a modern, secure authentication approach using JSON Web Tokens (JWT). This document outlines the architecture, components, and flow of the JWT authentication system implemented in the CharterHub application.

## Architecture Diagram

```
┌─────────────────┐      ┌────────────────┐      ┌─────────────────┐
│                 │      │                │      │                 │
│   React UI      │◄────►│  JWTAuthContext│◄────►│   JWT API       │
│  Components     │      │                │      │   Service       │
│                 │      │                │      │                 │
└─────────────────┘      └────────────────┘      └────────┬────────┘
                                                         │
                                                         │
                                                         ▼
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│                           API Server                               │
│                                                                    │
├────────────────┬───────────────────┬───────────────────────────────┤
│                │                   │                               │
│ Authentication │  Token Management │        User API               │
│    Endpoints   │     Services      │        Endpoints              │
│                │                   │                               │
└────────────────┴───────────────────┴───────────────────────────────┘
```

## Core Components

### 1. JWT Authentication Context

The `JWTAuthContext` serves as the central state management system for authentication. It provides:

- User authentication state (isAuthenticated, user)
- Initialization state (isInitialized)
- Loading states for various operations
- Error states for various operations
- Authentication methods (login, logout, etc.)

```tsx
// JWTAuthContext.tsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { jwtApi, TokenStorage } from '../services/jwtApi';

const JWTAuthContext = createContext<JWTAuthContextType | null>(null);

export const JWTAuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  
  // Initialize auth state from tokens
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = TokenStorage.getToken();
        const userData = TokenStorage.getUserData();

        if (token && userData) {
          dispatch({
            type: 'INITIALIZE',
            payload: {
              isAuthenticated: true,
              user: userData
            }
          });
        } else {
          dispatch({
            type: 'INITIALIZE',
            payload: {
              isAuthenticated: false,
              user: null
            }
          });
        }
      } catch (error) {
        dispatch({
          type: 'INITIALIZE',
          payload: {
            isAuthenticated: false,
            user: null
          }
        });
      }
    };

    initAuth();
  }, []);

  // Auth methods
  const login = async (email: string, password: string, rememberMe = false) => {
    dispatch({ type: 'LOGIN_REQUEST' });
    
    try {
      const userData = await jwtApi.login(email, password, rememberMe);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: userData }
      });
      return userData;
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: { error }
      });
      throw error;
    }
  };

  // Other auth methods (logout, register, etc.)
  // ...

  return (
    <JWTAuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        // Other methods
      }}
    >
      {children}
    </JWTAuthContext.Provider>
  );
};

export const useJWTAuth = () => {
  const context = useContext(JWTAuthContext);
  
  if (!context) {
    throw new Error('useJWTAuth must be used within a JWTAuthProvider');
  }
  
  return context;
};
```

### 2. JWT API Service

The JWT API service handles communication with the authentication API endpoints, including token storage and management.

```typescript
// jwtApi.ts
import axios from 'axios';

// TokenStorage for managing JWT tokens
export const TokenStorage = {
  getToken: () => localStorage.getItem('jwt_access_token'),
  setToken: (token: string) => localStorage.setItem('jwt_access_token', token),
  clearToken: () => localStorage.removeItem('jwt_access_token'),
  // ... other methods
};

// API client with interceptors
const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = TokenStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and not a retry, attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Call token refresh endpoint
        const { data } = await axios.post('/api/auth/refresh-token');
        TokenStorage.setToken(data.accessToken);
        
        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear tokens and reject
        TokenStorage.clearToken();
        TokenStorage.clearUserData();
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Authentication methods
export const jwtApi = {
  login: async (email: string, password: string, rememberMe = false) => {
    const { data } = await apiClient.post('/auth/login', {
      email,
      password,
      rememberMe
    });
    
    TokenStorage.setToken(data.accessToken);
    TokenStorage.setUserData(data.user);
    
    return data.user;
  },
  
  logout: async () => {
    await apiClient.post('/auth/logout');
    TokenStorage.clearToken();
    TokenStorage.clearUserData();
  },
  
  // Other auth methods
  // ...
};
```

### 3. Protected Route Component

The custom Protected Route component in `App.tsx` ensures that routes are only accessible to authenticated users with the required roles.

```tsx
const ProtectedRoute = ({ 
  children, 
  allowedRoles = ['client', 'admin'] 
}: { 
  children: React.ReactNode, 
  allowedRoles?: string[] 
}) => {
  const { isAuthenticated, isInitialized, user } = useJWTAuth();
  
  // Show loading state while initializing auth
  if (!isInitialized) {
    return <LoadingSpinner />;
  }

  // Not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role access if roles are specified and user exists
  if (allowedRoles.length > 0 && user) {
    const hasRequiredRole = allowedRoles.includes(user.role as string);
    
    if (!hasRequiredRole) {
      // Redirect based on user role
      const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
      return <Navigate to={redirectPath} replace />;
    }
  }

  // User is authenticated and has required role
  return <>{children}</>;
};
```

## Authentication Flow

### Login Flow

1. User submits login credentials
2. JWTAuthContext dispatches LOGIN_REQUEST action
3. JWT API service sends login request to server
4. Server validates credentials and returns tokens
5. JWT API service stores tokens and user data
6. JWTAuthContext dispatches LOGIN_SUCCESS action
7. User is redirected to protected route

```sequence
User->React UI: Enter credentials
React UI->JWTAuthContext: login(email, password)
JWTAuthContext->JWT API: login(email, password)
JWT API->Server: POST /auth/login
Server->Server: Validate credentials
Server->JWT API: Return tokens & user data
JWT API->TokenStorage: Store tokens & user data
JWT API->JWTAuthContext: Return user data
JWTAuthContext->React UI: Update auth state
React UI->User: Redirect to dashboard
```

### Token Refresh Flow

1. API request returns 401 Unauthorized
2. JWT API interceptor catches the error
3. Interceptor requests a new token using refresh token
4. Server validates refresh token and issues new access token
5. Interceptor updates stored access token
6. Original request is retried with new token

```sequence
React UI->JWT API: Make API request
JWT API->Server: API request with access token
Server->JWT API: 401 Unauthorized (token expired)
JWT API->Server: POST /auth/refresh-token
Server->Server: Validate refresh token
Server->JWT API: Return new access token
JWT API->TokenStorage: Update access token
JWT API->Server: Retry original request
Server->JWT API: Return successful response
JWT API->React UI: Return API response
```

### Logout Flow

1. User initiates logout
2. JWTAuthContext dispatches LOGOUT_REQUEST action
3. JWT API service sends logout request to server
4. Server invalidates refresh token
5. JWT API service clears tokens and user data
6. JWTAuthContext dispatches LOGOUT_SUCCESS action
7. User is redirected to login page

```sequence
User->React UI: Click logout
React UI->JWTAuthContext: logout()
JWTAuthContext->JWT API: logout()
JWT API->Server: POST /auth/logout
Server->Server: Invalidate refresh token
Server->JWT API: Logout successful
JWT API->TokenStorage: Clear tokens & user data
JWT API->JWTAuthContext: Return success
JWTAuthContext->React UI: Update auth state
React UI->User: Redirect to login
```

## Security Considerations

### 1. Token Storage

- **Access Tokens**: Stored in localStorage or sessionStorage (based on "Remember Me")
- **Refresh Tokens**: Stored as HTTP-only cookies for protection against XSS attacks
- **User Data**: Cached in localStorage for convenience, contains no sensitive information

### 2. Token Expiration

- Access tokens have a short lifespan (typically 15-30 minutes)
- Refresh tokens have a longer lifespan (typically 7-30 days)
- Token expiration is handled automatically by the JWT API service

### 3. CSRF Protection

- Refresh token requests require a CSRF token
- All state-changing API requests include CSRF protection

### 4. Token Revocation

- Logout invalidates the refresh token
- Password changes invalidate all tokens
- Suspicious activity can trigger token invalidation

## Error Handling

The JWT authentication system implements comprehensive error handling:

### 1. Authentication Errors

- Invalid credentials
- Account locked
- Email not verified

### 2. Token Errors

- Token expired
- Token invalid
- Token revoked

### 3. API Errors

- Network errors
- Server errors
- Validation errors

## Profile Update UI Synchronization

The profile update synchronization issue has been addressed with the following approach:

1. **Immediate Local State Update**: Update the UI immediately with the new data
2. **Server Update**: Send the update to the server
3. **Verification Pull**: After server confirmation, pull latest data to verify consistency
4. **State Refresh**: Update the context state with verified data

## Implementation Details

### 1. JWT Token Structure

```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "role": "client",
    "iat": 1623456789,
    "exp": 1623460389
  },
  "signature": "..."
}
```

### 2. API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/login` | POST | Authenticate user and return tokens |
| `/auth/logout` | POST | Invalidate refresh token |
| `/auth/refresh-token` | POST | Get new access token using refresh token |
| `/auth/register` | POST | Register a new user |
| `/auth/forgot-password` | POST | Send password reset email |
| `/auth/reset-password` | POST | Reset password using token |
| `/auth/verify-email` | GET | Verify email using token |
| `/auth/me` | GET | Get current user data |
| `/auth/update-profile` | PUT | Update user profile |
| `/auth/change-password` | POST | Change user password |

### 3. State Management

The authentication state is managed using a reducer pattern:

```tsx
const initialState = {
  isInitialized: false,
  isAuthenticated: false,
  user: null,
  loading: {
    login: false,
    logout: false,
    // Other loading states
  },
  errors: {
    login: null,
    logout: null,
    // Other error states
  }
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'INITIALIZE':
      return {
        ...state,
        isInitialized: true,
        isAuthenticated: action.payload.isAuthenticated,
        user: action.payload.user
      };
    case 'LOGIN_REQUEST':
      return {
        ...state,
        loading: {
          ...state.loading,
          login: true
        },
        errors: {
          ...state.errors,
          login: null
        }
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        loading: {
          ...state.loading,
          login: false
        }
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        loading: {
          ...state.loading,
          login: false
        },
        errors: {
          ...state.errors,
          login: action.payload.error
        }
      };
    // Other cases
    default:
      return state;
  }
};
```

## Integration with Components

### 1. Login Component

```tsx
const Login = () => {
  const { login, loading, errors } = useJWTAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (event) => {
    event.preventDefault();
    const email = event.target.email.value;
    const password = event.target.password.value;
    const rememberMe = event.target.rememberMe.checked;
    
    try {
      await login(email, password, rememberMe);
      navigate('/dashboard');
    } catch (error) {
      // Error is handled by context
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={loading.login}>
        {loading.login ? 'Logging in...' : 'Login'}
      </button>
      {errors.login && <p className="error">{errors.login.message}</p>}
    </form>
  );
};
```

### 2. Dashboard Component

```tsx
const Dashboard = () => {
  const { user, refreshUserData, loading } = useJWTAuth();
  
  useEffect(() => {
    refreshUserData();
  }, []);
  
  if (loading.refreshUserData) {
    return <LoadingSpinner />;
  }
  
  return (
    <div>
      <h1>Welcome, {user?.firstName}!</h1>
      {/* Dashboard content */}
    </div>
  );
};
```

### 3. Profile Component

```tsx
const Profile = () => {
  const { user, updateProfile, refreshUserData, loading, errors } = useJWTAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || ''
      });
    }
  }, [user]);
  
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    try {
      await updateProfile(formData);
      // Refresh user data to ensure UI is updated
      await refreshUserData();
    } catch (error) {
      // Error is handled by context
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={loading.updateProfile}>
        {loading.updateProfile ? 'Saving...' : 'Save Changes'}
      </button>
      {errors.updateProfile && <p className="error">{errors.updateProfile.message}</p>}
    </form>
  );
};
```

## Performance Optimizations

### 1. Token Caching

- Access tokens are cached to reduce network requests
- User data is cached to improve page load performance

### 2. Selective Updates

- Only changed fields are sent to the server during profile updates
- State updates are optimized to minimize re-renders

### 3. Lazy Loading

- Authentication components are lazy-loaded to improve initial load time
- Heavy components are only loaded when needed

## Migration Considerations

### 1. Compatibility with Legacy Systems

- The JWT authentication system was designed to be backward compatible
- Legacy components were migrated gradually

### 2. Data Migration

- User data was migrated to the new authentication system
- Existing sessions were preserved during migration

## Conclusion

The JWT authentication system provides a secure, scalable, and user-friendly authentication solution for the CharterHub application. It follows modern best practices for token-based authentication and provides a robust foundation for future enhancements.

For implementation details and usage guidelines, refer to the JWT Authentication Developer Guidelines document. 