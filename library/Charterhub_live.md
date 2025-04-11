# CharterHub Live Application Documentation

## Table of Contents
1. [System Overview](#1-system-overview)
2. [Live Environment Configuration](#2-live-environment-configuration)
3. [API Documentation](#3-api-documentation)
4. [Authentication System](#4-authentication-system)
5. [Frontend Architecture](#5-frontend-architecture)
6. [Security and Data Protection](#6-security-and-data-protection)
7. [Deployment Process](#7-deployment-process)
8. [Known Issues and Workarounds](#8-known-issues-and-workarounds)
9. [Maintenance Procedures](#9-maintenance-procedures)

## 1. System Overview

CharterHub is a booking and client management system with separate client and admin interfaces utilizing a JWT-based authentication framework for secure access management with role-based permissions.

### Architecture Components

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  Client Portal  │      │  Admin Portal   │      │  API Services   │
│                 │      │                 │      │                 │
└────────┬────────┘      └────────┬────────┘      └────────┬────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                         ┌────────┴────────┐
                         │                 │
                         │    Database     │
                         │                 │
                         └─────────────────┘
```

### Production Environment

The CharterHub production system is deployed across:

1. **Frontend**: Vercel hosting platform (charter-hub.vercel.app)
   - React-based Single Page Application (SPA)
   - Static asset delivery via Vercel's CDN

2. **Backend API**: Hosted on Render (charterhub-api.onrender.com)
   - PHP-based REST API
   - MySQL database connectivity
   - JWT authentication implementation

3. **Database**: Separate MySQL server
   - Hosted on a dedicated database server
   - Contains user, booking, and yacht information

## 2. Live Environment Configuration

### Frontend Configuration

The frontend application uses environment variables that are configured in the Vercel deployment:

| Variable | Description | Production Value |
|----------|-------------|------------------|
| `VITE_PHP_API_URL` | Backend API URL | `https://charterhub-api.onrender.com` |
| `VITE_ENV` | Environment identifier | `production` |
| `VITE_AUTH_TOKEN_EXPIRY` | Token expiry time in seconds | `1800` (30 minutes) |
| `VITE_APP_URL` | Frontend application URL | `https://charter-hub.vercel.app` |

### Backend Configuration

Backend API server configuration parameters:

| Parameter | Description | Production Value |
|-----------|-------------|------------------|
| `JWT_SECRET` | Secret key for JWT signing | [Secured in environment] |
| `JWT_EXPIRY` | JWT token expiry in seconds | `1800` (30 minutes) |
| `REFRESH_TOKEN_EXPIRY` | Refresh token expiry in seconds | `1209600` (14 days) |
| `CORS_ALLOWED_ORIGINS` | Allowed CORS origins | `https://charter-hub.vercel.app` |
| `DB_HOST` | Database hostname | [Secured in environment] |
| `DB_NAME` | Database name | `charterhub_prod` |
| `DB_USER` | Database username | [Secured in environment] |
| `DB_PASSWORD` | Database password | [Secured in environment] |

### Database Connection

The production database is accessed via SSL-secured connection:

```php
$db = new mysqli(
    $_ENV['DB_HOST'],
    $_ENV['DB_USER'],
    $_ENV['DB_PASSWORD'],
    $_ENV['DB_NAME'],
    $_ENV['DB_PORT'] ?? 3306
);

// SSL configuration
$db->ssl_set(
    null,
    null,
    '/path/to/ca-cert.pem',
    null,
    null
);
```

## 3. API Documentation

### API Base URL

```
https://charterhub-api.onrender.com
```

### API Categories

| Category | Purpose | Base Endpoint |
|----------|---------|--------------|
| Authentication | User login/logout and session management | `/auth/*` |
| User Management | Profile updates and user registration | `/auth/*` |
| Admin Operations | Admin-specific endpoints | `/api/admin/*` |
| Client Operations | Client-specific endpoints | `/api/client/*` |
| Yacht Information | Retrieve yacht data | `/api/yachts.php` |
| Destination Information | Retrieve destination data | `/api/destinations.php` |
| Invitation Management | Manage client invitation links | `/api/admin/*` |

### Authentication Endpoints

#### `/auth/login.php`
- **Method**: POST
- **Purpose**: General-purpose login endpoint for both client and admin users
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword",
    "remember_me": true
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "token": "jwt-token-here",
    "refreshToken": "refresh-token-here",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "client"
    }
  }
  ```

#### `/auth/admin-login.php`
- **Method**: POST
- **Purpose**: Admin-specific login endpoint (enforces admin role)
- **Request/Response**: Same as `/auth/login.php` but restricts to admin role

#### `/auth/client-login.php`
- **Method**: POST
- **Purpose**: Client-specific login endpoint (enforces client role)
- **Request/Response**: Same as `/auth/login.php` but restricts to client role

#### `/auth/logout.php`
- **Method**: POST
- **Purpose**: End user session and invalidate tokens
- **Request**: Requires JWT token in Authorization header
- **Response**:
  ```json
  {
    "success": true
  }
  ```

#### `/auth/refresh-token.php`
- **Method**: POST
- **Purpose**: Get a new access token using HTTP-only refresh token cookie
- **Request**: No body needed (uses HTTP-only cookie)
- **Response**:
  ```json
  {
    "success": true,
    "token": "new-jwt-token-here",
    "refreshToken": "new-refresh-token-here"
  }
  ```

#### `/auth/me.php`
- **Method**: GET
- **Purpose**: Get current user profile data
- **Request**: JWT token in Authorization header
- **Response**:
  ```json
  {
    "success": true,
    "user": {
      "id": 1,
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "client",
      "phone_number": "123-456-7890",
      "company": "Example Corp",
      "verified": true
    }
  }
  ```

### User Management Endpoints

#### `/auth/update-profile.php`
- **Method**: POST
- **Purpose**: Update user profile information
- **Request**:
  ```json
  {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "phone_number": "123-456-7890",
    "company": "Example Corp"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "user": {
      "id": 1,
      "email": "john.doe@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "client",
      "phone_number": "123-456-7890",
      "company": "Example Corp"
    }
  }
  ```

#### `/auth/change-password.php`
- **Method**: POST
- **Purpose**: Change user password
- **Request**:
  ```json
  {
    "current_password": "oldpassword",
    "new_password": "newpassword"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Password changed successfully"
  }
  ```

#### `/auth/register.php`
- **Method**: POST
- **Purpose**: Register a new user
- **Request**:
  ```json
  {
    "email": "newuser@example.com",
    "password": "securepassword",
    "firstName": "Jane",
    "lastName": "Smith",
    "phoneNumber": "123-456-7890",
    "company": "Example Corp",
    "invitationToken": "abc123xyz" // Optional
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Registration successful",
    "user_id": 123
  }
  ```

#### `/auth/minimal-register.php`
- **Method**: POST  
- **Purpose**: Simplified registration endpoint for faster registration
- **Request/Response**: Same as `/auth/register.php`

### Client Endpoints

#### `/api/client/bookings.php`
- **Method**: GET
- **Purpose**: Get bookings for the authenticated client
- **Request**: JWT token in Authorization header, optional query parameters:
  - `limit`: Maximum number of bookings to return
  - `offset`: Pagination offset
- **Response**:
  ```json
  {
    "success": true,
    "message": "Bookings retrieved successfully",
    "data": [
      {
        "id": 1,
        "yacht_id": 5,
        "yacht_name": "Ocean Breeze",
        "start_date": "2025-06-15",
        "end_date": "2025-06-22",
        "status": "confirmed",
        "total_price": "15000.00",
        "user_role": "charterer",
        "documents": [
          {
            "id": 12,
            "name": "Booking Contract",
            "url": "https://storage.example.com/documents/12345.pdf",
            "visibility": "all"
          }
        ]
      }
    ],
    "total": 5,
    "limit": 10,
    "offset": 0
  }
  ```

### Admin Endpoints

#### `/api/admin/direct-customers.php`
- **Methods**: GET, POST, PUT, DELETE
- **Purpose**: CRUD operations for customer management
- **Access**: Admin only
- **GET Request**: JWT token in Authorization header, optional query parameters:
  - `id`: Get a specific customer by ID
  - `limit`: Maximum number of customers to return
  - `offset`: Pagination offset
  - `search`: Search term for filtering customers
- **GET Response**:
  ```json
  {
    "success": true,
    "message": "Customers retrieved successfully",
    "data": [
      {
        "id": 1,
        "email": "customer@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "phoneNumber": "123-456-7890",
        "company": "Example Corp",
        "country": "Netherlands",
        "address": "123 Main St, Amsterdam",
        "notes": "VIP customer",
        "created_at": "2025-01-15 12:30:45"
      }
    ],
    "total": 50,
    "limit": 10,
    "offset": 0
  }
  ```

#### `/api/admin/direct-bookings.php`
- **Method**: GET, POST, PUT, DELETE
- **Purpose**: CRUD operations for booking management
- **Access**: Admin only
- **GET Request**: JWT token in Authorization header, optional query parameters:
  - `id`: Get a specific booking by ID
  - `customer_id`: Filter bookings for a specific customer
  - `limit`: Maximum number of bookings to return
  - `offset`: Pagination offset
- **GET Response**:
  ```json
  {
    "success": true,
    "message": "Bookings retrieved successfully",
    "data": [
      {
        "id": 1,
        "yacht_id": 5,
        "yacht_name": "Ocean Breeze",
        "start_date": "2025-06-15",
        "end_date": "2025-06-22",
        "status": "confirmed",
        "total_price": "15000.00",
        "main_charterer_id": 123,
        "main_charterer_name": "John Doe",
        "guests": [
          {
            "id": 124,
            "name": "Jane Smith"
          }
        ],
        "documents": [
          {
            "id": 12,
            "name": "Booking Contract",
            "url": "https://storage.example.com/documents/12345.pdf",
            "visibility": "all"
          }
        ]
      }
    ],
    "total": 25,
    "limit": 10,
    "offset": 0
  }
  ```

#### `/api/admin/generate-invitation.php`
- **Method**: POST
- **Purpose**: Generate an invitation link for a client
- **Request**:
  ```json
  {
    "clientId": "123",
    "force": false
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Invitation generated successfully",
    "invitation_id": 456,
    "invitation_url": "https://charter-hub.vercel.app/register?token=abc123xyz",
    "expires_at": "2025-05-22T12:00:00Z",
    "is_new": true
  }
  ```

### Invitation System Endpoints

#### `/auth/check-invitation.php`
- **Method**: GET
- **Purpose**: Validate an invitation token
- **Request**: Query parameter `token`
- **Response**:
  ```json
  {
    "success": true,
    "valid": true,
    "message": "Invitation is valid",
    "customer": {
      "id": 123,
      "email": "client@example.com"
    },
    "invitation": {
      "id": 456,
      "expires_at": "2025-04-25"
    }
  }
  ```

#### `/auth/light-check-invitation.php`
- **Method**: GET
- **Purpose**: Lightweight token validation (fallback)
- **Request**: Query parameter `token`
- **Response**:
  ```json
  {
    "success": true,
    "valid": true,
    "message": "Invitation is valid",
    "used": false
  }
  ```

#### `/auth/probe-invitation.php`
- **Method**: GET
- **Purpose**: Ultra-lightweight token validation (second fallback)
- **Request**: Query parameter `token`
- **Response**:
  ```json
  {
    "success": true,
    "tokenExists": true,
    "message": "Token exists in the system"
  }
  ```

### Data Endpoints

#### `/api/yachts.php`
- **Method**: GET
- **Purpose**: Retrieve yacht information
- **Request**: Optional query parameter `id` for specific yacht
- **Response**:
  ```json
  {
    "success": true,
    "message": "Yachts retrieved successfully",
    "data": [
      {
        "id": 1,
        "name": "Ocean Breeze",
        "description": "Luxury yacht with 5 cabins",
        "capacity": 10,
        "length": "35m",
        "crew": 5,
        "base_price": "15000.00",
        "featured_image": "https://example.com/images/yacht1.jpg"
      }
    ]
  }
  ```

#### `/api/destinations.php`
- **Method**: GET
- **Purpose**: Retrieve destination information
- **Request**: Optional query parameter `id` for specific destination
- **Response**:
  ```json
  {
    "success": true,
    "message": "Destinations retrieved successfully",
    "data": [
      {
        "id": 1,
        "name": "Mediterranean",
        "description": "Crystal clear waters and historic coastal cities",
        "regions": ["French Riviera", "Amalfi Coast", "Greek Islands"],
        "highlights": ["Stunning beaches", "World-class cuisine"],
        "best_time_to_visit": "May to October",
        "featured_image": "https://example.com/images/med.jpg"
      }
    ]
  }
  ```

## 4. Authentication System

### JWT Authentication Flow

CharterHub implements a dual-token authentication system:

1. **Access Token**:
   - Short-lived JWT token (30 minutes)
   - Stored in browser storage (localStorage or sessionStorage based on "Remember Me")
   - Used for all API requests in the Authorization header

2. **Refresh Token**:
   - Long-lived token (14 days)
   - Stored as HTTP-only cookie
   - Used to obtain new access tokens when the current one expires

### Token Storage Strategy

| Token Type | Storage Location | Expiration | Purpose |
|------------|------------------|------------|---------|
| Access Token | Browser storage (localStorage/sessionStorage) | 30 minutes | API authorization |
| Refresh Token | HTTP-only cookie | 14 days | Token refresh |
| User Data | Browser storage (same as access token) | Same as access token | UI personalization |

### Authentication Flow

#### Login Process

1. User submits credentials (email, password, rememberMe)
2. Backend validates credentials against database
3. If valid:
   - Generate JWT access token with claims (user ID, role, expiry)
   - Generate refresh token and store in database
   - Set refresh token as HTTP-only cookie
   - Return access token and user data to frontend
4. Frontend stores access token and user data in browser storage based on "Remember Me" setting
5. User is redirected to appropriate dashboard based on role

#### Token Refresh Process

1. When making API request, frontend checks if access token is expired
2. If expired:
   - Call `/auth/refresh-token.php` endpoint (refresh token is sent automatically as HTTP-only cookie)
   - Receive new access token 
   - Update storage with new token
   - Proceed with original API request
3. If refresh fails, user is logged out and redirected to login page

#### Logout Process

1. Frontend immediately clears all local storage (for instant UI feedback)
2. Backend API call to `/auth/logout.php` (with 5-second timeout for responsiveness)
3. Backend adds current token to blacklist table
4. Backend clears refresh token cookie
5. User is redirected to login page

### JWT Token Structure

Access tokens contain these claims:

```json
{
  "iss": "charterhub-api",      // Issuer
  "sub": "123",                 // Subject (user ID)
  "role": "client",             // User role
  "email": "user@example.com",  // User email
  "jti": "unique-token-id",     // JWT ID (for blacklisting)
  "ver": 1,                     // Token version for invalidation
  "iat": 1615582261,            // Issued at timestamp
  "exp": 1615584061             // Expiration timestamp
}
```

### Known Authentication Issues & Workarounds

1. **User Data Storage Issues**:
   - **Symptom**: User data occasionally showing as "User 504" instead of proper name
   - **Cause**: User data not being properly synchronized between storage types
   - **Mitigation**: Enhanced `syncStorageData` function with better fallbacks and data completeness scoring

2. **Slow Logout**:
   - **Symptom**: UI appears unresponsive for several seconds during logout
   - **Cause**: Waiting for server API call to complete before updating UI
   - **Mitigation**: Immediate local storage cleanup with 5-second timeout for server API call

3. **Request Cancellation During Navigation**:
   - **Symptom**: Many "canceled" API requests in console during page navigation
   - **Cause**: React component unmounting before API requests complete
   - **Mitigation**: Added proper AbortController usage and error handling for request cancellations

## 5. Frontend Architecture

### Technology Stack

- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Context API with reducers
- **Routing**: React Router v6
- **API Communication**: Axios with interceptors

### Key Components

1. **Authentication**:
   - `JWTAuthContext`: Central authentication state manager
   - `TokenService`: Centralized token handling across the application
   - `ProtectedRoute`: Guards routes based on authentication and user role

2. **Layout Components**:
   - `ClientLayout`: Layout wrapper for client portal
   - `AdminLayout`: Layout wrapper for admin portal
   - `ErrorBoundary`: Catches and handles component errors

3. **Client Portal Components**:
   - `Dashboard`: Client home page with summary information
   - `Profile`: User profile management
   - `Bookings`: Booking listing and details
   - `Destinations`: Destination information and browsing

4. **Admin Portal Components**:
   - `AdminDashboard`: Admin overview with key metrics
   - `CustomerManagement`: Customer viewing and editing
   - `BookingManagement`: Booking creation and management
   - `YachtManagement`: Yacht information management

### Authentication Components

1. **JWTAuthContext**: 
   - Central authentication state manager
   - Provides authentication methods:
     - login
     - logout
     - register
     - refreshUserData
     - updateProfile
     - forgotPassword
     - resetPassword
     - changePassword
     - verifyEmail
   - Tracks loading and error states

2. **TokenService**:
   - Centralizes token access across different parts of the application
   - Provides consistent methods for token retrieval and validation
   - Handles storage type selection based on "Remember Me" preferences
   - Prevents authentication errors from "null" tokens
   - Synchronizes user data between storage types

3. **ProtectedRoute**:
   - Guards routes based on authentication state
   - Redirects unauthenticated users to login
   - Validates user roles for access control
   - Handles role-based routing (admin vs client)

## 6. Security and Data Protection

### Authentication Security Features

1. **JWT Token Security**:
   - Short-lived access tokens (30 minutes)
   - HTTP-only cookies for refresh tokens
   - Token blacklisting for revocation
   - Token version tracking for mass invalidation
   
2. **Password Security**:
   - Password hashing with bcrypt
   - Minimum password strength requirements
   - Secure password reset flow

3. **CORS Protection**:
   - Strict origin validation
   - Proper credentials handling
   - Preflight request support

4. **Data Protection**:
   - Input validation and sanitization
   - Error handling without leaking sensitive info
   - Secure transmission over HTTPS
   - Minimal privilege principle

### Invitation System Security

1. **Token Security**:
   - Single-use invitation tokens
   - Expiration timestamps
   - Required customer ID association
   - Multi-layered validation

2. **Implementation Features**:
   - Multiple validation layers to prevent invitation reuse
   - Proper server-side token checking
   - Client-side protection against reusing tokens
   - Enhanced CORS headers for secure cross-origin communication

### Personal Data Handling

The application stores the following personal information:

1. **User Account Data**:
   - Email address
   - First and last name
   - Phone number (optional)
   - Company name (optional)
   - Country (optional)
   - Address (optional)

2. **Security Storage Approach**:
   - Sensitive authentication data (refresh tokens) stored ONLY in HTTP-only cookies
   - User display data (name, email) stored in browser storage for UI rendering
   - No storage of payment information or other highly sensitive PII

## 7. Deployment Process

### Vercel Frontend Deployment

The frontend is deployed on Vercel with the following configuration:

1. **Build Settings**:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Node.js Version: 18.x

2. **Environment Variables**:
   - All sensitive configuration is stored in Vercel's environment variables
   - Production, preview, and development environments have separate configurations

3. **Deployment Process**:
   - Automatic deployment triggered by pushes to the `main` branch
   - Pull request previews deployed automatically
   - Production deployments require manual promotion from preview

### Render Backend Deployment

The backend API is deployed on Render with:

1. **Service Type**: Web Service
2. **Environment**: PHP 8.1
3. **Build Command**: `composer install`
4. **Start Command**: `php -S 0.0.0.0:8080 -t public`

## 8. Known Issues and Workarounds

### Frontend Issues

1. **User Profile Incomplete Display**:
   - **Issue**: Occasionally shows "User 504" instead of actual name
   - **Workaround**: Added improved user data synchronization and storage
   - **Fixed In**: Latest version

2. **Navigation Error Screens**:
   - **Issue**: "Something went wrong" error screens during navigation
   - **Workaround**: Enhanced error boundary to ignore React navigation errors (Error #300, #310)
   - **Fixed In**: Latest version

3. **Slow Logout**:
   - **Issue**: Logout appears unresponsive for several seconds
   - **Workaround**: Immediate local cleanup with timeout for server API call
   - **Fixed In**: Latest version

### Backend Issues

1. **API Timeout on Large Data Sets**:
   - **Issue**: Booking listing API times out with large number of records
   - **Workaround**: Always use pagination parameters (`limit` and `offset`)
   - **Status**: Ongoing

2. **CORS Error with Certain Mobile Browsers**:
   - **Issue**: Safari on iOS occasionally rejects CORS preflight
   - **Workaround**: Added preflight cache headers and improved OPTIONS handling
   - **Fixed In**: Latest version

## 9. Maintenance Procedures

### Regular Maintenance Tasks

1. **Database Cleanup**:
   - Expired token cleanup: Weekly
   - Unused invitation cleanup: Monthly
   - Log rotation: Daily

2. **Monitoring**:
   - API error rate monitoring
   - Authentication failure monitoring
   - Performance metrics tracking

### Emergency Procedures

1. **Mass Token Invalidation**:
   - In case of security breach, increment `token_version` in user table
   - All existing tokens will be invalidated

2. **API Service Disruption**:
   - Frontend has graceful degradation for API unavailability
   - Error messages guide users on next steps

### Contact Information

For urgent issues with the live application:

- **Primary Contact**: [support@example.com](mailto:support@example.com)
- **Emergency Line**: +1-234-567-8900 