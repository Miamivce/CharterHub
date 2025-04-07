# JWT Authentication Migration Guide

This document provides step-by-step instructions for migrating from the old authentication system to the new JWT-based authentication system.

## Overview

The new JWT authentication system provides several key improvements:

1. **Enhanced Security**
   - HTTP-only refresh tokens
   - Short-lived access tokens
   - Token blacklisting for immediate revocation
   - Automatic token refresh

2. **Better Performance**
   - Stateless authentication
   - Reduced database queries
   - Faster token validation

3. **Improved Developer Experience**
   - TypeScript support throughout
   - Consistent error handling
   - Loading and error states
   - Role-based access control

## Migration Options

You have two main approaches to migrate your components:

### Option 1: Direct Migration (Recommended for New Components)

This approach involves updating your components to directly use the new JWT authentication context.

#### Steps:

1. Import the JWT auth context hook:
   ```tsx
   import { useJWTAuth } from '@/contexts/auth/JWTAuthContext';
   ```

2. Replace the old auth hook with the new one:
   ```tsx
   // OLD
   const { user, login, logout } = useJWTAuth();
   
   // NEW
   const { user, login, logout, loading, errors } = useJWTAuth();
   ```

3. Update your JSX to handle loading and error states:
   ```tsx
   return (
     <div>
       {loading.login && <LoadingSpinner />}
       {errors.login && <ErrorMessage message={errors.login.message} />}
       {/* Rest of your component */}
     </div>
   );
   ```

4. For protected routes, use the new JWTProtectedRoute component:
   ```tsx
   import { JWTProtectedRoute } from '@/components/shared/JWTProtectedRoute';
   
   // In your routes file
   <Route 
     path="/admin-dashboard" 
     element={
       <JWTProtectedRoute allowedRoles={['admin']}>
         <AdminDashboard />
       </JWTProtectedRoute>
     } 
   />
   ```

### Option 2: Gradual Migration (Recommended for Existing Components)

This approach allows you to gradually migrate your components while maintaining backwards compatibility.

#### Steps:

1. Replace the old AuthProvider with the LegacyAuthProvider:
   ```tsx
   // In your App.tsx file
   
   // OLD
   import { AuthProvider } from '@/contexts/auth/AuthContext';
   
   // NEW
      ```

2. Replace the ProtectedRoute component with the updated version:
   ```tsx
   // Simply replace the file content or rename the files
   // from: components/shared/ProtectedRoute.tsx
   // to: components/shared/UpdatedProtectedRoute.tsx (then rename back)
   ```

3. No changes needed to your existing components! They will continue to work with the same interface.

## Testing Your Migration

After migration, test the following scenarios:

1. **Authentication Flow**
   - Login with valid credentials
   - Login with invalid credentials
   - Logout functionality
   - Automatic token refresh

2. **Protected Routes**
   - Access to role-specific routes
   - Redirection for unauthorized access
   - Loading states during initialization

3. **Profile Management**
   - View profile data
   - Update profile information
   - Change password

## Common Issues and Solutions

### Issue: Token not being sent with requests

**Solution**: 
Ensure you're using the provided API clients that automatically include the token:
```tsx
import jwtApi from '@/services/jwtApi';

// Use the jwtApi client for authenticated requests
const data = await jwtApi.getCurrentUser();
```

### Issue: Component not re-rendering on auth state change

**Solution**:
Make sure you're using the correct auth hook:
```tsx
// Direct migration
const { isAuthenticated } = useJWTAuth();

// Compatibility layer
const { isAuthenticated } = useJWTAuth();
```

### Issue: Protected routes not working properly

**Solution**:
Double-check the role configuration in your route setup:
```tsx
// Using JWT directly
<JWTProtectedRoute allowedRoles={['admin', 'client']}>

// Using compatibility layer
<UpdatedProtectedRoute allowedRoles={['admin', 'client']}>
```

## Backend API Changes

If you're making direct API calls, note these changes:

1. **Authentication Header**:
   ```
   Authorization: Bearer <your_jwt_token>
   ```

2. **Response Format**:
   All API responses now follow a consistent format:
   ```json
   {
     "success": true|false,
     "message": "Success or error message",
     "data": { ... },  // For success responses
     "errors": { ... } // For validation errors
   }
   ```

## Migration Checklist

- [ ] Replace AuthProvider with LegacyAuthProvider in App.tsx
- [ ] Replace ProtectedRoute component with UpdatedProtectedRoute
- [ ] Test login functionality
- [ ] Test protected routes
- [ ] Test profile management
- [ ] Update any direct API calls to use the correct authentication header
- [ ] Remove any CSRF token handling code (no longer needed)
- [ ] Test role-based access control
- [ ] Monitor for any authentication-related errors in the console

## Need Help?

If you encounter any issues during migration, check the following resources:

1. Review the JWT authentication demo at `/jwt-demo` to see a working example
2. Check the implementation in `contexts/auth/JWTAuthContext.tsx`
3. Look at the compatibility layer in `contexts/auth/JWTAuthAdapter.tsx`

## Conclusion

This migration will significantly enhance the security and performance of the authentication system while providing a better developer experience. The compatibility layer ensures a smooth transition, allowing you to migrate at your own pace without disrupting the application's functionality. 