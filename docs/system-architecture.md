# CharterHub System Architecture

## Overview

CharterHub is a yacht charter management application with a dual-interface system that leverages WordPress for database storage and user authentication. The application is designed to serve both administrators and clients with distinct experiences while sharing core data services.

## System Architecture

![CharterHub Architecture](https://mermaid.ink/img/pako:eNp1kk9v2zAMxb-KoVM6wI59wJBDgQJDsQRblh7adleBlRlHmC1pkpwuCPrdRydp1qE74CX1o_jjH3UgrpSiHfGUlZ_oMXsn-tGlLVqLLKzWiuZFnhdPy3J5Xz6r-6-z_-lNYegxlr0kqZhMHd5QJ3I2_0DPcDRzN9bGY5p6_X-TFO5qxe_JhJStJ8fEa-BcUFhHDw3GiCHgfUemXyBl6wR3bH1tLDlyTv2yHlmh7NE6jzDjnzOI4FTTLtgGlgQH9v6PxQF7ijDGJnl8GQNSklTPj2iDvSA3DKzIq0oZ7qVRpfVHDDHkuIbMwSP3kF1HGjA4p6ZZwXl6uSuK1atYB7szmzuaQqVcT3pGG3OQD5lG2OT3m0w6rP9CGrPYZvfb7YsRu9tvn7f5Ay6vTJLf0sAfT0YLJq0slVa5UVjRTX5D4kfAJlL1CWc0aLGQDC4XGvSqFhQcz6i4I50uzCltZovoNZKOlO_FSVvnlH3U8wW_bBUkpZzeTcvp5Nnt-5KwYa4T90-7BU1oJ2z0nY61kGPkOQWP0tBe1tJeUCdsmKLWyVrmB5EdOZn4vS0Z-ZRuKGbRSRG_ALJqNw4?type=png)

## Key Components

1. **WordPress**
   - **Role**: Database and credential storage
   - **Functions**:
      - Secure storage of user credentials
      - Content management for yachts and destinations
      - User management and permission handling
      - Data persistence layer for all application components

2. **Vercel Web Server**
   - **Role**: Frontend hosting
   - **Functions**:
      - Hosts the React-based SPA
      - Handles client-side routing
      - Delivers optimized static assets
      - Provides CI/CD integration

3. **PHP Backend**
   - **Role**: Authentication and data API
   - **Functions**:
      - Custom authentication system with JWT tokens
      - Data manipulation and business logic
      - Bridge between frontend and WordPress
      - File management and uploads

4. **ReactJS Frontend**
   - **Role**: User interface
   - **Functions**:
      - Responsive UI for both admin and customer portals
      - Form handling and validation
      - State management with React Context
      - Component library based on Tailwind

## Authentication Architecture

CharterHub implements a dual authentication system to serve different user types:

### Client Authentication (Port 8000)
- Regular customers use standard JWT authentication
- User creation and validation through WordPress
- Secure token exchange between frontend and PHP backend
- Token refreshing mechanism with silent refresh

### Admin Authentication (Port 3000)
- Administrators use a session-based authentication
- Higher security with refresh token rotation
- Role-based access control (RBAC)
- Extended session management

## Customer Data Management Architecture

CharterHub implements a comprehensive customer data management system to ensure data integrity and synchronization across different parts of the application.

### Customer Data Types
- **Customer**: Base type with essential information
- **CustomerWithPassport**: Extended type with document references
- **CustomerWithStats**: Statistics-enhanced type for the admin dashboard
- **ClientUser**: Type used in the authentication context

### Storage Mechanism
The application employs a multi-tiered storage approach:

1. **Primary Storage**:
   - **WordPress Database**: Main storage for production data
   - **Local Storage Arrays**: Development and testing storage

2. **Session Storage**:
   - Maintains customer data during active sessions
   - Synchronizes with primary storage on updates

3. **Authentication Storage**:
   - Specialized storage for authentication data
   - Links customer profiles with login credentials

### Data Synchronization

Customer data synchronization follows these principles:

1. **Single Source of Truth**: Despite multiple storage locations, a robust synchronization system ensures consistency
2. **ID Uniqueness**: UUID-based IDs prevent duplicate entries
3. **Deduplication**: Automatic merging of duplicate records based on email
4. **Storage Segregation**: Self-registered vs. admin-created customers stored in separate arrays
5. **Periodic Cleanup**: Regular maintenance to ensure data integrity

### Synchronization Flow

```
┌───────────────┐     ┌────────────────┐     ┌──────────────┐
│ User Profile  │────►│ AuthContext    │────►│ API Service  │
│ Update        │     │ updateProfile()│     │ PUT /user    │
└───────┬───────┘     └────────┬───────┘     └──────┬───────┘
        │                      │                    │
        │                      ▼                    │
        │             ┌────────────────┐            │
        └────────────►│ CustomerService│◄───────────┘
                      │ updateCustomer()│
                      └────────┬───────┘
                               │
                               ▼
                     ┌────────────────────┐
                     │syncCustomerWithLocalAuth()│
                     └────────────────────┘
                               │
                               ▼
           ┌─────────────────────────────────────┐
           │                                     │
  ┌────────┴────────┐    ┌──────────┴───────┐    ┌─────────┴──────┐
  │ dev_users       │    │ user_data        │    │ charterhub_    │
  │ (auth system)   │    │ (session storage)│    │ mock_customers │
  └─────────────────┘    └──────────────────┘    └────────────────┘
```

### Data Integrity Mechanisms

1. **Initialization Cleanup**: Executed when services start
2. **Periodic Cleanup**: Runs on a timer to maintain consistency
3. **Manual Cleanup**: Developer-triggered maintenance
4. **Error Recovery**: Robust handling of storage failures

### Development Mode Data Handling

In development mode, the system offers additional features:

1. **Mock Data Generation**: Realistic test data creation
2. **Storage Inspection**: Tools to view and manipulate storage
3. **Synchronization Testing**: Utilities to test data consistency

For more detailed information about customer data flow and best practices, please refer to [Customer Data Flow](./customer-data-flow.md).

## Data Flow

1. **User Interactions**:
   - Frontend captures user input and sends API requests

2. **API Layer**:
   - PHP backend receives requests and processes business logic
   - Authentication middleware verifies JWT tokens
   - WordPress API fetches content when needed

3. **Database Operations**:
   - WordPress database stores and retrieves data
   - Custom tables handle charter-specific data

4. **Response Delivery**:
   - Processed data returned as JSON to frontend
   - Frontend renders data in appropriate UI components

## Deployment Architecture

The system is designed for flexible deployment:

- **Development**: Local environment with PHP development servers on ports 8000/8001
- **Staging**: Cloud-hosted environment for testing
- **Production**: High-availability configuration with load balancing

## Security Measures

1. **Authentication**:
   - JWT tokens with short expiration
   - Refresh token rotation for persistent sessions
   - Rate limiting for login attempts

2. **Data Protection**:
   - HTTPS for all communication
   - Input validation and sanitization
   - Prepared statements for database queries

3. **Infrastructure**:
   - Regular security patches
   - Environment segregation
   - Principle of least privilege for database access

## Monitoring and Logging

1. **Error Tracking**:
   - Centralized error logging
   - Application performance monitoring

2. **User Activity**:
   - Authentication attempts logged
   - Admin actions recorded for audit

3. **System Health**:
   - Server resource utilization
   - API response times
   - Database performance metrics

## System Requirements

1. **Frontend**
   - Modern web browser with JavaScript enabled
   - Responsive design for various devices

2. **Backend**
   - WordPress installation with custom plugins
   - PHP environment for WordPress and custom endpoints
   - MySQL database for data storage
   - JWT authentication system

3. **Deployment**
   - Vercel hosting for the web application
   - WordPress hosting (connected to Vercel)
   - Domain configuration for both interfaces

## Development and Deployment Workflow

1. **Development Environment**
   - Local WordPress installation
   - React development server
   - Local API endpoints
   - Development database

2. **Testing Environment**
   - Staging Vercel deployment
   - Test WordPress instance
   - Testing database
   - Automated testing suite

3. **Production Environment**
   - Vercel production deployment
   - Production WordPress instance
   - Production database with backups
   - Monitoring and logging

## Future Optimizations

1. **Performance Enhancements**
   - Implement caching for frequently accessed data
   - Optimize database queries
   - Implement CDN for media content
   - Add server-side rendering for critical pages

2. **Scalability Improvements**
   - Implement API gateway for better request management
   - Add load balancing for high traffic periods
   - Optimize WordPress performance with caching
   - Implement microservices for specific functionality

3. **Security Hardening**
   - Regular security audits
   - Implement advanced authentication (MFA)
   - Enhanced monitoring and intrusion detection
   - Regular updates to all components

4. **User Experience**
   - Progressive Web App capabilities
   - Offline functionality for critical features
   - Enhanced mobile experience
   - Improved notification system

## Implementation Notes

This architecture leverages WordPress's strong user management and content capabilities while providing a modern, responsive front-end through React. The dual authentication approach allows for both WordPress admins and regular clients to access the system securely, with appropriate permissions and data isolation.

The API-based approach ensures that future scaling and enhancements can be implemented without disrupting the core architecture, allowing for modular development and maintenance.

## WordPress Integration

### API Endpoints
The application integrates with WordPress through its REST API:

1. **Content Endpoints**:
   - Yachts: `/wp-json/wp/v2/yacht` (singular)
   - Destinations: `/wp-json/wp/v2/location` (singular)
   - Media: Embedded via `_embed=true` parameter

2. **Data Flow**:
   ```
   React App → WordPress API → Cache Layer → UI
                    ↑             ↓
                WordPress DB  LocalStorage
   ```

### Caching Architecture

The application implements a multi-layer caching system:

1. **Primary Cache** (Memory):
   - In-memory Map for fastest access
   - Stores transformed data
   - Cleared on service initialization

2. **Persistent Cache** (LocalStorage):
   - Backs up all API responses
   - 7-day retention period
   - Separate keys for lists and individual items

3. **Fallback Mechanism**:
   ```
   Request → Memory Cache → LocalStorage → API → LocalStorage Backup
   ```

4. **Cache Keys**:
   - Lists: `wp_yachts_cache`, `wp_destinations_cache`
   - Individual: `wp_yacht_{id}_cache`, `wp_destination_{id}_cache`

### Error Handling

1. **API Failures**:
   - Attempt memory cache retrieval
   - Fall back to localStorage
   - Return empty arrays for lists
   - Detailed error logging

2. **Data Integrity**:
   - Type validation on cached data
   - Array type checking
   - Timestamp verification
   - Automatic cache cleanup
