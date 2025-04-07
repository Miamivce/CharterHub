# CharterHub Authentication Debugging Instructions

## Issue Summary

The application is currently in a transitional phase, migrating from a hybrid CSRF+JWT authentication system to a pure JWT-based approach. Due to this transition, users may experience login issues with the standard login form because:

1. The system stores valid JWT tokens but the legacy login component doesn't recognize them
2. The frontend server crashes with memory issues (`Killed: 9` errors)
3. There are two separate authentication providers that aren't properly synchronized:
   - `LegacyAuthProvider` (used by the current Login component)
   - `JWTAuthContext` (the new authentication system)

## Solutions Implemented

We've implemented several fixes to address these issues:

1. **New JWT Login Page**:
   - Added a dedicated `/jwt-login` route that uses the JWT authentication system directly
   - Enhanced error handling and debugging logs
   - Added a prominent message on the regular login page directing users to the JWT login

2. **Memory Optimization Scripts**:
   - Created `start-frontend-reduced-memory.sh` which limits Node.js memory usage to 512MB
   - Created `start-backend-only.sh` to run just the backend server

## Usage Instructions

### For Authentication Debugging

1. Start the servers separately using the new scripts:

   ```bash
   # In terminal 1, start the backend
   ./start-backend-only.sh

   # In terminal 2, start the frontend with reduced memory
   ./start-frontend-reduced-memory.sh
   ```

2. Open your browser to `http://localhost:3000/jwt-login` to use the dedicated JWT login page

3. If login is successful but redirection doesn't work:
   - Manually navigate to `http://localhost:3000/dashboard`
   - Check the browser console for any error messages during redirection

### Checking Authentication State

1. Open browser developer tools (F12)
2. Go to the "Application" tab
3. Check local storage for:
   - `auth_token` - The JWT access token
   - `token_expiry` - When the token expires
   - `user_data` - Stored user information

4. Check the console for debugging logs that begin with:
   - `[Login]` - For the legacy login component
   - `[JWTLogin]` - For the new JWT login component
   - `[JWTAuthAdapter]` - For the adapter between old and new auth systems

## Logging In Successfully

The JWT authentication system should work with your existing credentials. Use the same email and password as usual, but go through the `/jwt-login` page instead of the regular login page.

## Future Steps

Once login is working reliably through the JWT login page, we can fully migrate the application to use only the JWT authentication system by:

1. Updating the default route to use JWTLogin
2. Removing the legacy authentication system completely
3. Ensuring all API endpoints validate JWT tokens correctly

## Troubleshooting

- If authentication fails with 401 errors:
  - Check that the backend JWT authentication endpoint is working correctly
  - Verify the stored token format in local storage
  - Try clearing all browser storage and logging in again

- If redirection fails after login:
  - Check for JavaScript errors in the console
  - Try manually navigating to `/dashboard`
  - Verify that the JWT tokens are being stored correctly

## Technical References

- JWT Auth Context: `frontend/src/contexts/auth/JWTAuthContext.tsx`
- JWT Login Component: `frontend/src/pages/shared/JWTLogin.tsx`
- JWT API Service: `frontend/src/services/jwtApi.ts`
- Auth Migration Plan: `docs/auth_migration_plan.md` 