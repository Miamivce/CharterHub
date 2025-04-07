# JWT Authentication Setup for Live Deployment

This document outlines how to migrate from Basic Authentication (local development) to JWT Authentication (production) with the CharterHub application.

## Prerequisites

- WordPress with JWT Authentication for WP REST API plugin installed
- Access to server to modify wp-config.php and .htaccess files
- Wordfence properly configured

## Step 1: Configure WordPress for JWT Authentication

1. **Update wp-config.php**:
   Add the following code to your wp-config.php file before the "That's all, stop editing!" line:

   ```php
   // JWT Authentication configuration
   define('JWT_AUTH_SECRET_KEY', 'your-secret-key-here'); // ⚠️ Use a strong, unique secret key
   define('JWT_AUTH_CORS_ENABLE', true);
   ```

   The secret key should be a long, secure random string. You can use [this generator](https://api.wordpress.org/secret-key/1.1/salt/) to create a suitable key.

2. **Update .htaccess to allow Authorization header**:
   Add the following to your .htaccess file:

   ```
   # Allow Authorization header for JWT authentication
   RewriteEngine On
   RewriteCond %{HTTP:Authorization} ^(.*)
   RewriteRule ^(.*) - [E=HTTP_AUTHORIZATION:%1]
   SetEnvIf Authorization "(.*)" HTTP_AUTHORIZATION=$1
   ```

3. **Enable the JWT Authentication plugin in WordPress**:
   - Navigate to Plugins > Installed Plugins
   - Activate "JWT Authentication for WP REST API"

## Step 2: Update Environment Variables

For production, update the `.env` file with:

```
VITE_USE_JWT=true
VITE_WP_API_URL=https://yachtstory.com/wp-json
VITE_WORDPRESS_USERNAME=admin
VITE_WORDPRESS_APPLICATION_PASSWORD=your-application-password
```

## Step 3: Test JWT Authentication

1. Use the Authentication Test Page at `/test/auth-test` to verify JWT functionality:
   - Test acquiring a token with the "Get JWT Token" button
   - Test validation and accessing protected endpoints
   - Ensure all requests use Bearer token authentication

2. Verify that the token is correctly stored in localStorage and used for all API requests.

## Troubleshooting

- **401 Unauthorized errors**: Verify your JWT token is valid and not expired
- **CORS issues**: Ensure JWT_AUTH_CORS_ENABLE is set to true and proper CORS headers are configured
- **JWT token not being accepted**: Check that Wordfence is configured to allow JWT authentication
- **JWT plugin conflicts**: Disable other authentication plugins that may conflict

## Security Considerations

1. **Always use HTTPS** for production deployments to protect authentication credentials
2. **Set appropriate token lifetimes**
3. **Configure Wordfence properly** to work with JWT Authentication
4. **Implement token refresh** strategies if using long-lived sessions

## Application Architecture

The application uses a dual-mode authentication system that can switch between Basic Auth (local) and JWT Auth (production) based on the `VITE_USE_JWT` environment variable.

For code implementation details, see:
- `src/services/wpApi.ts` - API service with authentication logic
- `src/contexts/auth/AuthContext.tsx` - Authentication context and user management 