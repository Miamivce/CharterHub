# CharterHub Custom Authentication System

## Current Implementation Status

### Core Authentication
- ✅ Implemented custom PHP-based authentication system with JWT
- ✅ Created secure token management with proper expiration
- ✅ Added CSRF protection for all authentication endpoints
- ✅ Implemented proper CORS configuration with allowed origins
- ✅ Added comprehensive rate limiting and brute force protection
- ✅ Created robust error handling with specific error types

### User Management
- ✅ Implemented secure user registration with validation
- ✅ Added email verification system with token management
- ✅ Created password reset flow with secure tokens
- ✅ Implemented user profile management
- ✅ Added invitation system for user onboarding
- ✅ Created role-based access control

### Security Features
- ✅ Secure password hashing with bcrypt
- ✅ Token-based authentication with JWT
- ✅ Refresh token rotation for extended sessions
- ✅ IP-based rate limiting
- ✅ Comprehensive security headers
- ✅ Secure session management

### Monitoring and Logging
- ✅ Comprehensive authentication logging
- ✅ Analytics tracking for auth events
- ✅ Error tracking and reporting
- ✅ Security event monitoring
- ✅ Performance metrics collection

## Database Schema

### Users Table
```sql
CREATE TABLE wp_users (
    ID bigint(20) NOT NULL AUTO_INCREMENT,
    user_login varchar(60) NOT NULL DEFAULT '',
    user_pass varchar(255) NOT NULL DEFAULT '',
    user_email varchar(100) NOT NULL DEFAULT '',
    user_registered datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    display_name varchar(250) NOT NULL DEFAULT '',
    first_name varchar(100) NOT NULL DEFAULT '',
    last_name varchar(100) NOT NULL DEFAULT '',
    phone_number varchar(20) DEFAULT NULL,
    company varchar(255) DEFAULT NULL,
    address text DEFAULT NULL,
    role varchar(20) NOT NULL DEFAULT 'charter_client',
    verified boolean DEFAULT FALSE,
    verification_token varchar(255) DEFAULT NULL,
    reset_password_token varchar(255) DEFAULT NULL,
    reset_password_expires datetime DEFAULT NULL,
    refresh_token varchar(255) DEFAULT NULL,
    last_login datetime DEFAULT NULL,
    last_ip varchar(45) DEFAULT NULL,
    last_user_agent varchar(255) DEFAULT NULL,
    metadata json DEFAULT NULL,
    PRIMARY KEY (ID),
    UNIQUE KEY user_login (user_login),
    UNIQUE KEY user_email (user_email),
    KEY role (role),
    KEY verified (verified)
);
```

### Auth Logs Table
```sql
CREATE TABLE wp_charterhub_auth_logs (
    id bigint(20) NOT NULL AUTO_INCREMENT,
    user_id bigint(20) DEFAULT NULL,
    action enum('login','signup','password_reset','verification','invitation','logout','token_refresh','profile_update') NOT NULL,
    status enum('success','failure') NOT NULL,
    ip_address varchar(45) NOT NULL,
    user_agent varchar(255) DEFAULT NULL,
    details json DEFAULT NULL,
    error_type varchar(50) DEFAULT NULL,
    error_message text DEFAULT NULL,
    created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY user_id (user_id),
    KEY action (action),
    KEY status (status),
    KEY created_at (created_at),
    KEY error_type (error_type),
    FOREIGN KEY (user_id) REFERENCES wp_users(ID) ON DELETE SET NULL
);
```

### Rate Limiting Table
```sql
CREATE TABLE wp_charterhub_rate_limits (
    id bigint(20) NOT NULL AUTO_INCREMENT,
    ip_address varchar(45) NOT NULL,
    action varchar(50) NOT NULL,
    attempts int NOT NULL DEFAULT 1,
    last_attempt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    locked_until datetime DEFAULT NULL,
    created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY ip_action (ip_address, action),
    KEY last_attempt (last_attempt),
    KEY locked_until (locked_until)
);
```

## Security Configuration

### Authentication Settings
```php
// Authentication configuration
$auth_config = [
    'jwt_secret' => getenv('JWT_SECRET_KEY'),
    'jwt_expiration' => 3600, // 1 hour
    'refresh_expiration' => 2592000, // 30 days
    'remember_me_expiration' => 7776000, // 90 days
    'password_min_length' => 12,
    'password_require_special' => true,
    'password_require_number' => true,
    'invitation_expiration' => 7, // days
    'verification_expiration' => 48, // hours
    'max_login_attempts' => 5,
    'lockout_time' => 30, // minutes
    'session_lifetime' => 86400, // 24 hours
    'csrf_token_expiry' => 3600, // 1 hour
];

// CORS configuration
$cors_config = [
    'allowed_origins' => [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://charterhub.com'
    ],
    'allowed_methods' => ['GET', 'POST', 'OPTIONS'],
    'allowed_headers' => [
        'Content-Type',
        'Authorization',
        'X-CSRF-Token',
        'X-Requested-With'
    ],
    'expose_headers' => ['X-CSRF-Token'],
    'max_age' => 86400
];

// Rate limiting configuration
$rate_limit_config = [
    'login' => [
        'max_attempts' => 5,
        'window' => 300, // 5 minutes
        'lockout_duration' => 1800 // 30 minutes
    ],
    'password_reset' => [
        'max_attempts' => 3,
        'window' => 3600, // 1 hour
        'lockout_duration' => 7200 // 2 hours
    ],
    'verification' => [
        'max_attempts' => 5,
        'window' => 3600, // 1 hour
        'lockout_duration' => 3600 // 1 hour
    ]
];
```

## Frontend Integration

### Auth Context Features
- ✅ Token management and renewal
- ✅ Secure storage handling
- ✅ Error handling with specific types
- ✅ Loading state management
- ✅ Analytics integration
- ✅ Development mode support

### Security Measures
- ✅ CSRF token management
- ✅ Secure token storage
- ✅ Rate limit handling
- ✅ Error recovery
- ✅ Session management
- ✅ Analytics tracking

## Next Steps

### 1. Advanced Security Features
- [ ] Implement WebAuthn support
- [ ] Add multi-factor authentication
- [ ] Implement device fingerprinting
- [ ] Add automated security scanning

### 2. User Experience
- [ ] Add social login options
- [ ] Implement progressive authentication
- [ ] Add session management interface
- [ ] Enhance password requirements

### 3. Monitoring
- [ ] Create auth analytics dashboard
- [ ] Implement real-time monitoring
- [ ] Add anomaly detection
- [ ] Enhance audit logging

### 4. Performance
- [ ] Optimize token validation
- [ ] Implement caching strategies
- [ ] Add connection pooling
- [ ] Optimize database queries

## Testing Requirements

### Security Testing
- ✅ Token validation testing
- ✅ CSRF protection testing
- ✅ Rate limiting verification
- ✅ Error handling validation
- [ ] Penetration testing
- [ ] Security audit

### Performance Testing
- ✅ Basic load testing
- [ ] Stress testing
- [ ] Scalability testing
- [ ] Concurrent user testing

### Integration Testing
- ✅ API endpoint testing
- ✅ Frontend integration testing
- ✅ Error handling testing
- [ ] End-to-end testing
- [ ] Cross-browser testing

## Original Objective
Implement a custom username/password auth system for the React app, ensuring:
1. Users can sign up directly on the website without an invite
2. Admins can invite users via links, linking them to bookings upon sign-up
3. Email confirmation is required for all accounts
4. Security against hacking and bot floods (rate limiting, admin auth)
5. Data persists in a local MySQL database (to migrate to WordPress later)
6. Populate existing admin interface and client profile submenu

## Context
- Previous: App used Clerk for authentication (now removed)
- Current: App uses custom PHP-based authentication with JWT
- Setup: Local MySQL database (`charterhub_local`), React frontend, PHP backend with JWT authentication
- Existing: Admin interface and client interface are fully built
- Goal: Simple, secure auth with booking linkage via invites

## Testing Strategy

### API Testing
- Test all authentication endpoints with Postman collection
- Verify proper error handling and responses
- Check token generation and validation
- Test rate limiting functionality

### Frontend Testing
- Verify login/logout flows in the UI
- Test password reset process end-to-end
- Validate form error handling
- Test token refresh mechanism

### Security Testing
- Test against common vulnerabilities (OWASP Top 10)
- Verify protection against brute force attacks
- Test input validation and sanitization
- Verify proper access control

## Documentation

### API Documentation
- ✅ Comprehensive README with endpoint details
- ✅ Request/response examples
- ✅ Error codes and messages
- ✅ Authentication flow diagrams

### Frontend Documentation
- React auth context usage examples
- Protected route implementation
- Token storage and management
- Handling authentication errors

## Environment Variables
```bash
# JWT Configuration
JWT_SECRET=your-32-char-secret
REFRESH_TOKEN_SECRET=another-32-char-secret

# Email Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-app-specific-password

# Database
DB_HOST=localhost
DB_USER=root
DB_PASS=your-password
DB_NAME=charterhub_local

# Frontend
FRONTEND_URL=http://localhost:3004
```

## Implementation Notes

- All authentication endpoints have been successfully created
- JWT-based authentication is fully functional
- Database schema is in place and tested
- Security measures have been implemented
- Documentation has been updated
- Next focus should be on frontend integration and testing 