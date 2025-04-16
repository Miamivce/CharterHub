# Domain-Based Routing Implementation

This document explains how the domain-based routing is implemented for CharterHub, enabling separate domains for the admin interface (`admin.yachtstory.be`) and client interface (`app.yachtstory.be`).

## Overview

The application's routing has been restructured to detect the current domain and render the appropriate interface:

- If accessed via `admin.yachtstory.be`, the admin interface is shown
- If accessed via `app.yachtstory.be`, the client interface is shown

This is achieved through early domain detection in the application's component hierarchy, before any routing decisions are made.

## Implementation Details

### 1. Domain Detection Component

The `DomainRouter` component in `App.tsx` serves as the entry point for domain-based routing:

- It checks the current hostname on component mount
- Based on the detected domain, it renders either `AdminRoutes` or `ClientRoutes`
- In development mode, it renders all routes (`AppRoutes`)
- It includes detailed console logging for debugging

### 2. Domain Utilities

Domain-related utilities are centralized in `utils/domainUtils.ts`:

- `isAdminDomain()`: Checks if the current hostname matches the admin domain
- `isClientDomain()`: Checks if the current hostname matches the client domain
- `redirectToCorrectDomain()`: Redirects users to the correct domain based on their role

### 3. Separate Route Trees

The application defines distinct route trees for admin and client interfaces:

- `AdminRoutes`: Contains only admin-specific routes
- `ClientRoutes`: Contains client routes and public routes
- `AppRoutes`: Contains all routes (used in development)

### 4. Authentication Integration

The domain-based routing works in tandem with the authentication system:

- `ProtectedRoute` component checks user roles and restricts access appropriately
- Login components redirect to the correct domain based on user role
- JWT authentication context redirects users to their proper domain

## Debugging

### Console Logging

Extensive console logging has been added to help diagnose domain-related issues:

- Domain detection logs with detailed diagnostics
- Hostname and environment information
- Route selection decisions
- Redirect operations

To view these logs in production:

1. Open browser developer tools
2. Go to the Console tab
3. Filter for "[domainUtils]" or "[DomainRouter]"

### Common Issues and Solutions

#### 1. Both Domains Show the Same Interface

**Symptoms:**
- Both domains show the client interface
- No errors in console

**Possible Causes:**
- Hostname detection issue
- Caching problems
- Deployment configuration issue

**Solutions:**
- Check browser console logs for "[domainUtils] isAdminDomain check"
- Verify that the hostname is correctly detected
- Clear browser cache completely
- Force refresh with Ctrl+F5 / Cmd+Shift+R
- Check Vercel deployment environment variables

#### 2. Redirect Loops

**Symptoms:**
- Browser shows "too many redirects" error
- Page constantly refreshes

**Possible Cause:**
- Authentication and domain redirect logic conflict

**Solution:**
- Clear all cookies and local storage
- Check console logs for redirect cycles
- Verify role-based access controls
- Check domain detection conditions

#### 3. 404 Errors on Admin Domain

**Symptoms:**
- Admin domain shows 404 errors for expected routes

**Possible Cause:**
- Route configuration issue specific to admin domain

**Solution:**
- Verify that AdminRoutes includes all necessary routes
- Check that all admin routes are prefixed correctly
- Review Vercel routing configuration

## Vercel Configuration

The application is configured in Vercel with:

- Single project serving multiple domains
- Custom domain configuration for both domains
- Appropriate environment variables

## Testing Domain-Based Routing

To properly test the domain-based routing:

1. Make sure both domains are properly configured in DNS and Vercel
2. Test unauthenticated access to each domain
3. Test login as admin user on both domains
4. Test login as client user on both domains
5. Verify that role-based redirects function correctly
6. Test navigating between different sections of the application

## Further Development

When extending the application:

- Keep the separation of admin and client routes
- Ensure new components check for the appropriate domain
- Maintain the proper pattern for protected routes
- Add domain-specific console logging for debugging 