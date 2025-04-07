# JWT Authentication Migration Guide

This guide provides step-by-step instructions for migrating components from using the `LegacyAuthProvider` to directly using the `JWTAuthContext`. This simplifies the authentication flow and removes the compatibility layer.

## Why Migrate?

1. **Direct Access**: Access JWT auth functionality without going through the compatibility layer
2. **Better Type Safety**: Improved TypeScript types with direct access to the JWT auth context
3. **Simplified Architecture**: Removes an extra layer of abstraction
4. **Better Error Handling**: Direct access to loading and error states

## Migration Steps

### 1. Update Imports

**Before:**
```typescript
```

**After:**
```typescript
import { useJWTAuth } from '@/contexts/auth/JWTAuthContext';
import type { User, UserProfileUpdateData } from '@/types/auth'; // Import necessary types
```

### 2. Update Hook Usage

**Before:**
```typescript
const auth = useJWTAuth();
const user = auth?.user;

// Using methods:
auth.login(email, password);
auth.updateProfile(userData);
```

**After:**
```typescript
const { 
  user, 
  isAuthenticated, 
  isInitialized,
  login, 
  logout, 
  updateProfile,
  loading, 
  errors
} = useJWTAuth();

// Using methods:
login(email, password);
updateProfile(userData);
```

### 3. Update Error Handling

**Before:**
```typescript
try {
  await auth.login(email, password);
} catch (error) {
  // Handle error directly
  console.error('Login error:', error);
}
```

**After:**
```typescript
// Option 1: Use try/catch
try {
  await login(email, password);
} catch (error) {
  console.error('Login error:', error);
}

// Option 2: Use loading and error states
if (loading.login) {
  // Show loading spinner
}

if (errors.login) {
  // Show error message
  console.error('Login error:', errors.login);
}
```

### 4. Update Form Submissions

**Before:**
```typescript
const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    await auth.updateProfile(formData);
    // Handle success
  } catch (error) {
    // Handle error
  }
};
```

**After:**
```typescript
const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    // Create correctly typed input data
    const profileData: UserProfileUpdateData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phoneNumber: formData.phoneNumber || '',
      company: formData.company || ''
    };
    
    const updatedUser = await updateProfile(profileData);
    // Handle success with updated user data
  } catch (error) {
    // Handle error (with improved error extraction)
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'response' in error) {
      // Handle Axios error
      const axiosError = error as AxiosError;
      if (axiosError.response?.data && typeof axiosError.response.data === 'object' && 'message' in axiosError.response.data) {
        errorMessage = String(axiosError.response.data.message);
      }
    }
    console.error('Update error:', errorMessage);
  }
};
```

### 5. Update Conditional Rendering

**Before:**
```tsx
{auth.isLoading ? (
  <Spinner />
) : auth.user ? (
  <UserProfile user={auth.user} />
) : (
  <LoginForm />
)}
```

**After:**
```tsx
{loading.login ? (
  <Spinner />
) : isAuthenticated && user ? (
  <UserProfile user={user} />
) : (
  <LoginForm />
)}
```

## Complete Example: Profile Component

Here's a complete example based on our migration of the Profile component:

```tsx
import { useState, useEffect, useRef } from 'react'
import { useJWTAuth } from '@/contexts/auth/JWTAuthContext'
import { useDocument } from '@/contexts/document/DocumentContext'
import { Card, Button, Input } from '@/components/shared'
import { toast } from '@/components/ui/use-toast'
import type { User, UserProfileUpdateData } from '@/types/auth'

export function Profile() {
  // Use the JWT auth context directly
  const { user, updateProfile, loading, errors } = useJWTAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    company: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  
  // Initialize form data from user
  useEffect(() => {
    if (user && !isEditing) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        company: user.company || '',
      });
    }
  }, [user, isEditing]);
  
  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Create profile update data
      const profileData: UserProfileUpdateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber || '',
        company: formData.company || ''
      };
      
      // Call updateProfile directly
      const updatedUser = await updateProfile(profileData);
      
      // Update form data with returned user
      if (updatedUser) {
        setFormData({
          firstName: updatedUser.firstName || '',
          lastName: updatedUser.lastName || '',
          email: updatedUser.email || '',
          phoneNumber: updatedUser.phoneNumber || '',
          company: updatedUser.company || ''
        });
      }
      
      // Show success message
      toast({
        title: "Profile updated",
        description: "Your profile was updated successfully",
        variant: "default"
      });
      
      // Exit edit mode
      setIsEditing(false);
    } catch (error) {
      // Handle errors
      toast({
        title: "Profile update failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  };
  
  return (
    <Card>
      <form onSubmit={handleSubmit}>
        {/* Form fields */}
        <Input
          name="firstName"
          value={formData.firstName}
          onChange={(e) => setFormData({...formData, firstName: e.target.value})}
          disabled={!isEditing || loading.updateProfile}
        />
        {/* Other form fields */}
        
        {isEditing ? (
          <Button type="submit" disabled={loading.updateProfile}>
            {loading.updateProfile ? 'Saving...' : 'Save Profile'}
          </Button>
        ) : (
          <Button onClick={() => setIsEditing(true)}>
            Edit Profile
          </Button>
        )}
      </form>
    </Card>
  );
}
```

## Component Migration Checklist

When migrating a component, use this checklist:

- [ ] Update imports from `useAuth` to `useJWTAuth`
- [ ] Add necessary type imports from `@/types/auth`
- [ ] Update hook usage to destructure the needed values
- [ ] Update method calls to use the destructured methods
- [ ] Update error handling to use the loading and error states
- [ ] Ensure proper typing for input data to methods
- [ ] Test the component thoroughly after migration

## Next Steps After Migration

Once all components have been migrated:

1. Update `RootProvider.tsx` to use `JWTAuthProvider` directly (completed)
2. Remove the `LegacyAuthProvider.tsx` file
3. Remove the compatibility layer in `JWTAuthAdapter.tsx`
4. Update any tests that use the legacy auth provider 