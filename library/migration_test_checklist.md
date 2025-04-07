# JWT Authentication Migration Test Checklist

## Server Stability Testing

- [ ] Start the server with the updated configuration
- [ ] Verify the frontend server stays running without "Killed: 9" errors
- [ ] Monitor memory usage during testing

## Authentication Testing

### JWT Demo

- [ ] Visit `/jwt-demo` to test the pure JWT authentication
- [ ] Verify login works
- [ ] Verify protected routes work
- [ ] Test profile management functions

### Migration Test Page

- [ ] Visit `/migration-test` to test the compatibility layer
- [ ] Verify the auth state is correctly displayed
- [ ] Test login with the legacy API
- [ ] Verify user information is displayed correctly
- [ ] Test logout functionality

### Existing Components

- [ ] Test login with existing Login component
- [ ] Verify protected routes work for client users
- [ ] Verify protected routes work for admin users
- [ ] Test profile updates
- [ ] Verify logout works across all components

## Role-Based Access Control

- [ ] Test that admin users can access admin routes
- [ ] Test that client users cannot access admin routes
- [ ] Test that unauthenticated users are redirected to login

## Token Management

- [ ] Verify that access tokens are refreshed automatically
- [ ] Test token invalidation on logout
- [ ] Check that HTTP-only cookies are being set for refresh tokens

## Error Handling

- [ ] Test login with invalid credentials
- [ ] Verify appropriate error messages are displayed
- [ ] Test automatic handling of expired tokens

## Integration with Backend

- [ ] Verify API calls are sending the JWT token in the Authorization header
- [ ] Check that protected endpoints return appropriate data
- [ ] Verify token validation on the backend

## Known Issues and Workarounds

- If you encounter memory issues with the development server, try:
  - Increasing the NODE_OPTIONS memory limit in `start-unified-server.sh`
  - Running with reduced HMR: `npm run start -- --no-hmr`
  - Closing other memory-intensive applications

- If authentication doesn't work as expected:
  - Check browser console for errors
  - Verify that cookies are being set correctly (check in DevTools)
  - Clear browser cookies and local storage, then try again

## Next Steps After Successful Testing

1. Continue migrating specific components as needed
2. Update any direct API calls to include JWT tokens
3. Clean up legacy authentication code once all components are migrated
4. Consider implementing more advanced JWT features like token versioning and role-based permission checks 