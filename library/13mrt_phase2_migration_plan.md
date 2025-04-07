# JWT Authentication System - Phase 2 Migration Plan

## Overview

This document outlines the plan for Phase 2 of our authentication system migration. Having successfully completed Phase 1 (migrating all components to use the LegacyAuthProvider compatibility layer), we're now ready to begin Phase 2, which involves migrating components to use the JWTAuthContext directly.

## Objectives

1. Gradually migrate components from using LegacyAuthProvider to JWTAuthContext
2. Take advantage of new JWTAuthContext features (loading states, error handling, etc.)
3. Maintain application stability throughout the migration
4. Resolve the profile update UI synchronization issue
5. Clean up legacy authentication code after migration is complete

## Migration Approach

We'll use a component-by-component migration strategy, starting with simpler, less critical components first. This approach allows us to:

1. Test the integration with JWTAuthContext in isolation
2. Identify and fix issues early in the process
3. Gain experience with the new authentication system before tackling more complex components
4. Maintain a working application throughout the migration

## Component Prioritization

### Priority 1 (Low Complexity / Low Risk)
- DocumentList.tsx
- BookingList.tsx
- BookingDetails.tsx

### Priority 2 (Medium Complexity / Medium Risk)
- Dashboard.tsx
- AdminDashboard.tsx
- BookingContext.tsx

### Priority 3 (High Complexity / High Risk)
- App.tsx
- ProtectedRoute.tsx
- Login.tsx

## Migration Process for Each Component

For each component, follow these steps:

1. **Analysis Phase**
   - Review current component implementation
   - Identify authentication dependencies and requirements
   - Check for any component-specific edge cases

2. **Implementation Phase**
   - Update imports to use JWTAuthContext directly
   - Replace legacy auth hooks and functions with new equivalents
   - Update component to use new auth features (loading states, error handling)
   - Add proper typings for all auth-related data

3. **Testing Phase**
   - Test component in isolation with the new auth context
   - Test component within application flow
   - Verify all auth-related functionality works correctly

4. **Deployment Phase**
   - Merge changes to main codebase
   - Monitor for any issues after deployment

## Migration Steps for Different Auth Features

### User Information

**From:**
```typescript
const { user } = useJWTAuth(); // LegacyAuthProvider
```

**To:**
```typescript
const { user } = useJWTAuth(); // JWTAuthContext
```

### Login/Logout

**From:**
```typescript
const { login, logout } = useJWTAuth(); // LegacyAuthProvider
await login(email, password);
await logout();
```

**To:**
```typescript
const { login, logout } = useJWTAuth(); // JWTAuthContext
await login(email, password, rememberMe);
await logout();
```

### Loading States

**From:**
```typescript
const { isLoading } = useJWTAuth(); // LegacyAuthProvider
if (isLoading) return <LoadingSpinner />;
```

**To:**
```typescript
const { loading } = useJWTAuth(); // JWTAuthContext
if (loading.auth || loading.user) return <LoadingSpinner />;
```

### Error Handling

**From:**
```typescript
const { error } = useJWTAuth(); // LegacyAuthProvider
if (error) return <ErrorMessage message={error} />;
```

**To:**
```typescript
const { errors } = useJWTAuth(); // JWTAuthContext
if (errors.auth) return <ErrorMessage message={errors.auth.message} />;
```

## Component-Specific Considerations

### DocumentList.tsx
- Only uses user role for conditional rendering
- Simple migration, replace useAuth with useJWTAuth

### BookingList.tsx / BookingDetails.tsx
- Uses user role for conditional rendering
- Interacts with BookingContext

### BookingContext.tsx
- Uses user ID and role for API calls
- Needs careful migration to ensure API calls continue to work correctly

### ProtectedRoute.tsx
- Should be replaced with JWTProtectedRoute component
- Needs to support role-based access control

### Login.tsx
- Complete rewrite to use JWT login flow
- Add support for remember me functionality
- Improve error handling

## Fixing Profile Update UI Synchronization

As part of Phase 2, we'll address the profile update UI synchronization issue:

1. **Root Cause Analysis**
   - Investigate context update propagation
   - Check for memoization issues
   - Verify state update triggers re-render

2. **Potential Solutions**
   - Use a timestamp-based approach to force re-renders
   - Implement useReducer for more predictable state updates
   - Consider using a state management library if needed

## Migration Tracking

We'll track migration progress in a new document (`13mrt_phase2_migration_current.md`), which will include:

- Component status (Pending/In Progress/Completed)
- Last updated date
- Issue tracking for each component
- Overall migration progress

## Testing Strategy

For each migrated component, we'll perform the following tests:

1. **Unit Tests**
   - Test component rendering with different auth states
   - Test interaction with auth-related functions

2. **Integration Tests**
   - Test component within application flow
   - Test interactions with other components

3. **End-to-End Tests**
   - Test complete user flows involving the component
   - Verify behavior matches expected outcomes

## Rollback Plan

If issues arise during migration, we can:

1. Revert the component back to using LegacyAuthProvider
2. Fix issues in a separate branch
3. Re-attempt migration once issues are resolved

## Post-Migration Cleanup

After all components are successfully migrated:

1. Remove LegacyAuthProvider code
2. Update documentation to reflect new authentication pattern
3. Clean up any deprecated auth-related code
4. Optimize JWTAuthContext for performance

## Timeline

- Week 1: Migrate Priority 1 components, start addressing profile update issue
- Week 2: Migrate Priority 2 components, continue addressing profile update issue
- Week 3: Migrate Priority 3 components, finalize profile update fix
- Week 4: Testing, cleanup, and documentation

## Success Criteria

Phase 2 will be considered complete when:

1. All components are successfully migrated to use JWTAuthContext directly
2. The profile update UI synchronization issue is resolved
3. All tests pass successfully
4. LegacyAuthProvider has been removed
5. Documentation has been updated to reflect the new authentication system 