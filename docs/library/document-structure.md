# CharterHub Project Structure Documentation

## Overview

CharterHub is a comprehensive yacht charter management platform that connects yacht owners, charter companies, and customers through an intuitive web interface. This document provides an overview of the project's structure, architecture, and key components.

## Project Structure

```
charterhub/
├── frontend/                 # React application built with Vite
│   ├── src/                  # Source code
│   │   ├── components/       # Reusable UI components
│   │   ├── contexts/         # React contexts for global state management
│   │   ├── pages/            # Page components
│   │   ├── services/         # API and data services
│   │   ├── types/            # TypeScript type definitions
│   │   └── utils/            # Utility functions
│   ├── public/               # Static assets
│   └── package.json          # Frontend dependencies
├── backend/                  # WordPress integration
├── wordpress-integration/    # WordPress integration documentation
└── docs/                     # Project documentation
    ├── admin-guide.md        # Documentation for administrators
    ├── customer-guide.md     # Documentation for customers
    ├── developer-guide.md    # Documentation for developers
    ├── api-documentation.md  # API documentation
    ├── library/              # Additional documentation
    └── auth-system-todo.md   # Authentication system improvement tasks
```

## Technology Stack

### Frontend
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **State Management**: React Context API
- **Routing**: React Router
- **UI Components**: Custom components with Tailwind CSS
- **Form Handling**: Formik with Yup validation

### Backend
- **CMS**: WordPress (v6.0+)
- **Database**: MySQL 5.7+
- **Server**: PHP 8.0+
- **API**: WordPress REST API

## Key Components

### Authentication System

The application implements two separate authentication systems:

1. **Client Authentication** (`AuthContext.tsx`):
   - Handles authentication for yacht charterers and customers
   - Includes login, registration, password reset, and profile management
   - Features token-based authentication with refresh mechanism
   - Implements proactive token refresh to prevent session expiration

2. **Admin Authentication** (`AdminAuthContext.tsx`):
   - Handles authentication for admin users (charter companies)
   - Uses WordPress credentials
   - Contains separate routes and permissions

### Document Management

The document system allows for storage and retrieval of various document types:

1. **Document Service** (`documentService.ts`):
   - Handles CRUD operations for documents
   - Supports filtering by category and tags
   - Special handling for passport documents
   - Centralized storage with metadata

2. **Document Context** (`DocumentContext.tsx`):
   - Provides global access to document functions
   - Manages document state across the application
   - Supports document tagging and categorization

### Booking System

The booking system manages yacht charters:

1. **Booking Service** (`bookingService.ts`):
   - Handles creating, updating, and canceling bookings
   - Manages booking statuses and dates
   - Verifies yacht availability

2. **Booking Context** (`BookingContext.tsx`):
   - Provides global access to booking functions
   - Manages booking state across the application

### Customer Management

The customer system tracks yacht charterers and their information:

1. **Customer Service** (`customerService.ts`):
   - Handles CRUD operations for customers
   - Manages customer profiles and related documents
   - Supports searching and filtering customers

## Database Structure

The application uses MySQL (v5.7+) as its primary database, integrated through the WordPress backend:

1. **WordPress Tables**:
   - Standard WordPress tables (`wp_users`, `wp_posts`, etc.)
   - Custom post types for yachts, destinations, and bookings

2. **Custom Tables**:
   - Customer metadata
   - Booking details
   - Document relationships

## Development Environment

### Local Development
- Frontend development server: Vite (default port 3000, auto-increments if ports are in use)
- Backend: Local WordPress installation
- Authentication: Mock services available for development

### Production
- Frontend: Deployed static files
- Backend: WordPress with custom plugins
- Authentication: Live WordPress REST API endpoints

## Conclusion

The CharterHub application follows a modern architecture with a clear separation between the frontend and backend. The frontend is built with React and communicates with the WordPress backend through API calls. This separation allows for flexible development and deployment options while leveraging the content management capabilities of WordPress. 