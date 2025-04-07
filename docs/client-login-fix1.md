# Client Login Fix Implementation Plan

## Objective
Fix the backend endpoint for client login while preserving admin view functionality of client profiles.

## Phase 1: Backend Authentication
1. Fix client login endpoint ✓
   - Implement proper JWT token generation ✓
   - Add role-based validation ✓
   - Set up secure CORS headers ✓
   - Add rate limiting protection ✓

2. Update token handling
   - Implement proper JWT validation
   - Add token refresh mechanism
   - Set up secure cookie handling
   - Add CSRF protection

## Phase 2: Profile Data Structure
1. Review current data structure
   - Verify all required fields for client profiles
   - Ensure admin view requirements are met
   - Check data access controls

2. Implement data access controls
   - Add role-based permissions
   - Implement field-level access control
   - Add audit logging for sensitive operations

## Testing Plan
1. Authentication Testing
   - Test client login flow
   - Verify token generation and validation
   - Test token refresh mechanism
   - Verify rate limiting

2. Admin Functionality Testing
   - Verify admin can view client profiles
   - Test admin management functions
   - Verify data access controls
   - Test audit logging

## Implementation Steps
1. Create/update necessary endpoints:
   - `/auth/login.php` - Client login endpoint ✓
   - `/auth/refresh-token.php` - Token refresh endpoint
   - `/auth/me.php` - Current user profile endpoint
   - `/customers/list.php` - Admin view of clients

2. Update frontend components:
   - Update authentication context
   - Modify client profile components
   - Update admin view components
   - Add proper error handling

## Security Considerations
- Implement proper password hashing ✓
- Add brute force protection ✓
- Set secure cookie attributes
- Implement proper CORS policies ✓
- Add rate limiting ✓
- Set up audit logging ✓

## Progress Tracking
- [x] Phase 1: Backend Authentication (In Progress)
  - [x] Login endpoint improvements
  - [ ] Token refresh mechanism
  - [ ] Profile endpoint updates
- [ ] Phase 2: Profile Data Structure
- [ ] Testing Implementation
- [ ] Security Review
- [ ] Documentation Update

# Client Login Role Conversion Fix

## Issue Description
The application has a mismatch between backend and frontend role types:
- Backend (WordPress/MySQL) uses `'charter_client'` role
- Frontend expects `'customer'` role
- This causes type errors and potential inconsistencies in authorization

## Solution Implemented
We've implemented a role conversion strategy at the API boundary to maintain consistency:

1. **Backend Role Handling**
   - MySQL database continues to use `'charter_client'` in `wp_capabilities`
   - PHP API endpoints preserve `'charter_client'` in queries and database operations
   - SQL queries explicitly select `'charter_client'` role:
   ```sql
   SELECT 'charter_client' as role 
   FROM wp_users u 
   INNER JOIN wp_usermeta um 
   WHERE um.meta_value LIKE '%s:13:"charter_client";b:1%'
   ```

2. **Frontend Role Normalization**
   - Role conversion happens in `AuthContext.tsx`'s `parseUserData` function
   - All `'charter_client'` roles are converted to `'customer'` before being used in the frontend
   - User interface and customer service only deal with `'customer'` role
   - Type definitions updated to handle conversion gracefully

3. **Type Definitions**
   ```typescript
   // In AuthContext.tsx
   interface User {
     // ...
     role: 'admin' | 'customer' | 'charter_client';  // Allow both roles temporarily for conversion
   }

   // In customerService.ts
   interface RegisteredCustomer {
     // ...
     role: 'customer';  // Only customer role allowed here
   }
   ```

4. **Role Conversion Logic**
   ```typescript
   const parseUserData = (userData: any): User => {
     // ...
     const displayName = userData.displayName || 
       `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 
       userData.email.split('@')[0];

     return {
       // ...
       role: userData.role === 'charter_client' ? 'customer' : userData.role,
       // ...
     };
   };
   ```

## Benefits
1. Maintains backward compatibility with existing WordPress user system
2. Provides clean separation between backend and frontend role representations
3. Centralizes role conversion in a single location
4. Reduces risk of type conflicts in frontend components
5. Simplifies frontend authorization logic

## Related Files
- `frontend/src/contexts/auth/AuthContext.tsx`
- `frontend/src/services/customerService.ts`
- `backend/customers/list.php`
- `backend/setup/create_test_customer.php`

## Testing
1. Verify that users with `'charter_client'` role in WordPress can log in successfully
2. Confirm that the frontend sees these users as having the `'customer'` role
3. Ensure customer service operations work correctly with the converted role
4. Validate that authorization checks work properly throughout the application 

## Current Issues and Solutions

### 1. Database Schema Issues - ✓ FIXED
- **Company Data Storage**
  - Company data is now properly stored in user meta table
  - All charter client users have company meta entries
  - Queries have been updated to use meta table joins

### 2. Auth Action Logging - ✓ FIXED
- **Data Truncation**
  - The `action` column in auth logs table has been increased to VARCHAR(50)
  - Auth logging is now working without truncation errors
  - Table structure includes proper foreign key constraints

### 3. Authentication Flow - PENDING
- **Token Refresh Issues**
  - CSRF token generation is successful
  - Initial login succeeds but profile retrieval fails
  - Token refresh attempts return 403 Forbidden
  - Recommended: Implement proper token refresh mechanism with correct CORS headers

### 4. API Configuration - PENDING
- **Multiple API Endpoints**
  - Some endpoints return 404 Not Found
  - Inconsistent routing between admin and client APIs
  - Recommended: Standardize API routing and JWT usage

## Updated Implementation Plan

### Phase 1: Critical Fixes
1. **Database Updates**
   - [ ] Add missing `company` column to user meta table
   - [ ] Alter `action` column in auth logs table
   - [ ] Update queries to handle missing fields gracefully

2. **Authentication Flow**
   - [ ] Fix token refresh mechanism
   - [ ] Update CORS configuration for all endpoints
   - [ ] Implement proper error handling for auth failures

3. **API Configuration**
   - [ ] Standardize API routing
   - [ ] Resolve JWT configuration inconsistencies
   - [ ] Update frontend to use correct endpoints

### Phase 2: Testing and Validation
1. **Database Testing**
   - [ ] Verify company field storage and retrieval
   - [ ] Test auth action logging with various action types
   - [ ] Validate user meta data integrity

2. **Authentication Testing**
   - [ ] Test complete login flow
   - [ ] Verify token refresh mechanism
   - [ ] Validate role conversion
   - [ ] Test error handling scenarios

## Progress Tracking
- [x] Initial role conversion implementation
- [x] Basic authentication flow
- [ ] Database schema updates
- [ ] Token refresh mechanism
- [ ] Error handling improvements
- [ ] Testing and validation 