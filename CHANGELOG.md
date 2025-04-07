# CharterHub Changelog

All notable changes to the CharterHub project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.1] - 2025-03-18

### Added
- **Direct Registration Endpoint**: Created a new direct-register.php endpoint that bypasses WordPress
  - Avoids timeout issues with WordPress plugins
  - Stores users directly in the database without WordPress integration
  - Simplifies testing and development

### Fixed
- **Account Verification**: Resolved issues with email verification process
  - Fixed email passing to verification popup
  - Enhanced debug logging throughout verification process
  - Improved visual feedback in verification UI
  - Implemented proper post-verification navigation
  - Added fallback mechanism for verification links

### Improved
- **Verification UI**: Enhanced user experience during verification
  - Added visual indicators for verification progress
  - Improved error messaging with more specific feedback
  - Updated styles to make the verification popup more noticeable

## [1.3.0] - 2025-03-15

### Added
- **CSRF Protection**: Implemented cross-site request forgery protection for all sensitive endpoints
  - Added dedicated CSRF token generation endpoint
  - Integrated automatic CSRF token handling in frontend API service
  - Added token validation in backend authentication endpoints
  - Enhanced logout flow to explicitly clear CSRF tokens
  - Implemented auto-retry mechanism for failed CSRF validations
  - Added proactive token fetching in the Login component

- **Enhanced Rate Limiting**: Improved protection against brute force attacks
  - Added configurable login attempt tracking with IP-based limits
  - Implemented informative remaining attempts feedback to users
  - Created countdown timer for temporarily locked accounts
  - Added developer tools for testing rate limiting functionality

- **Better Error Handling**: Improved authentication error feedback
  - Added specific error messaging for different authentication failure types
  - Implemented RateLimitError class for handling rate limiting scenarios
  - Enhanced UI to show remaining login attempts and lockout duration

### Fixed
- **Authentication Testing**: Completed comprehensive test suite for authentication system
  - All authentication tests now passing with improved test approach
  - Refactored tests to focus on state changes instead of implementation details
  - Enhanced mocks to better simulate real authentication behavior

## [1.2.0] - 2025-02-26

### Fixed
- **Authentication System**: Fixed issue causing users to be logged out when reloading pages
- **Authentication System**: Resolved the 5-minute automatic logout problem
- **Authentication System**: Enhanced token refresh mechanism to be more resilient to network issues
- **Authentication System**: Implemented proactive token refresh to prevent expiration

### Added
- **Developer Documentation**: Added comprehensive authentication system documentation
- **Error Handling**: Improved differentiation between network errors and authentication failures

### Changed
- **API Services**: Updated error handling in API services to preserve authentication during temporary network issues
- **User Experience**: Reduced disruption to user workflow by preventing unnecessary logouts

## [1.1.0] - 2023-06-15

### Fixed
- **Customer Creation**: Fixed issue where customers created during the booking process weren't appearing in the admin customer list
- **Modal Forms**: Enhanced modal form behavior to prevent premature closing
- **Data Synchronization**: Improved synchronization between in-memory data and local storage

### Added
- **UI Components**: Created reusable dropdown components for customer selection
- **User Feedback**: Added explicit success confirmation UI after customer creation

### Changed
- **Form Handling**: Enhanced form submission to prevent navigation interruption
- **State Management**: Implemented delayed callbacks to ensure proper data synchronization

## [1.0.0] - 2023-01-10

### Added
- Initial release of CharterHub platform
- Customer management system
- Yacht listing and booking functionality
- Admin portal for charter companies
- Customer portal for booking yachts 