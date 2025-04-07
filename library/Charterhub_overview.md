# CharterHub API and Database Documentation

## 1. System Overview

CharterHub is a booking and client management system with separate client and admin interfaces. The system utilizes a JWT-based authentication framework for secure access management with role-based permissions.

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

### Key Components:

1. **Client Portal**:
   - User profile management
   - Document management (passports, etc.)
   - Booking management

2. **Admin Portal**:
   - Client management
   - Admin user management
   - Document management
   - Booking management
   - Invitation management
   - System settings

3. **API Services**:
   - Authentication endpoints (`/auth/*`)
   - Admin management endpoints (`/api/admin/*`)
   - Client data endpoints (`/api/client/*`)
   - Document management endpoints
   - Booking management endpoints
   - Invitation management endpoints

4. **Database**:
   - MySQL database (charterhub_local)
   - Custom CharterHub tables

### Development Environment Setup

The CharterHub system uses a dual-server architecture in development:

1. **PHP Backend Server (Port 8000)**:
   - Handles all API requests
   - Implements authentication logic
   - Manages database interactions
   - Provides CORS support for local development

2. **Vite Frontend Server (Port 3000-3005)**:
   - Serves React-based frontend
   - Hot module replacement for development
   - Proxies API requests to backend server

A unified server script (`enhanced-unified-server.sh`) is available to start both servers with a single command.

## 2. API Documentation

### API Categories Overview

| Category | Purpose | Status | Key Endpoints |
|----------|---------|--------|--------------|
| 🔐 Authentication | User login/logout and session management | Implemented | `/auth/login.php`, `/auth/logout.php`, `/auth/refresh-token.php` |
| 👤 User Management | Profile updates and user registration | Implemented | `/auth/update-profile.php`, `/auth/register.php`, `/auth/me.php` |
| 👑 Admin Operations | Admin-specific endpoints | Implemented | `/api/admin/direct-admin-users.php`, `/api/admin/direct-customers.php`, `/api/admin/direct-bookings.php` |
| 📄 Document Management | Upload and manage documents | Planned | `/api/documents`, `/api/documents/:id` |
| 📅 Booking Management | Create and manage bookings | Implemented | `/api/admin/direct-bookings.php`, `/api/client/bookings.php` |
| 🛥️ Yacht Information | Retrieve yacht data | Implemented | `/api/yachts.php` |
| 🌍 Destination Information | Retrieve destination data | Implemented | `/api/destinations.php` |
| 🌐 Invitation Management | Manage client invitation links | Implemented | `/api/admin/check-invitation-status.php`, `/api/admin/generate-invitation.php`, `/backend/auth/check-invitation.php`, `/backend/auth/light-check-invitation.php`, `/backend/auth/probe-invitation.php` |
| ⚙️ Settings | System configuration | Planned | `/api/settings` |

### Key API Features

1. **Enhanced Booking Management**:
   - The `/api/admin/direct-bookings.php` endpoint provides comprehensive booking retrieval with proper CORS support
   - The `/api/client/bookings.php` endpoint allows clients to view their own bookings (as main charterer or guest)
   - Detailed guest information and yacht data included in responses
   - Filtering capabilities by customer ID
   - Optimized for admin booking management and customer detail views
   - Role-based document visibility for main charterers vs guests

2. **Secure Invitation System**:
   - Multi-layered invitation validation with robust fallback mechanisms:
     - Primary endpoint: `/auth/check-invitation.php` (full validation)
     - Secondary endpoint: `/auth/light-check-invitation.php` (lightweight validation)
     - Tertiary endpoint: `/auth/probe-invitation.php` (minimal token existence check)
   - Status tracking of invitation tokens (active, expired, used)
   - Pre-filling of customer data during registration
   - Development mode fallbacks for testing without database dependencies
   - Security measures to prevent token reuse
   - CORS protection for secure cross-origin requests
   - Required customer_id association for validity verification

### 🔐 Authentication APIs

These endpoints handle user authentication and session management.

#### `/auth/login.php`
- **Method**: POST
- **Purpose**: Authenticate user and create session
- **Request**: 
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword",
    "rememberMe": true
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
- **Used in**: Login screens (client & admin)

#### `/auth/admin-login.php`
- **Method**: POST
- **Purpose**: Authenticate admin users specifically
- **Request/Response**: Same as `/auth/login.php` but enforces admin role
- **Used in**: Admin login screen

#### `/auth/client-login.php`
- **Method**: POST
- **Purpose**: Authenticate client users specifically
- **Request/Response**: Same as `/auth/login.php` but enforces client role
- **Used in**: Client login screen

#### `/auth/logout.php`
- **Method**: POST
- **Purpose**: End user session
- **Request**: Requires JWT token in Authorization header
- **Response**: 
  ```json
  {
    "success": true
  }
  ```
- **Used in**: Logout actions

#### `/auth/refresh-token.php`
- **Method**: POST
- **Purpose**: Refresh expired access token
- **Request**: No body needed as refresh token is in HTTP-only cookie
- **Response**: 
  ```json
  {
    "success": true,
    "token": "new-jwt-token-here",
    "refreshToken": "new-refresh-token-here"
  }
  ```
- **Used in**: Automatic background refresh

#### `/auth/me.php`
- **Method**: GET
- **Purpose**: Get current user profile
- **Request**: Authentication header required
- **Response**: 
  ```json
  {
    "success": true,
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "client"
    }
  }
  ```
- **Used in**: Profile pages, dashboard initialization

### 👤 User Management APIs

These endpoints handle user profile management and registration.

#### `/auth/update-profile.php`
- **Method**: POST
- **Purpose**: Update user profile information
- **Request**: 
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "123-456-7890"
  }
  ```
- **Response**: 
  ```json
  {
    "success": true,
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phoneNumber": "123-456-7890",
      "role": "client"
    }
  }
  ```
- **Used in**: Profile pages

#### `/auth/register.php`
- **Method**: POST
- **Purpose**: Create new user
- **Request**: 
  ```json
  {
    "email": "newuser@example.com",
    "password": "securepassword",
    "firstName": "Jane",
    "lastName": "Smith"
  }
  ```
- **Response**: 
  ```json
  {
    "success": true,
    "user": {
      "id": 2,
      "email": "newuser@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "role": "client"
    }
  }
  ```
- **Used in**: Registration page

#### `/auth/change-password.php`
- **Method**: POST
- **Purpose**: Change user password
- **Request**: 
  ```json
  {
    "currentPassword": "oldpassword",
    "newPassword": "newpassword"
  }
  ```
- **Response**: 
  ```json
  {
    "success": true
  }
  ```
- **Used in**: Profile settings

#### `/auth/request-password-reset.php` & `/auth/reset-password.php`
- **Methods**: POST
- **Purpose**: Password reset flow
- **Used in**: Forgot password page, Password reset page

### 👑 Admin Operations APIs

These endpoints are specifically for admin functions.

#### `/api/admin/direct-admin-users.php`
- **Methods**: GET, POST, PUT, DELETE
- **Purpose**: Manage admin users
- **Access**: Admin only
- **Features**:
  - Create, read, update, and delete admin users
  - Secure password handling
  - Role validation
  - Proper error handling

#### `/api/admin/direct-customers.php`
- **Methods**: GET, POST, PUT, DELETE
- **Purpose**: Manage client users (customers)
- **Access**: Admin only
- **Features**:
  - Create, read, update, and delete customers
  - Reliable ID-based lookups for consistent data access
  - Single customer retrieval by ID parameter
  - Proper display name handling for UI consistency
  - Comprehensive CORS handling for development
  - Support for updating specific fields including customer notes

**Notes Update Example**:
```json
// POST Request to /api/admin/direct-customers.php
{
  "id": "123",
  "notes": "Customer prefers communication via email only. Interested in Mediterranean charters."
}

// Response
{
  "success": true,
  "message": "Customer updated successfully",
  "customer": {
    "id": 123,
    "email": "customer@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "notes": "Customer prefers communication via email only. Interested in Mediterranean charters.",
    // Other customer fields...
  }
}
```

#### `/api/admin/direct-bookings.php`
- **Method**: GET
- **Purpose**: Retrieve all bookings or bookings for a specific customer (admin view)
- **Access**: Admin only
- **Features**:
  - Comprehensive booking data retrieval including guest information
  - Filtering support via `customer_id` query parameter
  - Proper CORS headers for cross-origin development
  - Enhanced error detection and reporting
  - Complete yacht and charterer information in response

#### `/api/client/bookings.php`
- **Method**: GET
- **Purpose**: Retrieve bookings for the currently authenticated client
- **Access**: Client only
- **Features**:
  - Returns bookings where the client is either the main charterer or a guest
  - Document visibility filtering based on client role
  - Includes user role (charterer/guest) to inform UI display
  - JWT authentication required
  - Secure access controls ensure clients only see their own bookings
  - Global CORS headers for consistent cross-origin support

### 🌐 Invitation Management APIs

These endpoints handle customer invitations and registrations.

#### `/api/admin/check-invitation-status.php`
- **Method**: GET
- **Purpose**: Check if a client has active invitations
- **Access**: Admin only
- **Request**: Query parameter `client_id`
- **Response**:
  ```json
  {
    "success": true,
    "client_id": "123",
    "email": "client@example.com",
    "has_invitations": true,
    "has_active_invitation": true,
    "message": "Invitations found for this client",
    "invitations": [
      {
        "id": "123",
        "token": "abc123xyz",
        "created_at": "2023-03-15T12:00:00Z",
        "expires_at": "2023-03-22T12:00:00Z",
        "is_expired": false,
        "is_used": false,
        "status": "active"
      }
    ]
  }
  ```
- **Used in**: Customer details page to show invitation status

#### `/api/admin/generate-invitation.php`
- **Method**: POST
- **Purpose**: Generate a new invitation link for a client
- **Access**: Admin only
- **Request**:
  ```json
  {
    "clientId": "123",
    "force": false
  }
  ```
- **Process**: Creates a new invitation record with the client's ID as `customer_id`, email, and a unique token.
- **Response**:
  ```json
  {
    "success": true,
    "message": "Invitation generated successfully",
    "invitation_id": 456,
    "invitation_url": "http://localhost:3000/register?token=abc123xyz",
    "expires_at": "2023-05-22T12:00:00Z",
    "is_new": true
  }
  ```
- **Used in**: Customer management to create invitation links

#### `/auth/check-invitation.php`
- **Method**: GET
- **Purpose**: Validate an invitation token for registration
- **Access**: Public
- **Request Parameters**:
  - `token` (required): The invitation token from the URL
  - `fallback` (optional): Set to 'true' for development testing without DB
- **Validation**: Checks token existence, expiration, previous usage, and required `customer_id` association
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
- **Used in**: Registration page when accessed via invitation link

#### `/auth/light-check-invitation.php`
- **Method**: GET
- **Purpose**: Lightweight validation of an invitation token (fallback when main endpoint fails)
- **Access**: Public
- **Request Parameters**:
  - `token` (required): The invitation token from the URL
- **Features**:
  - Minimal database queries for better performance
  - No credential requirements for CORS flexibility
  - Proper CORS headers for cross-origin access
  - Optimized error handling for failures
- **Response**: 
  ```json
  {
    "success": true,
    "valid": true,
    "message": "Invitation is valid",
    "used": false
  }
  ```
- **Used in**: Registration page as a fallback when the main endpoint fails

#### `/auth/probe-invitation.php`
- **Method**: GET
- **Purpose**: Ultra-lightweight token probe (minimal validation without full DB operations)
- **Access**: Public
- **Request Parameters**:
  - `token` (required): The invitation token from the URL
- **Features**:
  - Minimal database interaction (only checks token existence)
  - No credential requirements for maximum compatibility
  - Enhanced CORS headers with preflight support
  - Support for OPTIONS requests
  - Fastest response time with minimal processing
- **Response**: 
  ```json
  {
    "success": true,
    "tokenExists": true,
    "message": "Token exists in the system"
  }
  ```
- **Used in**: Registration page as a secondary fallback when both main endpoints fail

### 🛥️ Yacht Information APIs

These endpoints provide access to yacht data.

#### `/api/yachts.php`
- **Method**: GET
- **Purpose**: Retrieve all yachts or a specific yacht by ID
- **Access**: Public
- **Parameters**:
  - `id` (optional): If specified, returns a single yacht by ID
- **Response**:
  ```json
  {
    "success": true,
    "message": "Yachts retrieved successfully",
    "data": [
      {
        "id": 1,
        "name": "Ocean Breeze",
        "description": "Luxury yacht with 5 cabins and modern amenities.",
        "capacity": 10,
        "length": "35m",
        "crew": 5,
        "base_price": "15000.00",
        "featured_image": "https://images.unsplash.com/photo-1605281317010-fe5ffe798166?w=800&q=80",
        "created_at": "2025-04-01 12:05:18",
        "updated_at": "2025-04-01 12:05:18"
      },
      // More yachts...
    ]
  }
  ```
- **Used in**: Yacht listings, yacht details pages, booking form

### 🌍 Destination Information APIs

These endpoints provide access to destination data.

#### `/api/destinations.php`
- **Method**: GET
- **Purpose**: Retrieve all destinations or a specific destination by ID
- **Access**: Public
- **Parameters**:
  - `id` (optional): If specified, returns a single destination by ID
- **Response**:
  ```json
  {
    "success": true,
    "message": "Destinations retrieved successfully",
    "data": [
      {
        "id": 1,
        "name": "Mediterranean",
        "description": "Crystal clear waters and historic coastal cities make the Mediterranean a paradise for yacht enthusiasts.",
        "regions": ["French Riviera", "Amalfi Coast", "Greek Islands", "Balearic Islands"],
        "highlights": ["Stunning beaches", "World-class cuisine", "Historic sites", "Vibrant nightlife"],
        "best_time_to_visit": "May to October",
        "climate": "Mediterranean climate with hot, dry summers and mild, wet winters",
        "featured_image": "https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=800&q=80",
        "created_at": "2025-04-01 12:30:40",
        "updated_at": "2025-04-01 12:30:40"
      },
      // More destinations...
    ]
  }
  ```
- **Used in**: Destination listings, destination details pages, booking form

## 3. Database Documentation

### Database Schema Overview

| Table | Purpose | Status | Key Relationships |
|-------|---------|--------|------------------|
| 👤 wp_charterhub_users | Store user information | Implemented | Documents, Bookings |
| 📄 wp_charterhub_documents | Store document metadata | Planned | Users, Bookings |
| 📅 wp_charterhub_bookings | Store booking information | Implemented | Users, Documents |
| 📅 wp_charterhub_booking_guests | Store booking guest relations | Implemented | Bookings, Users |
| 🛥️ wp_charterhub_yachts | Store yacht information | Implemented | Bookings |
| 🔗 wp_charterhub_invitations | Store invitation links and status | Implemented | Users |
| 🔒 wp_charterhub_token_blacklist | Store revoked tokens | Implemented | None |
| 🔐 wp_charterhub_refresh_tokens | Store refresh tokens | Implemented | Users |
| 🔑 wp_charterhub_password_reset_tokens | Store password reset tokens | Implemented | Users |

### 👤 User Tables

#### wp_charterhub_users

This table stores all users in the system (both clients and admins).

| Column | Type | Purpose | Required |
|--------|------|---------|----------|
| id | INT | Primary key | ✅ |
| email | VARCHAR(255) | User's email address | ✅ |
| password | VARCHAR(255) | Hashed password | ✅ |
| first_name | VARCHAR(100) | User's first name | ✅ |
| last_name | VARCHAR(100) | User's last name | ✅ |
| display_name | VARCHAR(255) | User's display name | ✅ |
| role | VARCHAR(50) | User role ('admin' or 'client') | ✅ |
| phone_number | VARCHAR(50) | User's phone number | ❌ |
| company | VARCHAR(255) | User's company | ❌ |
| country | VARCHAR(100) | User's country | ❌ |
| address | VARCHAR(255) | User's address | ❌ |
| notes | TEXT | Admin notes about client | ❌ |
| verified | TINYINT(1) | Whether user has verified email | ✅ |
| token_version | INT | Incremented for token invalidation | ✅ |
| created_at | TIMESTAMP | Record creation date | ✅ |
| updated_at | TIMESTAMP | Record last update | ✅ |

**Relationships**:
- **Has many**: Documents, Bookings, Invitations

### 🔒 Authentication Tables

#### wp_charterhub_token_blacklist

This table stores revoked JWT tokens to prevent their use after logout or password change.

| Column | Type | Purpose | Required |
|--------|------|---------|----------|
| id | INT | Primary key | ✅ |
| token_id | VARCHAR(255) | Unique identifier for the token (jti claim) | ✅ |
| expiry | TIMESTAMP | When the token expires | ✅ |
| created_at | TIMESTAMP | When the token was blacklisted | ✅ |

#### wp_charterhub_refresh_tokens

This table stores refresh tokens for the JWT authentication system.

| Column | Type | Purpose | Required |
|--------|------|---------|----------|
| id | INT | Primary key | ✅ |
| user_id | INT | Associated user | ✅ |
| token | VARCHAR(255) | Hashed refresh token | ✅ |
| expiry | TIMESTAMP | Token expiration time | ✅ |
| created_at | TIMESTAMP | Token creation time | ✅ |

#### wp_charterhub_password_reset_tokens

This table stores password reset tokens.

| Column | Type | Purpose | Required |
|--------|------|---------|----------|
| id | INT | Primary key | ✅ |
| user_id | INT | Associated user | ✅ |
| token | VARCHAR(255) | Reset token (hashed) | ✅ |
| expiry | TIMESTAMP | Token expiration time | ✅ |
| used | TINYINT(1) | Whether token has been used | ✅ |
| created_at | TIMESTAMP | Token creation time | ✅ |

### 📅 Booking Tables

#### wp_charterhub_bookings

This table stores booking information.

| Column | Type | Purpose | Required |
|--------|------|---------|----------|
| id | INT | Primary key | ✅ |
| yacht_id | INT | Associated yacht | ✅ |
| start_date | DATE | Start date of booking | ✅ |
| end_date | DATE | End date of booking | ✅ |
| status | VARCHAR(50) | Booking status (confirmed, pending, cancelled) | ✅ |
| total_price | DECIMAL(10,2) | Total booking price | ✅ |
| main_charterer_id | INT | Primary customer for booking | ✅ |
| created_at | TIMESTAMP | Creation date | ✅ |
| updated_at | TIMESTAMP | Last update date | ✅ |

**Relationships**:
- **Belongs to**: Yacht (wp_charterhub_yachts)
- **Belongs to**: User (wp_charterhub_users) via main_charterer_id
- **Has many**: Booking guests (wp_charterhub_booking_guests)

#### wp_charterhub_booking_guests

This table links bookings with additional guest customers.

| Column | Type | Purpose | Required |
|--------|------|---------|----------|
| id | INT | Primary key | ✅ |
| booking_id | INT | Associated booking | ✅ |
| guest_id | INT | Customer ID of guest | ✅ |
| created_at | TIMESTAMP | Creation date | ✅ |

**Relationships**:
- **Belongs to**: Booking (wp_charterhub_bookings)
- **Belongs to**: User (wp_charterhub_users) via guest_id

#### wp_charterhub_yachts

This table stores yacht information.

| Column | Type | Purpose | Required |
|--------|------|---------|----------|
| id | INT | Primary key | ✅ |
| name | VARCHAR(255) | Yacht name | ✅ |
| description | TEXT | Yacht description | ❌ |
| capacity | INT | Number of people yacht can accommodate | ✅ |
| created_at | TIMESTAMP | Creation date | ✅ |
| updated_at | TIMESTAMP | Last update date | ✅ |

**Relationships**:
- **Has many**: Bookings (wp_charterhub_bookings)

### 🔗 Invitation Tables

#### wp_charterhub_invitations

This table stores invitation links for new clients.

| Column | Type | Purpose | Required |
|--------|------|---------|----------|
| id | INT | Primary key | ✅ |
| token | VARCHAR(255) | Unique invitation token | ✅ |
| email | VARCHAR(255) | Email associated with invitation | ✅ |
| customer_id | INT | Associated customer ID | ✅ |
| booking_id | INT | Associated booking (optional) | ❌ |
| used | TINYINT(1) | Whether invitation was used | ✅ |
| created_by | INT | Admin user who created invitation | ✅ |
| created_at | TIMESTAMP | Creation timestamp | ✅ |
| expires_at | TIMESTAMP | Expiration timestamp | ✅ |
| used_at | TIMESTAMP | When invitation was used | ❌ |

**Relationships**:
- **Created by**: User (admin)
- **Belongs to**: Customer (wp_charterhub_users) via customer_id

## 4. Authentication Flow & Token Management

### 🔒 JWT Authentication Architecture

The application uses JSON Web Tokens (JWT) for authentication, with a dual-token approach:

1. **Access Token**: Short-lived token (30 minutes) used for API authorization
2. **Refresh Token**: Longer-lived token (14 days) used to obtain new access tokens

### 🔑 Token Storage Strategy

| Token Type | Storage Location | Expiration | Purpose |
|------------|------------------|------------|---------|
| Access Token | Browser storage (localStorage or sessionStorage) | 30 minutes | API authorization |
| Refresh Token | HTTP-only cookie | 14 days | Token refresh |
| User Data | Browser storage (same as access token) | Same as access token | UI personalization |

- **Remember Me** functionality determines whether tokens are stored in:
  - `localStorage` (persistent across browser sessions)
  - `sessionStorage` (cleared when browser is closed)

### 🔄 Authentication Flow

#### Login Process

1. User submits credentials (email, password, rememberMe)
2. Backend validates credentials against database
3. If valid:
   - Generate JWT access token with claims (user ID, role, expiry)
   - Generate refresh token and store in database
   - Set refresh token as HTTP-only cookie
   - Return access token and user data to frontend
4. Frontend stores access token and user data in specified storage
5. User is redirected to appropriate dashboard based on role

#### Token Refresh Process

1. When making API request, frontend checks if access token is expired
2. If expired:
   - Call `/auth/refresh-token.php` with refresh token from HTTP cookie
   - Receive new access token and refresh token
   - Update storage with new token
   - Proceed with original API request
3. If refresh fails:
   - User is logged out and redirected to login page

#### Logout Process

1. Backend adds current token to blacklist
2. Backend clears refresh token cookie
3. Frontend clears all tokens from storage
4. User is redirected to login page

### 🔐 JWT Token Structure

#### Access Token Claims

```json
{
  "iss": "charterhub-api",      // Issuer
  "sub": "123",                 // Subject (user ID)
  "role": "admin",              // User role
  "email": "user@example.com",  // User email
  "jti": "unique-token-id",     // JWT ID (for blacklisting)
  "ver": 1,                    // Token version for invalidation
  "iat": 1615582261,            // Issued at timestamp
  "exp": 1615584061             // Expiration timestamp
}
```

#### Token Verification Process

1. Extract token from Authorization header (`Bearer <token>`)
2. Verify token signature using secret key
3. Check if token is expired
4. Check if token is in blacklist
5. Verify token version matches user's current token version
6. Extract user information from claims
7. Verify user exists and has appropriate role for requested resource

### 🆕 Token Service Architecture

The application now uses a centralized token service to ensure consistent token handling across different parts of the application:

1. **Token Service Layer**:
   - Provides a unified interface for getting and validating tokens
   - Handles token storage in localStorage or sessionStorage based on remember me preference
   - Includes token expiration validation
   - Prevents sending "null" tokens in authorization headers

2. **Token Synchronization**:
   - Ensures all components (JWT Auth Context, Booking Service, etc.) access tokens consistently
   - Maintains the security model while improving reliability
   - Reduces authentication errors due to token access issues

3. **Security Enhancements**:
   - Added detection and prevention of "null" token strings in authorization headers
   - Improved token validation with explicit null checks
   - Better error handling for authentication failures
   - Consistent credentials inclusion in requests with proper CORS handling

## 5. Frontend Architecture

### 🔐 Authentication Components

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
   - Handles token storage and refresh
   - Tracks loading and error states

2. **TokenService**:
   - Centralizes token access across different parts of the application
   - Provides consistent methods for token retrieval and validation
   - Handles storage type selection based on remember me preferences
   - Prevents authentication errors from "null" tokens

3. **ProtectedRoute**:
   - Guards routes based on authentication state
   - Redirects unauthenticated users to login
   - Validates user roles for access control
   - Handles role-based routing (admin vs client)
   - Provides fallback mechanisms when state is inconsistent

4. **Login Component**:
   - Handles user authentication
   - Supports remember me functionality
   - Implements error handling and validation
   - Direct URL-based navigation after successful login

5. **Register Component**:
   - New user registration
   - Password strength validation
   - Email verification process
   - Invitation link handling

### 📅 Booking System Architecture

The booking system implements a role-based design that connects clients with bookings in two different roles:

1. **Main Charterer**:
   - Primary customer associated with the booking
   - Has full access to all booking documents
   - Referenced by `main_charterer_id` in the `wp_charterhub_bookings` table
   - Can view all bookings where they are the main charterer

2. **Guest**:
   - Secondary customers associated with the booking
   - Has limited access to documents (only those with visibility='all')
   - Connected via the `wp_charterhub_booking_guests` junction table
   - Can view bookings where they are listed as a guest

#### Booking Access Flow:

1. Admin creates a booking:
   - Selects a main charterer (existing client or creates new one)
   - Optionally adds guests (other clients)
   - Sets document visibility permissions

2. Client views bookings:
   - `/api/client/bookings.php` endpoint automatically filters based on JWT token
   - Returns bookings where the client is either:
     - The main charterer (main_charterer_id = client_id)
     - A guest (has entry in wp_charterhub_booking_guests)
   - Ensures proper document visibility based on role

3. Data Retrieval Process:
   - Authentication: Client token is validated via JWT verification
   - Authorization: Only returns bookings for the authenticated user
   - Role Determination: Includes user role (charterer/guest) in the response
   - Document Access: Filters documents by visibility rules

4. Technical Implementation:
   - Backend: Uses combined SQL query with JOIN to fetch all relevant bookings
   - Frontend: Uses TokenService to ensure consistent authentication
   - Caching: Implements proper caching for performance optimization
   - Error Handling: Provides clear error messages for authentication issues

## 6. Security Measures

1. **JWT Token Security**:
   - Short-lived access tokens
   - HTTP-only cookies for refresh tokens
   - Token blacklisting for revocation
   - Token version tracking for mass invalidation
   
2. **Authentication Security**:
   - Password hashing with bcrypt
   - Email verification requirement
   - Rate limiting on login attempts
   - Secure password reset flow

3. **CORS Protection**:
   - Origin validation
   - Credentials handling
   - Preflight request support
   - Environment-specific configurations

4. **Data Protection**:
   - Input validation and sanitization
   - Error handling without leaking sensitive details
   - Secure transmission over HTTPS
   - Minimal privilege principle
   
5. **Invitation System Security**:
   - Single-use invitation tokens
   - Expiration timestamps
   - Required customer ID association
   - Multi-layered validation

- **Enhanced Security**: Improved security aspects of the invitation system:
  - Multiple layers of token validation to prevent invitation reuse
  - Proper server-side token checking with robust database queries
  - Client-side protection against reusing tokens marked as used
  - Enhanced CORS headers for secure cross-origin communication
  - Properly handling preflight requests for secured endpoints

- **Invitation Token Usage Fix**: Resolved an issue where invitation links were being marked as used prematurely:
  - Modified backend to only mark invitation tokens as used after successful registration completion
  - Updated `check-invitation.php` to perform validation without marking tokens as used
  - Enhanced `register.php` to explicitly mark the invitation as used during successful user registration
  - Added the `invitationToken` parameter to the registration data sent from frontend to backend
  - Implemented strict token format validation that accepts both 32 and 64 character tokens
  - Added detailed logging for invitation token usage and status changes
  - Improved security by implementing multiple checks to determine if an invitation has been used, including:
    - Boolean 'used' flag verification
    - 'used_at' timestamp presence check
    - Associated customer verification status validation
  - Fixed the frontend registration flow to correctly handle invitation token status and pass tokens to the backend

- **Backend Improvements**:
  - Created `light-check-invitation.php` as a lightweight fallback endpoint
  - Added `probe-invitation.php` for minimal token validation
  - Enhanced error handling in main invitation checking functionality
  - Fixed database query issues in invitation token validation
  - Improved CORS handling across all invitation-related endpoints
  - Added comprehensive support for OPTIONS preflight requests

## 7. Recent Updates

### March 2025 Updates

#### Customer Profile Enhancement
- **Added Country and Address Fields**:
  - Updated the database schema to add `country` and `address` fields to the `wp_charterhub_users` table
  - Added country and address fields to the Customer Details view in the admin interface
  - Enhanced API endpoints (both `direct-customers.php` and `save.php`) to handle the new fields
  - Made the phone field optional for new customer creation to improve usability
  - Fixed SQL query inconsistencies in customer creation process
  - Ensured proper data synchronization between database and UI for these fields

- **Backend Reliability Improvements**:
  - Fixed issues with column count in SQL queries for customer creation
  - Improved error handling and reporting for customer-related operations
  - Enhanced form validation to avoid unnecessary required fields
  - Standardized data flow for all customer fields including the new country and address

#### Invitation System Robustness Enhancements
- **Multi-layered Invitation Status Checking**: Implemented a robust fallback system with multiple layers of verification:
  - Main endpoint with credentials as primary check
  - Main endpoint without credentials as first fallback
  - Lightweight probe endpoint as second fallback
  - Client-side localStorage tracking as final fallback
  - Enhanced error handling for all verification methods

- **Client-side Token Tracking**: Added comprehensive client-side tracking of invitation tokens:
  - Recording valid tokens in localStorage when detected
  - Tracking used tokens with timestamps and metadata
  - Marking tokens as used locally to prevent client-side reuse
  - Storing token validation attempts with detailed success/failure data
  - Improved debugging and logging for token validation process

- **Improved Error Resilience**: Enhanced the system's ability to handle various error conditions:
  - Properly handling 500 Internal Server Errors from main endpoints
  - Graceful degradation when database connectivity issues occur
  - CORS error handling with automatic retry without credentials
  - Better UX during validation failures with smooth transitions
  - Detailed client-side logging for troubleshooting

- **Enhanced Security**: Improved security aspects of the invitation system:
  - Multiple layers of token validation to prevent invitation reuse
  - Proper server-side token checking with robust database queries
  - Client-side protection against reusing tokens marked as used
  - Enhanced CORS headers for secure cross-origin communication
  - Properly handling preflight requests for secured endpoints

- **Invitation Token Usage Fix**: Resolved an issue where invitation links were being marked as used prematurely:
  - Modified backend to only mark invitation tokens as used after successful registration completion
  - Updated `check-invitation.php` to perform validation without marking tokens as used
  - Enhanced `register.php` to explicitly mark the invitation as used during successful user registration
  - Added the `invitationToken` parameter to the registration data sent from frontend to backend
  - Implemented strict token format validation that accepts both 32 and 64 character tokens
  - Added detailed logging for invitation token usage and status changes
  - Improved security by implementing multiple checks to determine if an invitation has been used, including:
    - Boolean 'used' flag verification
    - 'used_at' timestamp presence check
    - Associated customer verification status validation
  - Fixed the frontend registration flow to correctly handle invitation token status and pass tokens to the backend

- **Backend Improvements**:
  - Created `light-check-invitation.php` as a lightweight fallback endpoint
  - Added `probe-invitation.php` for minimal token validation
  - Enhanced error handling in main invitation checking functionality
  - Fixed database query issues in invitation token validation
  - Improved CORS handling across all invitation-related endpoints
  - Added comprehensive support for OPTIONS preflight requests

#### Database Schema Compatibility
- **Enhanced Database Compatibility**: Modified invitation checking to work with different database schemas:
  - Searching for users across multiple tables (`wp_charterhub_users` and `wp_users`)
  - Gracefully handling missing tables or columns
  - Implementing backward compatibility with different column names
  - Building minimal customer objects when full data isn't available

#### CORS Improvements
- **Global CORS System Implementation**:
  - Removed legacy CORS handling in favor of a unified global approach
  - Updated all API endpoints to use the global CORS system (`/auth/global-cors.php`)
  - Ensured consistent CORS headers across all API endpoints
  - Added support for modern headers including 'Pragma' and 'Expires'
  - Enhanced preflight request handling for improved browser compatibility
  - Fixed CORS issues with invitation verification

#### Testing and Verification
- **Improved Testing Process**:
  - Enhanced debugging output during the invitation validation process
  - Added clear indicators for valid/invalid/used tokens in the UI
  - Implemented smoothed UX for invitation status transitions
  - Created a reliable way to test the invitation system even with server issues

### March 2023 Updates

#### Invitation System Enhancements
- **Customer ID Requirement**: Fixed a critical bug in the invitation system where invitations weren't including the required `customer_id` field. This was causing newly created invitations to be marked as invalid. The system now properly includes the customer_id when generating new invitations.
- **Modified Invitation Generation**: Updated both `/api/admin/generate-invitation.php` and `/api/admin/direct-invitations.php` to include the customer_id field when creating new invitation records. This ensures that invitations are properly linked to specific customer accounts and can be validated during the registration process.
- **Enhanced Development Experience**: Improved the development mode fallback in `Register.tsx` to properly override invalid invitation statuses during testing and development.
- **More Robust Invitation Checking**: Added better handling of various error states in the invitation checking process to provide clearer feedback to users.
- **Fixed Validation Process**: Updated the invitation validation process to properly check for and validate the `customer_id` field, ensuring that invitations are correctly linked to customer records.

#### UI Improvements for Invitation Status
- Added clear visual indicators for invitation status (loading, valid, invalid, used)
- Improved error messages for better user experience
- Enhanced loading states during invitation verification
- Added more detailed error handling to help administrators troubleshoot invitation issues

#### Server and Development Environment
- Fixed CORS handling for cross-origin requests in development environment
- Improved error reporting in API responses
- Enhanced server startup script with better error handling and detection

#### How to Verify the Invitation System
To verify that the invitation system is working correctly:

1. **Admin View**: 
   - Log in as an admin
   - Navigate to a customer's details page
   - Click "Generate Invitation Link"
   - Verify that the link is created successfully
   - Check the database to confirm the `customer_id` field is set correctly

2. **Registration Process**:
   - Use the generated link in a private/incognito browser window
   - Verify that the invitation is recognized as valid
   - Complete the registration process
   - Confirm that the account is linked to the correct customer record

3. **Testing Used Invitations**:
   - After successful registration, try to use the same invitation link again
   - Verify that the system correctly identifies it as "already used"
   - Confirm that the appropriate error message is displayed

### April 2025 Updates

#### Invitation System Improvements
- **Admin-Created Account Fix**: Resolved a critical issue with invitation links for admin-created accounts:
  - Modified `check-invitation.php` to allow invitations for verified accounts
  - Removed the logic that incorrectly marked invitations as used when the associated account was already verified
  - This ensures that admin-created accounts (which are verified by default) can still use invitation links

- **ID-Based Invitation System**: Enhanced the invitation system to consistently use customer_id:
  - Updated `generate-invitation.php` to check existing invitations by customer_id instead of email
  - Modified `register.php` to properly validate and use the customer_id from invitation tokens
  - Improved `mark-invitation-used.php` to include better logging of customer_id associations
  - Updated frontend logic to prioritize customer_id over email when processing registrations
  - This prevents potential mismatches when emails change but IDs remain the same

- **Database Schema Cleanup**:
  - Removed unused `wp_charterhub_customers` table to simplify database structure
  - Updated code to use only `wp_charterhub_users` with fallback to `wp_users`
  - Removed references to legacy tables in authentication and invitation code
  - Made the database structure more consistent and easier to maintain

- **Invitation Token Processing**: Improved the handling of invitation tokens:
  - Added better validation of tokens in the registration process
  - Ensured tokens are properly checked before registration is processed
  - Added safeguards to prevent ID mismatches between invitations and registrations
  - Enhanced error handling and reporting for invitation token issues

- **Frontend Improvements**:
  - Added proper TypeScript interfaces for customer data
  - Improved error handling and reporting in the registration process
  - Enhanced debugging output for invitation token processing
  - Updated the UI to better handle different invitation states

#### Global CORS Implementation
- **Standardized CORS Handling**:
  - Implemented a single global CORS system across all endpoints
  - Removed legacy CORS handlers in favor of the global system
  - Ensured consistent headers and preflight handling across the application
  - Fixed issues with certain headers triggering preflight requests
  - Added support for all modern headers including 'Pragma' and 'Expires'
  - Improved CORS error handling and resilience

## 8. Questions for Future Development

To enhance this documentation and guide future development, information is needed on:

1. **Additional Database Tables**:
   - Are there specific WordPress tables you interact with that should be documented?
   - Do you plan to add any fields to the existing tables?

2. **API Expansion**:
   - Are there additional API endpoints planned?
   - Are there any rate limits or special security considerations to implement?

3. **Mailchimp Implementation Details**:
   - What specific Mailchimp features are priorities for integration?
   - Will bidirectional sync be required?

4. **Additional Integrations**:
   - Are there other third-party services to be integrated?
   - Are there specific API endpoints that need to be documented for these services?

5. **Future Feature Roadmap**:
   - What are the next major features planned?
   - Are there timeline considerations for implementation?

## 9. Recent Security Enhancements

### Authentication Role Validation

- **Enhanced Role-Based Login Security**:
  - Implemented strict role validation in the client login component to prevent admin users from accessing client areas
  - Updated the `Login.tsx` component with type-safe role checking to properly redirect users based on their roles
  - Added security measures to ensure admin users are forced to use the admin login page
  - Implemented role verification in both the `checkExistingToken` function and the `auth:loginSuccess` event handler
  - Enhanced error handling to provide clear feedback when users attempt to use the wrong login portal

- **Type-Safe Authentication Flow**:
  - Replaced string comparisons with more robust array-based role checking
  - Updated the conditional logic to use `['admin', 'administrator'].includes(userData.role.toString())` for better type safety and flexibility
  - Ensured proper handling of various role formats by using explicit type conversion with `.toString()`
  - Implemented fallback navigation mechanisms if React Router navigation fails
  - Added comprehensive logging to track authentication redirects and role validations

- **Security Benefits**:
  - Strict separation between admin and client login paths prevents access control issues
  - Immediate logout of admin users who attempt to use the client login portal
  - Clear error messaging guides users to the appropriate login interface
  - Consistent role checking throughout the authentication flow
  - Robust fallback mechanisms ensure users always reach the correct dashboard based on their role

These enhancements significantly improve the security posture of the application by enforcing proper separation of concerns between admin and client access, implementing type-safe role checking, and ensuring users can only access resources appropriate for their role. 

## Booking System Design

The booking system implements a role-based design that connects clients with bookings in two different roles:

1. **Main Charterer**:
   - Primary customer associated with the booking
   - Has full access to all booking documents
   - Referenced by `main_charterer_id` in the `wp_charterhub_bookings` table

2. **Guest**:
   - Secondary customers associated with the booking
   - Has limited access to documents (only those with visibility='all')
   - Connected via the `wp_charterhub_booking_guests` junction table

When an admin creates a booking, they can:
- Select an existing client as the main charterer or create a new client
- Add multiple existing clients as guests or create new guest clients
- Attach documents with appropriate visibility settings ("main_charterer" or "all")

The client-side booking display automatically filters documents based on the client's role:
- If the client is the main charterer, they see all documents
- If the client is a guest, they only see documents with "all" visibility 