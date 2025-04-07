# Authentication Migration Plan: From CSRF+JWT to Pure JWT

## Current State Analysis (Updated March 13, 2025)
The authentication system is currently in a transitional phase, moving from a hybrid approach toward a pure JWT implementation:

1. **CSRF Tokens** - Used for legacy form submissions and some API requests
   - Frontend fetches tokens from `/auth/csrf-token.php` (now returns dummy tokens)
   - Tokens are stored using the `CSRFManager` class
   - Some mutation requests still include CSRF tokens in headers

2. **JWT Authentication** - Primary authentication mechanism
   - Upon login, JWT tokens are issued (access + refresh tokens)
   - Tokens are stored in client storage with improved storage type management
   - All API requests include JWT tokens in Authorization header
   - ✅ Token validation improved with direct payload extraction as fallback

3. ✅ **Legacy WordPress Connections** - Fully Removed
   - User system now operates independently from WordPress
   - No WordPress user dependencies exist for client users
   - WordPress errors have been eliminated

## Progress on Key Issues

1. **Redundant Security Layers**:
   - ✅ Frontend code now prioritizes JWT over CSRF tokens
   - ⚠️ CSRF dependency partially removed, but still required for some endpoints
   - 🔄 Request interceptors favor JWT authentication when available

2. **Frontend Complexity**:
   - ✅ Improved token storage consistency between `AuthContext.tsx` and `wpApi.ts`
   - ✅ Fixed type issues in token refresh mechanism
   - ⚠️ Still maintaining dual token system until migration completes

3. **API Inconsistency**:
   - ✅ Standardized CORS headers across endpoints
   - ✅ Improved error handling with consistent types
   - ✅ Fixed user profile update endpoints to use consistent token validation
   - ⚠️ Some endpoints still require CSRF tokens

4. **Authentication Persistence**:
   - ✅ Fixed token validation in profile-related endpoints
   - ✅ Implemented consistent database connection methods across auth endpoints
   - ✅ Enhanced error logging for authentication failures

## Migration Path

### Phase 1: Transitional Architecture (✅ Completed)

1. ✅ **Create Dummy CSRF Endpoints**:
   - Created `/auth/csrf-token.php` that returns dummy tokens
   - Ensured correct CORS headers to prevent browser errors
   - Maintained backward compatibility with frontend code

2. ✅ **Standardize CORS Handling**:
   - Created global CORS handler in `global-cors.php`
   - Applied consistent CORS rules across all auth endpoints
   - Ensured preflight requests are properly handled

### Phase 2: Frontend Migration (🔄 In Progress)

1. **Update Frontend API Service**:
   - ✅ Exported token storage keys from `wpApi.ts` to ensure consistency
   - ✅ Improved token refresh mechanism with better typing and error handling
   - ✅ Enhanced request interceptors to prioritize JWT authentication
   - ⚠️ Still maintaining CSRF token compatibility for transitional endpoints

2. **Simplify Auth Context**:
   - ✅ Removed duplicate token storage key definitions
   - ✅ Added missing fields to AuthState interface (refreshAttempts, isRefreshing)
   - ✅ Fixed refreshPromise type to match refreshUserData return type
   - ⚠️ Still depending on CSRFManager for some operations

3. **Update Components**:
   - ✅ Profile component now uses JWT token for authentication
   - ⚠️ Some components still handle CSRF token errors
   - 🔄 Gradual cleanup of CSRF-related code in progress

### Phase 3: Backend Migration (🔄 In Progress)

1. **Standardize Auth Endpoints**:
   - ✅ Key endpoints now use JWT authentication exclusively
   - ✅ Implemented direct token payload extraction as a fallback mechanism
   - ✅ Fixed `/auth/update-profile.php` endpoint to use consistent database connection
   - ⚠️ Still validating CSRF tokens on some endpoints
   - 🔄 Standardization continuing with remaining endpoints

2. **Enhance JWT Security**:
   - ✅ Improved token validation with multiple fallback mechanisms 
   - ✅ Enhanced error logging for authentication failures
   - ⚠️ Token blacklisting not yet implemented for logout
   - ⏱️ Refresh token security enhancements planned

3. **Remove Transitional Endpoints**:
   - ⏱️ Will be done after frontend migration is complete
   - ⏱️ Target removal of dummy CSRF endpoints in 4-6 weeks

## Known Issues and Next Steps

### Current Issues
1. **Token Persistence**:
   - ✅ Fixed token validation in profile update endpoints
   - ✅ Resolved "Authentication required" errors during profile updates
   - ⚠️ Some edge cases may still exist with token persistence across sessions

2. **Email Change Process**:
   - ✅ Improved token updates after email change
   - ✅ Enhanced database transaction handling during profile updates
   - ⚠️ Token revocation during email changes needs additional testing

### Immediate Next Steps
1. **Complete Profile Update Flow**:
   - Test edge cases for email change scenarios
   - Monitor token revocation during email updates
   - Ensure consistent error handling

2. **Reduce CSRF Dependencies**:
   - Remove CSRF token requirements from more endpoints
   - Simplify error handling for token-related failures

3. **Enhance Documentation**:
   - Document the token validation fallback mechanism
   - Update development guidelines for authentication handling

## Implementation Timeline (Updated)

1. **Immediate (Phase 1)** - ✅ Completed
   - Fix CORS issues
   - Create transitional CSRF endpoints
   - Document current system

2. **Short-term (March 2025)** - 🔄 In Progress
   - ✅ Fix token storage inconsistencies
   - ✅ Improve type safety in authentication flows
   - ✅ Fix profile update token handling
   - ✅ Fix authentication persistence issues in core endpoints
   - 🔄 Continue enhancement of error logging and validation

3. **Medium-term (April 2025)**
   - Continue removing CSRF dependencies from frontend
   - Enhance backend JWT implementation
   - Complete testing with pure JWT flow

4. **Long-term (May 2025)**
   - Remove all transitional endpoints
   - Finalize documentation
   - Monitor for any issues

## Success Metrics

1. **Technical Goals**:
   - ✅ Improved consistency in token storage 
   - ✅ More reliable token validation with fallback mechanisms
   - 🔄 Simplified frontend authentication code (in progress)
   - ✅ More consistent API responses with detailed error logging

2. **User Experience**:
   - ✅ Fixed profile update authentication issues
   - ✅ Better error reporting for authentication failures
   - 🔄 Working toward more reliable authentication across sessions

## Conclusion

The authentication system migration is progressing well, with significant improvements to token validation, profile update functionality, and error handling. We've successfully fixed the issues with profile updates by implementing a more robust token validation approach and ensuring consistent database connection methods across endpoints.

The focus for the immediate future is to complete testing of email change scenarios, continue removing CSRF dependencies, and enhance documentation of the authentication system. With the recent fixes to profile update functionality, we're now better positioned to complete the migration to a pure JWT-based authentication system. 