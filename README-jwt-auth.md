# JWT Authentication System Overview

## Current Status

The JWT authentication system is partially working but has several issues that need to be addressed:

1. **Authentication Issues**:
   - 401 Unauthorized errors when accessing protected endpoints
   - JWT token verification failing with "User not verified for token with ID: XX"
   - Browser console showing authentication errors

2. **Database Schema Issues**:
   - Missing or misnamed columns causing SQL errors
   - `created_at` vs `user_registered` column inconsistency

3. **Frontend Issues**:
   - Missing `formatToken` function in `authHelpers.js`
   - Import errors in various frontend services

## Fixes Implemented

1. **SQL Query Fix**:
   - Changed references from `created_at` to `user_registered` in SQL queries and output mappings
   - Modified the ORDER BY clause to use the correct column name

2. **Constant & Function Redefinition Fix**:
   - Added checks to prevent duplicate definition of `CHARTERHUB_LOADED` constant
   - Added function_exists checks for `set_cors_headers` to prevent redefinition

3. **Frontend Auth Helper Fix**:
   - Added the missing `formatToken` function to `authHelpers.js` to properly format JWT tokens

4. **JWT Verification Improvements**:
   - Replaced the old verify_jwt_token function with improved_verify_jwt_token in jwt-fix.php.
   - Removed references to the non-existent refresh_token column from JWT verification queries, eliminating SQL errors.
   - Added detailed diagnostic logging that outputs the decoded JWT header, payload, and expiration times, aiding in troubleshooting.
   - In development mode, missing refresh tokens are ignored to maintain compatibility.

## Remaining Issues

1. **Database Verification**:
   - Need to ensure all tables have the expected columns
   - Create missing columns where needed or update queries

2. **JWT Verification Troubleshooting**:
   - The "User not verified" error suggests that either:
     a) The 'verified' column is missing from the user table
     b) Users are not being properly verified upon registration/activation

3. **Complete Authentication Flow Testing**:
   - Test full login and token generation process
   - Verify that tokens are being properly stored and sent with requests
   - Ensure proper token refresh mechanism

## How To Test

1. **Basic Authentication Test**:
   ```
   curl -i "http://localhost:8000/test-auth.php"
   ```
   This should return information about token presence and format.

2. **Authenticated Endpoint Test**:
   ```
   curl -i -H "Authorization: Bearer YOUR_TOKEN" "http://localhost:8000/customers/list.php"
   ```
   Replace YOUR_TOKEN with a valid JWT token.

3. **Frontend Test**:
   - Login through the frontend interface
   - Verify network requests include the Authorization header
   - Check for 200 OK responses on protected endpoints

## Development Mode

Development mode has been enabled to make debugging easier. In development mode:
- Refresh token validation is less strict
- More detailed error messages are returned
- JWT expiration times are extended

To disable development mode for production, set `DEVELOPMENT_MODE` to `false` in `auth/config.php`. 