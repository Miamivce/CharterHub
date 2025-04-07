# CharterHub Developer Guide

## Introduction

This guide provides technical information for developers working on the CharterHub platform. It covers architecture, key components, best practices, and troubleshooting common issues.

## Architecture Overview

CharterHub follows a modern web application architecture:

- **Frontend**: React-based SPA using TypeScript
- **State Management**: React Context API and TanStack Query
- **UI Components**: Custom component library with Tailwind CSS
- **Data Persistence**: Local storage for development, API for production
- **Authentication**: JWT-based auth with role-based access control

## Key Components

### Frontend Structure

```
frontend/
├── public/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── shared/           # Generic components (Button, Modal, etc.)
│   │   ├── booking/          # Booking-related components
│   │   ├── customer/         # Customer-related components
│   │   └── yacht/            # Yacht-related components
│   ├── contexts/             # React Context providers
│   │   ├── auth/             # Authentication context
│   │   ├── booking/          # Booking management context
│   │   ├── customer/         # Customer data context
│   │   └── notification/     # Global notification system
│   ├── pages/                # Page components
│   │   ├── admin/            # Admin portal pages
│   │   └── client/           # Client-facing pages
│   ├── services/             # API and data services
│   ├── types/                # TypeScript type definitions
│   ├── utils/                # Utility functions
│   └── App.tsx               # Main application component
```

### Authentication System

The application uses a JWT-based authentication system with token refresh capabilities. The core components are:

1. **AuthContext** (`frontend/src/contexts/auth/AuthContext.tsx`): Manages authentication state and provides login/logout functionality.
2. **wpApi Service** (`frontend/src/services/wpApi.ts`): Handles API communication, including authentication requests.

#### Token Management

The application uses two types of tokens:
- **Auth Token**: Short-lived JWT token used for API requests
- **Refresh Token**: Long-lived token used to obtain new auth tokens

These tokens are stored in localStorage:
```typescript
// Store tokens
localStorage.setItem('auth_token', response.data.token);
localStorage.setItem('refresh_token', response.data.refresh_token);
```

#### Token Refresh Mechanism

We've implemented a proactive token refresh strategy to prevent token expiration:

1. A background interval runs every 4 minutes to refresh tokens before they expire
2. Token refresh only occurs when a user is actually logged in
3. Network errors during refresh are handled gracefully, preventing accidental logouts

```typescript
// Setup a proactive token refresh interval
const tokenRefreshId = setInterval(async () => {
  if (user) {
    try {
      console.log('Performing proactive token refresh');
      await refreshTokenIfNeeded();
    } catch (error) {
      console.error('Proactive token refresh failed:', error);
    }
  }
}, 4 * 60 * 1000);
```

#### Error Handling Best Practices

When working with the authentication system, follow these guidelines:

1. **Network vs. Authentication Errors**: Distinguish between network errors (which should preserve tokens) and authentication errors (which should clear tokens)
2. **Token Refresh on 401**: Attempt token refresh before logging users out on 401 errors
3. **User Experience**: Avoid disrupting the user experience with unnecessary logouts

Example error handling pattern:
```typescript
try {
  // API request
} catch (error) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      // Try to refresh token first
      try {
        await refreshToken();
        // Retry the original request
      } catch (refreshError) {
        // Only log out if refresh fails
        clearTokens();
      }
    } else if (!error.response) {
      // Network error - don't log out
      console.log('Network error - maintaining session');
    }
  }
}
```

#### Connection Testing

The application includes a connection test mechanism that runs every 5 minutes to verify API connectivity:

```typescript
const connectionTestId = setInterval(testConnection, 5 * 60 * 1000);
```

#### Development Mode Authentication

In development mode, the application supports a simplified authentication flow that works without an active backend:

1. User credentials are stored in localStorage under `dev_users`
2. Login/registration data is processed locally
3. Mock tokens are generated and stored in localStorage

When testing auth-related features in development, be aware that this flow differs from production.

## Form Handling Best Practices

### Modal Forms

When implementing modal forms, especially those that create or update data:

1. **Prevent Default Navigation**: Always call `e.preventDefault()` and `e.stopPropagation()` to prevent unwanted form submission behavior
2. **Success Confirmation**: Show explicit success confirmation and require user action before closing
3. **Prevent Automatic Closing**: Use the `preventAutoClose` property on modals to prevent accidental dismissal
4. **Delay Callbacks**: Use timeouts to ensure state updates complete before callbacks run
5. **Complete Data Processing**: Ensure all data is saved before triggering navigation or closing modals

Example implementation:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  e.stopPropagation();
  
  setIsLoading(true);
  
  try {
    await dataService.saveData(formData);
    setSuccess(true);
    
    // Delay callback to ensure state is updated
    setTimeout(() => {
      onSuccess(data);
    }, 300);
  } catch (error) {
    setError(error.message);
  } finally {
    setIsLoading(false);
  }
};

// In render function
return (
  <Modal 
    isOpen={isOpen} 
    onClose={handleClose}
    preventAutoClose={success} // Prevent closing on success until explicit action
  >
    {success ? (
      <SuccessView onContinue={handleContinue} />
    ) : (
      <FormView onSubmit={handleSubmit} />
    )}
  </Modal>
);
```

## Customer Management

### Customer Creation Flow

The customer creation process involves multiple components working together:

1. `CustomerSearch` - Component for searching existing customers or creating new ones
2. `CreateCustomerModal` - Modal form for creating/editing customer data
3. `customerService` - Service for persisting customer data

When a user creates a new customer:
- The CreateCustomerModal collects and validates data
- The customerService saves the data to storage
- The CustomerSearch component selects the newly created customer
- The parent component receives the selected customer

Important considerations:
- Customer data is stored in both `MOCK_CUSTOMERS` and `REGISTERED_CUSTOMERS` arrays
- Each customer has a `selfRegistered` flag to determine which array it belongs in
- All customers need unique IDs for proper tracking and persistence

### Recent Customer Creation Fixes

We recently resolved issues with the customer creation flow:

1. **Modal Management**: Enhanced modal behavior to stay open until explicitly dismissed
2. **User Feedback**: Added clear success confirmation UI after customer creation
3. **Event Prevention**: Fixed form submission to prevent navigation interruption
4. **Delayed Callbacks**: Implemented timeouts to ensure proper data synchronization
5. **Dropdown Components**: Created reusable dropdown components for customer selection

These changes ensure that when customers are created during the booking process, they are properly saved and appear in the customers submenu.

## Data Persistence

### Local Storage

The application uses local storage for persisting data during development:

```typescript
// Save data to storage
function saveDataToStorage() {
  try {
    localStorage.setItem('dataKey', JSON.stringify(data))
    return true
  } catch (err) {
    console.error('Error saving data:', err)
    return false
  }
}

// Load data from storage
function loadDataFromStorage() {
  try {
    const storedData = localStorage.getItem('dataKey')
    return storedData ? JSON.parse(storedData) : initialData
  } catch (error) {
    console.error('Error loading data:', error)
    return initialData
  }
}
```

### Storage Keys

The application uses the following storage keys:

- `mockCustomers` - Admin-created customers
- `registeredCustomers` - Self-registered customers
- `customersBackup` - Backup of all customer data for recovery
- `bookings` - All booking data
- `auth_token` - Authentication token
- `user_data` - Current user information

## Common Issues and Solutions

### Modal Form Navigation Issues

**Problem**: Modal form submissions cause navigation or premature closing

**Solution**: 
1. Add `e.preventDefault()` and `e.stopPropagation()` to form submissions
2. Use the `preventAutoClose` property on modals
3. Add explicit success confirmation before allowing continuation

### Authentication Issues

**Problem**: Users get automatically logged out when reloading pages or after short periods of inactivity

**Solution**:
1. Ensure the token refresh interval is working properly
   ```typescript
   // Check that this is configured in AuthContext.tsx
   const tokenRefreshId = setInterval(refreshTokenIfNeeded, 4 * 60 * 1000);
   ```
2. Verify error handling differentiates between network and auth errors
   ```typescript
   // In API error handlers, check for actual auth failures vs network issues
   if (axios.isAxiosError(error) && error.response?.status === 401) {
     // Auth failure - can clear tokens
   } else if (axios.isAxiosError(error) && !error.response) {
     // Network error - preserve tokens
   }
   ```
3. Implement retry mechanism for API requests that fail with 401
   ```typescript
   // If a request fails with 401, try refreshing token before giving up
   if (error.response?.status === 401) {
     try {
       await wpApi.refreshToken();
       // Retry the original request
     } catch (refreshError) {
       // Only now consider the user logged out
     }
   }
   ```
4. Check browser console for "Performing proactive token refresh" logs to verify the refresh is working

### Data Synchronization Issues

**Problem**: Data updates don't appear immediately in the UI

**Solution**:
1. Add timeouts to ensure state updates complete
2. Reload data after creation/updates
3. Use callback delays to ensure proper sequence of operations

### Customer Search Not Working

**Problem**: Customer search dropdown doesn't show results

**Solution**:
1. Check that customers are properly loaded from storage
2. Ensure search term filtering is working correctly
3. Verify that dropdown positioning and visibility are correct

## Contributing

When contributing to the CharterHub codebase:

1. Follow the TypeScript types and interfaces
2. Use React Context for global state management
3. Implement proper form validation with feedback
4. Add detailed logs for debugging
5. Test changes thoroughly across different workflows

## Testing

Before submitting changes, test in the following scenarios:

1. Create a new booking with a new customer
2. Create a new customer from the admin interface
3. Edit existing customers and validate updates
4. Check that customers appear in all relevant lists
5. Verify data persistence through page refreshes

## Development Environment Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- WordPress (v6.0 or higher)
- PHP 8.0+
- MySQL 5.7+
- Git

### Frontend Setup
1. Clone the repository
```bash
git clone https://github.com/your-org/charterhub.git
cd charterhub/frontend
```

2. Install dependencies
```bash
npm install
```

3. Start development server
```bash
npm run dev
```

### Backend Setup
1. Configure WordPress
2. Install required plugins
3. Set up the custom API plugin

## Architecture

### Frontend
- React 18 with TypeScript
- State management via Context API
- React Router for navigation
- Tailwind CSS for styling
- Vite for building

### Backend
- WordPress REST API
- Custom endpoints for charter functionality
- JWT authentication
- Custom post types for yachts and bookings

## Code Structure

### Frontend
```
frontend/
├── src/
│   ├── components/      # Reusable UI components
│   ├── contexts/        # React contexts
│   ├── hooks/           # Custom hooks
│   ├── pages/           # Page components
│   ├── services/        # API services
│   └── utils/           # Utility functions
```

### Backend
```
backend/
├── api/                 # API endpoints
├── plugins/             # Custom WordPress plugins
└── config/             # Configuration files
```

## Development Workflow
1. Create feature branch
2. Implement changes
3. Write tests
4. Submit pull request
5. Code review
6. Merge to main

## Testing
- Frontend: Jest + React Testing Library
- API: Postman collections
- E2E: Cypress

## Deployment
- Frontend: Vercel/Netlify
- Backend: WordPress hosting
- CI/CD via GitHub Actions

## Best Practices
- Follow TypeScript best practices
- Use ESLint and Prettier
- Write unit tests
- Document API changes
- Follow Git commit conventions

## API Documentation
See `api-documentation.md` for detailed API endpoints

## Troubleshooting
Common issues and solutions:
1. API authentication errors
2. Build optimization
3. State management patterns
4. WordPress plugin conflicts 