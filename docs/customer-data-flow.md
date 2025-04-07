# Customer Data Flow and Storage Architecture

## Overview

This document explains the customer data flow and storage architecture in the CharterHub application. Understanding this architecture is crucial for developers working on features that involve customer data, such as profile management, customer administration, and booking processes.

## Customer Data Types

The application uses several related customer data types:

1. **Customer**: Base customer type with essential fields
2. **CustomerWithPassport**: Extended customer type with additional fields like passport document ID 
3. **CustomerWithStats**: Customer with additional statistics for the admin dashboard
4. **ClientUser**: Used in the authentication context for customer login sessions

## Storage Locations

Customer data is stored in multiple locations:

1. **charterhub_mock_customers**: Stores admin-created customers (non-self-registered)
2. **charterhub_registered_customers**: Stores self-registered customers
3. **dev_users**: Used by the authentication system for login management
4. **user_data**: Current user's session data (localStorage and sessionStorage)
5. **charterhub_mock_users**: Legacy storage for mock users

## Data Flow Diagram

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  AuthContext    │◄────►│ CustomerService │◄────►│    API Layer    │
│                 │      │                 │      │                 │
└────────┬────────┘      └────────┬────────┘      └────────┬────────┘
         │                        │                        │
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  Local Storage  │◄────►│ Session Storage │◄────►│  Backend API    │
│                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

## Customer Lifecycle

### 1. Customer Creation

Customers can be created through:

- Admin dashboard (admin-created)
- Self-registration (self-registered)
- Booking process (admin-created)

When a customer is created:

1. A unique UUID-based ID is generated using `uuidv4()`
2. Customer data is stored in the appropriate storage location based on their origin
3. Customer data is synchronized with related storage locations

### 2. Customer Data Synchronization

The `syncCustomerWithLocalAuth` method in `CustomerService` ensures data consistency across different storage locations:

1. Creates a clean customer object with necessary fields
2. Syncs with `dev_users` for authentication
3. Syncs with `user_data` in both localStorage and sessionStorage
4. Syncs with `charterhub_mock_users` for legacy compatibility
5. Ensures the customer is in the correct array (mock or registered) based on their `selfRegistered` status

### 3. Customer Update Flow

When a customer profile is updated:

1. Update request is initiated through `AuthContext.updateProfile()` or admin dashboard
2. Customer data is updated in `customerService`
3. Updates are synchronized across all storage locations
4. For authenticated users, session data is also updated
5. If API mode is enabled, changes are sent to the backend API

### 4. Deduplication Process

The application includes mechanisms to prevent duplicate customers:

1. **Initialization Cleanup**: Runs when `CustomerService` is instantiated
2. **Periodic Cleanup**: Runs every 2 minutes to maintain data integrity
3. **Manual Cleanup**: Can be triggered when needed via `cleanup()` method

The deduplication process includes:

1. **ID Fixing**: Converts timestamp-based IDs to UUID format
2. **Email-based Deduplication**: Merges customers with the same email address
3. **Storage Location Correction**: Ensures customers are only in one storage array

## Helper Methods

### Customer Synchronization Methods

- `syncWithDevUsers`: Updates customer data in the authentication system
- `syncWithUserDataStorage`: Updates session data in localStorage and sessionStorage
- `syncWithMockUsers`: Updates legacy mock user data
- `updateCustomerInStorageArray`: Updates customer in a specific storage array with duplicate checking
- `removeFromStorageArray`: Removes a customer from a storage array by ID or email

### Deduplication Methods

- `deduplicateCustomersByEmail`: Groups customers by email and merges duplicates
- `ensureCustomerExistsInOnlyOneArray`: Ensures a customer only exists in one storage array
- `cleanupStoredCustomers`: Comprehensive cleanup that fixes IDs, deduplicates customers, and ensures correct storage location

## Best Practices for Developers

1. **Always use the CustomerService methods** for customer operations (create, read, update, delete)
2. **Never directly manipulate localStorage** for customer data
3. **Use the appropriate customer type** for each context (UI vs. API vs. Authentication)
4. **Handle customer data asynchronously** since operations may involve API calls
5. **Check for self-registration status** when working with customer data to ensure proper handling
6. **Call the cleanup method** when services are no longer needed to maintain data integrity

## Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| Customer updates not reflecting in admin dashboard | Ensure `syncCustomerWithLocalAuth` is called after updates |
| Duplicate customers in lists | Run `cleanupStoredCustomers` to deduplicate |
| React key warnings in customer components | Check for timestamp-based IDs and run ID fixing |
| Missing customer fields | Use proper type conversion between customer types |
| Customer in wrong list (mock vs. registered) | Check `selfRegistered` flag and run `ensureCustomerExistsInOnlyOneArray` |

## Future Improvements

1. Consolidate storage locations to reduce complexity
2. Implement a more robust data layer with proper state management
3. Add validation for customer data to prevent invalid states
4. Create migration utilities for easier upgrades
5. Implement server-side customer data validation 