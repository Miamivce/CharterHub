# CharterHub - Project Context

## Overview
CharterHub is designed to streamline the management of yacht charter bookings, facilitating communication between administrators and customers. The application consists of two separate interfaces:

1. **Admin Portal**: Allows administrators to manage bookings, customers, documents, and yacht/destination information.
2. **Customer Portal**: Enables customers to view their bookings, upload documents, and explore available yachts and destinations.

## Architecture

### Frontend Application (Primary)
- Standalone React application
- Custom authentication system:
  - JWT-based authentication for both client and admin interfaces
  - Custom-built auth context and protected routes
  - PHP backend integration for authentication endpoints
- Uses local MySQL database (`charterhub_local`)
- Currently using mock data for development with WordPress integration for yachts and destinations
- Designed for future complete API integration

### PHP Authentication Backend
- Provides comprehensive authentication system:
  - User login with JWT token generation
  - User logout with token invalidation
  - Password reset request and processing
  - Token refresh mechanism
  - Email verification
  - Invitation management
- Uses MySQL database with WordPress-compatible table structure
- Implements security best practices:
  - Secure password hashing
  - JWT token management
  - Authentication logging
  - Rate limiting configuration

### WordPress Backend (for Content)
- Provides content management for yachts and destinations
- Acts as the content source for the React application

## Implementation Status

### Completed
- ✅ Authentication System:
  - ✅ JWT-based authentication endpoints
  - ✅ User login/logout flows
  - ✅ Password reset capability
  - ✅ Token refresh mechanism
  - ✅ Email verification
  - ✅ Invitation management
  - ✅ Authentication logging
  - ✅ Protected routes with role-based access control
- ✅ Local database setup with test data
- ✅ Mock services for development
- ✅ Performance optimizations:
  - Auth context cleanup and optimization
  - React Query configuration improvements
  - Layout component optimizations
  - Service worker caching strategies
  - Error boundary implementation
- ✅ Clean, modern design system using Tailwind CSS
- ✅ Reusable component library
- ✅ Responsive layouts
- ✅ Loading states and error handling
- ✅ Document upload interface
- ✅ Booking management system:
  - Create/Edit booking form
  - Customer search and selection
  - Guest list management with duplicate checking
  - Document attachment system
  - Yacht and destination selection
  - Compact booking cards with essential info
  - Role-based booking display
- ✅ Customer management:
  - Customer search with debounced queries
  - New customer creation
  - Invitation link generation
  - Integration with booking form
  - Customer details page with booking history
  - Passport document management
  - Customer statistics tracking
  - Role-based booking display (charterer/guest)
- ✅ Admin dashboard enhancements:
  - Key metrics display (total bookings, active charters, bookings in next month)
  - Side-by-side recent and upcoming bookings sections
  - Color-coded status indicators
  - Improved booking entry displays with clickable links
  - Optimized data loading with proper error handling

### In Progress
- 🔄 Frontend integration with authentication API
- 🔄 Integration with local database
- 🔄 Document storage system implementation
- 🔄 Real-time features implementation
- 🔄 Payment processing integration

### Next Steps
1. Complete frontend integration with authentication API:
   - Update React authentication context to use new endpoints
   - Implement token refresh mechanism
   - Test all authentication flows
   - Improve error handling and user feedback
2. Production preparation:
   - Configure production JWT settings
   - Set up proper CORS restrictions
   - Implement rate limiting
   - Add brute force protection
   - Configure security headers
3. Replace mock services with local database services
4. Implement document storage system
5. Set up real-time notification system
6. Integrate payment processing
7. Conduct comprehensive testing
8. Prepare for production deployment:
   - Set up production environment variables
   - Configure backup systems
   - Set up monitoring and logging

## Development Environment

### Local Setup
- Frontend application running independently
- Local MySQL database (`charterhub_local`)
- PHP development server for authentication API
- Authentication test credentials:
  - Admin user: admin@charterhub.com / admin123
  - Manager: manager@charterhub.com / password
  - Client: client1@charterhub.com / password

### Database Structure
- wp_users table
- wp_charterhub_invitations table
- wp_charterhub_auth_logs table
- (mock tables for development)

## Integration Requirements
- ✅ Independent application architecture
- ✅ Local data storage
- 🔄 Document storage system
- ✅ User authentication
- 🔄 Real-time updates

## Special Considerations
- 🔄 Data privacy and security
- ✅ Scalable architecture
- ✅ Intuitive UI/UX
- 🔄 File storage implementation

## Key Features

### Admin Portal Features
- ✅ User authentication and authorization
- ✅ Create, read, update, and delete bookings
- ✅ Manage customer information (add new customers, modify existing customer details)
- ✅ Upload and manage documents with visibility settings (main charterer/guest)
- ✅ Search for existing users
- ✅ Add customers as 'main charterer' or 'guests' to bookings
- ✅ Send invitation links to new customers
- ✅ Set booking status (pending, confirmed, ongoing, closed)
- ✅ Manage yacht and destination information (from dropdown or manual entry)

### Customer Portal Features
- ✅ User authentication and registration
- ✅ View bookings and booking details
- 🔄 Upload passport and other required documents
- ✅ Browse yacht and destination information
- ✅ View documents shared by admin (based on visibility settings)

## Integration Requirements
- 🔄 All data must be stored in the existing WordPress database
- ✅ No modifications to the existing WordPress site structure
- 🔄 Secure API integration with existing WordPress site
- ✅ Responsive design for mobile and desktop use

## Special Considerations
- 🔄 Data privacy and security for sensitive customer information
- 🔄 Seamless integration with existing WordPress site and database
- ✅ Intuitive UI/UX for both admin and customer interfaces
- ✅ Scalability to accommodate growing number of bookings and customers 