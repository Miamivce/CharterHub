# CharterHub - Technical Context

## Architecture

### Frontend Architecture
- React with TypeScript for type safety
- Vite for fast development and optimized builds
- React Router for client-side routing
- Formik and Yup for form handling and validation
- TailwindCSS for styling
- Heroicons for consistent iconography
- Context API for state management

### Component Structure
```
src/
├── components/
│   ├── admin/           # Admin-specific components
│   │   ├── AdminLayout.tsx
│   │   └── ...
│   ├── client/          # Client-specific components
│   │   ├── ClientLayout.tsx
│   │   └── ...
│   └── shared/          # Shared UI components
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       └── ...
├── contexts/
│   ├── admin/
│   │   └── AdminAuthContext.tsx
│   ├── auth.ts
│   └── ...
├── pages/
│   ├── admin/
│   │   ├── Dashboard.tsx
│   │   ├── Bookings.tsx
│   │   └── ...
│   └── client/
│       ├── Dashboard.tsx
│       ├── Documents.tsx
│       └── ...
└── services/
    ├── api.ts
    └── mock.ts
```

### Authentication Flow
1. User submits login credentials
2. Frontend validates input
3. Credentials sent to WordPress API
4. JWT token received and stored in localStorage
5. User data stored in auth context
6. Protected routes become accessible

### Data Management
- Type-safe interfaces for all data structures
- Mock services for development
- API service for WordPress integration
- Context providers for global state
- Local storage for auth persistence

### UI Components
```typescript
// Shared component example (Button.tsx)
interface ButtonProps {
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  children: React.ReactNode
  onClick?: () => void
}

// Layout component example (AdminLayout.tsx)
interface AdminLayoutProps {
  children: React.ReactNode
}

// Form validation example (Documents.tsx)
const documentSchema = Yup.object().shape({
  title: Yup.string().required(),
  description: Yup.string(),
  file: Yup.mixed<File>()
    .required()
    .test('fileSize', 'Max 5MB', ...)
    .test('fileType', 'PDF/JPEG/PNG only', ...)
})
```

### Current Implementation
1. **Layouts**
   - Responsive sidebar navigation
   - Role-based menu items
   - User profile section
   - Clean header with page title
   - Mobile-friendly design

2. **Authentication**
   - JWT token management
   - Protected routes
   - Role-based access control
   - Persistent sessions
   - Remember me functionality
   - Password reset flow

3. **Document Management**
   - Drag-and-drop upload
   - File type validation
   - Size restrictions
   - Progress indicators
   - Document list view
   - Document visibility settings
   - Document categorization

4. **Form Handling**
   - Type-safe form validation
   - Error messages
   - Loading states
   - Async submission
   - Field-level validation
   - Form state persistence

5. **Customer Management**
   - Customer search and filtering
   - Customer creation and editing
   - Passport document handling
   - Booking history display
   - Statistics tracking (total bookings, spent, last booking)
   - Role-based booking display (charterer/guest)
   - Invitation link generation

6. **Booking Display**
   - Compact booking cards
   - Role-based styling
   - Essential information display (yacht, dates, location)
   - Click-through to booking details
   - Loading states and error handling
   - Guest list management
   - Document attachments

7. **Performance Optimizations**
   - React Query caching
   - Code splitting
   - Lazy loading
   - Service worker implementation
   - Error boundary handling
   - Memory leak prevention
   - State management optimization

### Dashboard Metrics Implementation

The admin dashboard now features enhanced analytics and booking displays:

1. **Key Metrics**
   ```typescript
   interface AdminDashboardStats {
     totalBookings: number
     activeCharters: number
     totalRevenue: number
     nextMonthBookings: number
   }
   ```

2. **Metric Calculation**
   ```typescript
   // Calculate active charters (confirmed with future end date)
   const activeCharters = bookings.filter(booking => 
     booking.status === 'confirmed' && 
     new Date(booking.endDate) >= now
   ).length

   // Calculate bookings starting in next month
   const nextMonthBookings = bookings.filter(booking => {
     const startDate = new Date(booking.startDate)
     return startDate >= now && startDate <= oneMonthLater
   }).length
   ```

3. **Upcoming Bookings Implementation**
   ```typescript
   // Get upcoming bookings (future start date, sorted by date)
   const upcomingBookings = bookings
     .filter(booking => new Date(booking.startDate) >= now)
     .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
     .slice(0, 5)
   ```

4. **Status Visualization**
   ```jsx
   <span className={`px-2 py-1 rounded-full text-xs ${
     booking.status === 'confirmed' 
       ? 'bg-green-100 text-green-800' 
       : booking.status === 'pending' 
       ? 'bg-yellow-100 text-yellow-800'
       : 'bg-blue-100 text-blue-800'
   }`}>
     {booking.status}
   </span>
   ```

5. **Loading State Optimization**
   ```typescript
   useEffect(() => {
     let isMounted = true

     async function loadDashboardData() {
       try {
         setIsLoading(true)
         // ... data fetching logic
         if (isMounted) {
           setStats(statsData)
           setRecentBookings(recentBookingsList)
           setUpcomingBookings(upcomingBookingsList)
         }
       } catch (error) {
         if (isMounted) {
           setError('Failed to load dashboard data. Please try again.')
         }
       } finally {
         if (isMounted) {
           setIsLoading(false)
         }
       }
     }

     loadDashboardData()
     return () => { isMounted = false }
   }, [])
   ```

### Next Technical Steps
1. WordPress API Integration
   - Create API service
   - Add endpoints
   - Handle authentication
   - Manage data sync

2. Real-time Features
   - WebSocket setup
   - Notification system
   - Live updates

3. Performance Optimization
   - Code splitting
   - Image optimization
   - Caching strategy
   - Bundle size reduction 

## Performance Optimizations

### 1. State Management
- **Auth Context Optimization**
  ```typescript
  // Use cleanup pattern in effects
  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async () => {
      if (!isMounted) return;
      // ... auth logic
    };

    initializeAuth();
    return () => { isMounted = false; };
  }, []);
  ```

- **React Query Configuration**
  ```typescript
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        gcTime: 1000 * 60 * 5,      // 5 minutes
        staleTime: 1000 * 60 * 1,    // 1 minute
      }
    }
  });
  ```

### 2. Component Optimization
- **Memoization Pattern**
  ```typescript
  // Memoize expensive computations
  const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);

  // Memoize callback functions
  const memoizedCallback = useCallback(() => {
    doSomething(a, b);
  }, [a, b]);
  ```

- **Layout Components**
  ```typescript
  // Optimize re-renders in layout components
  const navigationItems = useMemo(() => [
    { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
    // ... other items
  ], []);
  ```

### 3. Error Handling
- **Error Boundary Implementation**
  ```typescript
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
  ```

- **Error Recovery Pattern**
  ```typescript
  try {
    // Potentially failing operation
  } catch (error) {
    // Log error
    console.error('Operation failed:', error);
    // Show user-friendly message
    setError(error instanceof Error ? error.message : 'An error occurred');
    // Attempt recovery
    clearStorages();
  }
  ```

### 4. Caching Strategy
- **Service Worker Configuration**
  ```javascript
  const CACHE_STRATEGIES = {
    CACHE_FIRST: ['static', 'assets', 'images'],
    NETWORK_FIRST: ['api', 'dynamic-content'],
    STALE_WHILE_REVALIDATE: ['user-preferences']
  };
  ```

## Best Practices

### 1. Component Design
- Use TypeScript interfaces for props
- Implement proper cleanup in effects
- Memoize expensive computations
- Keep components focused and small
- Use composition over inheritance

### 2. State Management
- Use context sparingly
- Implement proper cleanup
- Handle loading and error states
- Use optimistic updates where appropriate
- Cache invalidation strategies

### 3. Performance Guidelines
- Lazy load routes and components
- Implement proper code splitting
- Use pagination for large lists
- Optimize images and assets
- Monitor bundle size

### 4. Error Handling
- Implement error boundaries
- Provide user-friendly error messages
- Log errors for debugging
- Implement proper recovery mechanisms
- Handle network errors gracefully

### 5. Testing Strategy
- Unit tests for utilities and hooks
- Integration tests for components
- End-to-end tests for critical flows
- Performance monitoring
- Cross-browser testing

## Implementation Patterns

### 1. Form Handling
```typescript
const formik = useFormik({
  initialValues,
  validationSchema,
  onSubmit: async (values, { setSubmitting }) => {
    try {
      await submitData(values);
    } catch (error) {
      handleError(error);
    } finally {
      setSubmitting(false);
    }
  },
});
```

### 2. Data Fetching
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['key', id],
  queryFn: () => fetchData(id),
  gcTime: 1000 * 60 * 5,
  staleTime: 1000 * 60 * 1,
});
```

### 3. Authentication Flow
```typescript
const handleLogin = async (credentials) => {
  try {
    const { token, user } = await authService.login(credentials);
    storeAuthData(token, user);
    queryClient.invalidateQueries();
  } catch (error) {
    handleAuthError(error);
  }
};
```

## Next Steps

### 1. Feature Implementation
- Complete booking management system
- Add yacht and destination management
- Implement real-time notifications
- Add payment processing

### 2. Performance Monitoring
- Implement performance tracking
- Monitor error rates
- Track user interactions
- Measure load times
- Monitor memory usage

### 3. Documentation
- Keep documentation up to date
- Document new features
- Update API documentation
- Maintain changelog
- Document testing procedures 