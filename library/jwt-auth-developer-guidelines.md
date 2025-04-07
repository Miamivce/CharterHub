# JWT Authentication Developer Guidelines

## Introduction

This document provides comprehensive guidelines for working with the JWT authentication system in the CharterHub application. It covers the core concepts, usage patterns, and best practices for implementing authentication features.

## Core Concepts

### JWT Authentication Flow

Our JWT authentication system uses the following flow:

1. **Login**: User provides credentials and receives an access token and refresh token
2. **Access Protected Resources**: Access token is sent with each request
3. **Token Expiration**: When the access token expires, the refresh token is used to get a new access token
4. **Logout**: Tokens are invalidated and removed from storage

### Token Storage

Tokens are securely stored using the `TokenStorage` service:

- **Access Token**: Stored in memory/localStorage based on "Remember Me" setting
- **Refresh Token**: Stored as an HTTP-only cookie for security
- **User Data**: Cached in localStorage for performance

## Using JWTAuthContext

The `JWTAuthContext` is the central authentication state manager for the application. It provides:

- Authentication state
- User information
- Loading states
- Error states
- Authentication methods

### Basic Usage

```tsx
import { useJWTAuth } from '../../frontend/src/contexts/auth/JWTAuthContext';

function MyComponent() {
  const { 
    isAuthenticated,
    isInitialized,
    user,
    loading,
    errors,
    login,
    logout,
    refreshUserData
  } = useJWTAuth();
  
  // Check if auth is initialized
  if (!isInitialized) {
    return <div>Loading...</div>;
  }
  
  // Check if user is authenticated
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }
  
  return (
    <div>
      <h1>Welcome, {user?.firstName}!</h1>
      <button onClick={logout} disabled={loading.logout}>
        {loading.logout ? 'Logging out...' : 'Logout'}
      </button>
    </div>
  );
}
```

### Authentication Methods

The `JWTAuthContext` provides the following methods:

#### Login

```tsx
const { login, loading, errors } = useJWTAuth();

const handleLogin = async (email, password, rememberMe = false) => {
  try {
    await login(email, password, rememberMe);
    // Handle successful login
  } catch (error) {
    // Handle error
  }
};

// In your JSX
<button onClick={handleLogin} disabled={loading.login}>
  {loading.login ? 'Logging in...' : 'Login'}
</button>
{errors.login && <p className="error">{errors.login.message}</p>}
```

#### Logout

```tsx
const { logout, loading } = useJWTAuth();

const handleLogout = async () => {
  try {
    await logout();
    // Handle successful logout
  } catch (error) {
    // Handle error
  }
};

// In your JSX
<button onClick={handleLogout} disabled={loading.logout}>
  {loading.logout ? 'Logging out...' : 'Logout'}
</button>
```

#### Refresh User Data

```tsx
const { refreshUserData, loading } = useJWTAuth();

const handleRefresh = async () => {
  try {
    await refreshUserData();
    // Handle successful refresh
  } catch (error) {
    // Handle error
  }
};

// In your JSX
<button onClick={handleRefresh} disabled={loading.refreshUserData}>
  {loading.refreshUserData ? 'Refreshing...' : 'Refresh'}
</button>
```

### Loading and Error States

The `JWTAuthContext` provides loading and error states for all operations:

```tsx
const { loading, errors } = useJWTAuth();

// Check loading state for a specific operation
if (loading.login) {
  return <div>Logging in...</div>;
}

// Check error state for a specific operation
if (errors.login) {
  return <div>Error: {errors.login.message}</div>;
}
```

## Protected Routes

Protected routes ensure that only authenticated users can access certain parts of the application. We have implemented a custom `ProtectedRoute` component in `App.tsx`:

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

### Usage in Routes

```tsx
<Route
  path="/admin"
  element={
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminDashboard />
    </ProtectedRoute>
  }
/>

<Route
  path="/dashboard"
  element={
    <ProtectedRoute allowedRoles={['client', 'admin']}>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

## Profile Management

The `JWTAuthContext` provides methods for managing user profiles:

### Update Profile

```tsx
const { updateProfile, loading, errors } = useJWTAuth();

const handleUpdateProfile = async (profileData) => {
  try {
    await updateProfile(profileData);
    // Handle successful update
  } catch (error) {
    // Handle error
  }
};

// In your JSX
<button onClick={handleUpdateProfile} disabled={loading.updateProfile}>
  {loading.updateProfile ? 'Updating...' : 'Update Profile'}
</button>
{errors.updateProfile && <p className="error">{errors.updateProfile.message}</p>}
```

### Change Password

```tsx
const { changePassword, loading, errors } = useJWTAuth();

const handleChangePassword = async (oldPassword, newPassword) => {
  try {
    await changePassword(oldPassword, newPassword);
    // Handle successful change
  } catch (error) {
    // Handle error
  }
};

// In your JSX
<button onClick={handleChangePassword} disabled={loading.changePassword}>
  {loading.changePassword ? 'Changing...' : 'Change Password'}
</button>
{errors.changePassword && <p className="error">{errors.changePassword.message}</p>}
```

## Best Practices

### 1. Always Check Authentication State

Before accessing user data or performing protected operations, always check the authentication state:

```tsx
const { isAuthenticated, user } = useJWTAuth();

if (!isAuthenticated || !user) {
  return <Navigate to="/login" />;
}

// Now you can safely use user data
```

### 2. Handle Loading and Error States

Always handle loading and error states for a better user experience:

```tsx
const { loading, errors } = useJWTAuth();

if (loading.login) {
  return <LoadingSpinner />;
}

if (errors.login) {
  return <ErrorMessage message={errors.login.message} />;
}
```

### 3. Use Role-Based Access Control

Check user roles for role-based access control:

```tsx
const { user } = useJWTAuth();

if (user?.role === 'admin') {
  // Show admin-only features
}
```

### 4. Refresh User Data When Needed

Refresh user data when necessary, especially after updates:

```tsx
const { refreshUserData } = useJWTAuth();

const handleProfileUpdate = async () => {
  await updateProfile(data);
  // Refresh user data to ensure UI reflects changes
  await refreshUserData();
};
```

### 5. Implement Proper Error Handling

Implement proper error handling for authentication operations:

```tsx
try {
  await login(email, password);
} catch (error) {
  if (error.response?.status === 401) {
    setErrorMessage('Invalid credentials');
  } else {
    setErrorMessage('An error occurred. Please try again later.');
  }
}
```

## Common Patterns

### Conditional Rendering Based on Authentication

```tsx
const { isAuthenticated, user } = useJWTAuth();

return (
  <div>
    {isAuthenticated ? (
      <>
        <h1>Welcome, {user?.firstName}!</h1>
        <LogoutButton />
      </>
    ) : (
      <>
        <h1>Please sign in</h1>
        <LoginForm />
      </>
    )}
  </div>
);
```

### Loading States

```tsx
const { isInitialized } = useJWTAuth();

if (!isInitialized) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}

return <YourComponent />;
```

### Role-Based UI

```tsx
const { user } = useJWTAuth();

return (
  <div>
    <h1>Dashboard</h1>
    
    {/* Shared content */}
    <CommonFeatures />
    
    {/* Admin-only content */}
    {user?.role === 'admin' && (
      <AdminFeatures />
    )}
    
    {/* Client-only content */}
    {user?.role === 'client' && (
      <ClientFeatures />
    )}
  </div>
);
```

## Troubleshooting

### User is not redirected after login

1. Check if you're correctly awaiting the login promise
2. Verify the redirect logic in your component
3. Ensure you're not suppressing errors

### User data is not updated after profile changes

1. Call refreshUserData() after updateProfile()
2. Verify the profileUpdate API is working correctly
3. Check if the user object is properly spread in the state update

### Token seems to expire too quickly

1. Check the token expiration time in the API
2. Verify the token refresh logic
3. Make sure your server time is synchronized

### Protected routes not working

1. Verify you're using the ProtectedRoute component correctly
2. Check the role-based access configuration
3. Ensure isAuthenticated is correctly updated after login

## Migration Guide

### Migrating from LegacyAuthProvider to JWTAuthContext

1. **Update imports**:
   ```tsx
   // OLD
   import { useAuth } from '../../frontend/src/contexts/auth/LegacyAuthProvider';
   
   // NEW
   import { useJWTAuth } from '../../frontend/src/contexts/auth/JWTAuthContext';
   ```

2. **Update hook usage**:
   ```tsx
   // OLD
   const { user, loading, login, logout } = useAuth();
   
   // NEW
   const { user, loading, login, logout } = useJWTAuth();
   ```

3. **Update authentication checks**:
   ```tsx
   // OLD
   if (!user) {
     return <Navigate to="/login" />;
   }
   
   // NEW
   const { isAuthenticated, isInitialized } = useJWTAuth();
   
   if (!isInitialized) {
     return <LoadingSpinner />;
   }
   
   if (!isAuthenticated) {
     return <Navigate to="/login" />;
   }
   ```

4. **Update loading states**:
   ```tsx
   // OLD
   if (loading) {
     return <LoadingSpinner />;
   }
   
   // NEW
   const { loading } = useJWTAuth();
   
   if (loading.login) {
     return <LoadingSpinner />;
   }
   ```

5. **Update error handling**:
   ```tsx
   // OLD
   try {
     await login(email, password);
   } catch (error) {
     setError(error.message);
   }
   
   // NEW
   const { errors } = useJWTAuth();
   
   try {
     await login(email, password);
   } catch (error) {
     // Errors are automatically stored in the context
   }
   
   // Display errors from context
   {errors.login && <p>{errors.login.message}</p>}
   ```

## Conclusion

This guide covers the essential aspects of working with the JWT authentication system in the CharterHub application. By following these guidelines, you can ensure a secure, consistent, and user-friendly authentication experience.

For more advanced topics or specific use cases, refer to the JWT Authentication Architecture document or contact the authentication team. 