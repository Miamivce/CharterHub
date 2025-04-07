# Admin Authentication Flow

This document illustrates the authentication flow for WordPress admins in the CharterHub application.

## Authentication Flow Diagram

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │      │                 │
│  Admin User     │─────▶│  Frontend       │─────▶│  PHP Backend    │─────▶│  WordPress DB   │
│  (Browser)      │      │  (React)        │      │  (port 8000)    │      │  (MySQL)        │
│                 │◀─────│                 │◀─────│                 │◀─────│                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘      └─────────────────┘
        │                        │                        │                        │
        │                        │                        │                        │
        │  1. Login Request      │                        │                        │
        │───────────────────────▶│                        │                        │
        │                        │                        │                        │
        │                        │  2. API Request        │                        │
        │                        │───────────────────────▶│                        │
        │                        │                        │                        │
        │                        │                        │  3. Validate Creds     │
        │                        │                        │───────────────────────▶│
        │                        │                        │                        │
        │                        │                        │  4. Auth Response      │
        │                        │                        │◀───────────────────────│
        │                        │                        │                        │
        │                        │  5. JWT & Refresh Token│                        │
        │                        │◀───────────────────────│                        │
        │                        │                        │                        │
        │  6. Auth Success       │                        │                        │
        │◀───────────────────────│                        │                        │
        │                        │                        │                        │
```

## Authentication Steps

1. **Admin Login Attempt**:
   - User enters credentials (admin@charterhub.com/Admin@123!)
   - Frontend captures credentials and prepares authentication request

2. **Frontend to PHP Backend**:
   - Frontend sends credentials to PHP backend endpoint (`http://localhost:8000/auth/store-refresh-token.php`)
   - Request includes username, password, and CSRF token

3. **PHP Backend to WordPress Database**:
   - PHP backend validates credentials against WordPress database
   - Checks if user exists and has admin privileges
   - Verifies password hash matches

4. **Database Authentication Response**:
   - Database returns user data if credentials are valid
   - Returns error if credentials are invalid or user lacks privileges

5. **JWT Token Generation**:
   - Backend generates JWT and refresh tokens
   - Stores refresh token in wp_charterhub_users table
   - Sets proper CORS headers for response

6. **Authentication Result**:
   - Frontend receives authentication result and tokens
   - If successful, user is redirected to admin dashboard
   - If failed, appropriate error message is displayed

## Security Considerations

- Credentials are never stored in the frontend
- JWT tokens are stored securely with proper expiration
- Refresh tokens are stored in the database
- HTTPS is used in production to encrypt all communication
- CORS headers are properly configured
- Database credentials are validated securely

## Error Handling

- Invalid credentials: Returns 401 Unauthorized
- Non-admin user: Returns 403 Forbidden
- Database unavailable: Returns 503 Service Unavailable
- Network issues: Returns appropriate error with helpful message

## Production Configuration

- Frontend hosted on Vercel
- Backend runs on secure server with proper SSL
- Database connections use encrypted communication
- All endpoints require HTTPS
- Rate limiting implemented for security
- Proper logging and monitoring in place 