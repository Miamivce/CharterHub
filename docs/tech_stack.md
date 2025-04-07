# Technology Stack for CharterHub

## Frontend (React Application)
- **Framework**: React.js
- **State Management**: React Context API & Hooks
- **Styling**: 
  - Tailwind CSS
  - Responsive design principles
- **UI Component Library**: Custom component library with Tailwind
- **Form Handling**: React Hook Form with Zod validation
- **HTTP Client**: Axios
- **Authentication**: 
  - Custom JWT authentication (all portals)
  - Separate admin and user authentication flows
  - PHP-based token generation API
  - Development mode verification shortcuts
  - Mock services for development
- **File Uploads**: React Dropzone

## Backend (WordPress Integration)
- **CMS**: WordPress (existing)
- **Custom Plugin**: PHP-based WordPress plugin (CharterHub API)
- **API**: WordPress REST API with custom endpoints
- **Authentication**: Custom PHP-based authentication system with JWT
- **Database**: MySQL (existing WordPress database)
- **Performance**: Optimized JWT token generation

## Development Tools
- **Version Control**: Git with GitHub
- **Package Manager**: npm/yarn
- **Code Quality**: ESLint, Prettier
- **Testing**: Jest, React Testing Library
- **Build Tools**: Webpack, Babel
- **CI/CD**: GitHub Actions

## Hosting & Deployment
- **Frontend Hosting**: Netlify/Vercel/AWS Amplify
- **WordPress Hosting**: Existing hosting environment
- **Domain & SSL**: Maintain existing configuration

## Third-Party Services
- **Email Service**: WordPress mail system or SendGrid
- **File Storage**: WordPress media library with custom organization
- **Analytics**: Google Analytics (optional)

## Authentication & Security

### Current Implementation
- **Client Authentication**:
  - ✅ JWT-based implementation with proper token refresh
  - ✅ Enhanced storage management (localStorage/sessionStorage)
  - ✅ Race condition prevention in token refresh
  - ✅ Proper initialization and cleanup
  - ✅ Improved error handling and user feedback

- **User Registration**:
  - ✅ Secure password hashing
  - ✅ Automatic username generation
  - ✅ Email verification system
  - ✅ Development mode shortcuts
  - ✅ Comprehensive event logging

- **Email Verification**:
  - ✅ Token-based verification
  - ✅ Development mode support
  - ✅ Status checking endpoint
  - ✅ Automatic login after verification
  - ✅ Secure token storage

- **Authentication Endpoints**:
  - ✅ User Login (`/auth/login.php`) - Enhanced with proper error handling
  - ✅ Admin Login (`/auth/admin-login.php`)
  - ✅ User Logout (`/auth/logout.php`)
  - ✅ Token Refresh (`/auth/refresh-token.php`) - Improved with race condition handling
  - ✅ Password Reset (`/auth/reset-password.php`)
  - ✅ Email Verification (`/auth/verify-email.php`)
  - ✅ Development Verification (`/auth/dev-verify-account.php`)
  - ✅ Verification Status (`/auth/check-verification.php`)
  - ✅ User Profile (`/auth/me.php`)

- **Security Features**:
  - ✅ Secure token storage and management
  - ✅ Proper token validation and refresh
  - ✅ Enhanced error handling
  - ✅ Storage synchronization
  - ✅ CSRF protection
  - ✅ Rate limiting
  - ✅ Authorization middleware
  - ✅ Secure session handling

### Database Schema
- **Users Table** (`wp_charterhub_clients`):
  - `id` - Auto-incrementing primary key
  - `username` - Auto-generated unique username
  - `email` - Unique email address (lowercase)
  - `password` - Securely hashed password
  - `first_name`, `last_name` - User's name
  - `display_name` - Formatted full name
  - `verified` - Email verification status
  - `verification_token` - Email verification token
  - `created_at` - Registration timestamp

- **Auth Logs** (`wp_charterhub_auth_logs`):
  - `id` - Auto-incrementing primary key
  - `user_id` - Reference to users table
  - `action` - Authentication action (VARCHAR(50))
  - `status` - Action status
  - `ip_address` - User's IP address
  - `user_agent` - User's browser info
  - `details` - JSON encoded details
  - `created_at` - Event timestamp

### Production Requirements
- **Authentication Hardening**:
  - Configure production JWT secrets
  - Implement token blacklisting
  - Set up proper rate limiting
  - Add brute force protection
  - Enable MFA (if required)
  - Configure password policies
  
- **Security Measures**: 
  - Production CSP configuration
  - CORS policy configuration
  - Rate limiting implementation
  - Security headers setup
  - Regular security audits
  - Vulnerability scanning

- **Monitoring & Logging**:
  - ✅ Authentication attempts
  - ✅ Failed logins
  - ✅ Token validation
  - ✅ Password resets
  - ✅ Email verifications
  - ✅ Security incidents
  - ✅ Performance metrics
  - ✅ Error tracking

### Compliance & Data Protection
- User data encryption
- GDPR compliance
- Cookie consent management
- Privacy policy implementation
- Terms of service documentation
- Data retention policies
- Backup and recovery procedures

## Security Measures
- **Authentication**: 
  - ✅ Secure JWT implementation for all portals
  - ✅ Token-based access control
  - ✅ Secure password reset flow
  - ✅ Account verification
- **Data Protection**: HTTPS, data encryption
- **Input Validation**: Server-side and client-side validation
- **Authorization**: Role-based access control
- **WordPress Security**: 
  - Custom plugin security best practices
  - Regular security updates
  - Input sanitization and validation 

## WordPress API Integration

### Endpoints
- **Yachts**: `/wp-json/wp/v2/yacht` (singular)
  - List: GET `/wp-json/wp/v2/yacht?page={page}&_embed=true`
  - Single: GET `/wp-json/wp/v2/yacht/{id}?_embed=true`
- **Destinations**: `/wp-json/wp/v2/location` (singular)
  - List: GET `/wp-json/wp/v2/location?page={page}&_embed=true`
  - Single: GET `/wp-json/wp/v2/location/{id}?_embed=true`

### Caching Implementation
- **Duration**: 7 days cache lifetime
- **Storage Layers**:
  - Memory cache (Map)
  - LocalStorage persistence
  - Fallback mechanism for API failures
- **Cache Keys**:
  - Yachts list: 'wp_yachts_cache'
  - Single yacht: 'wp_yacht_{id}_cache'
  - Destinations list: 'wp_destinations_cache'
  - Single destination: 'wp_destination_{id}_cache' 