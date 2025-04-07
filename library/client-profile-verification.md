# Client Profile Update Verification Guide

## Summary of Changes Made

1. **Enhanced Frontend Logging**
   - Added detailed logging in `AuthContext.updateProfile` to track the full profile update flow
   - Improved error handling with specific error messages and context
   - Added fallback mechanism to create a new customer record if synchronization fails
   - Fixed type issues with the `CustomerFormData` interface

2. **Improved Customer Service**
   - Enhanced the `customerService.ts` implementation with better error handling
   - Added retry mechanism for update requests
   - Improved email-based customer lookup with case-insensitive comparison
   - Added more detailed logging throughout the service

3. **Backend Endpoint Improvements**
   - Added comprehensive logging in `/auth/update-profile.php`
   - Enhanced error handling with detailed error messages
   - Added input validation and sanitization
   - Improved transaction management
   - Added similar improvements to `/customers/update.php`

## Verification Process

### 1. Client Profile Update Test

1. **Login as a Client**
   - Open browser and navigate to the client login page
   - Login with client credentials
   - Verify successful login (should redirect to client dashboard)

2. **Update Profile Information**
   - Navigate to the client profile page (usually at `/client/profile`)
   - Click the "Edit" button
   - Make changes to fields (first name, last name, phone, company)
   - Click "Save" button
   - Watch for any console errors during this process (F12 developer tools)

3. **Verify Changes in UI**
   - The profile form should update successfully with no errors
   - Changes should be reflected in the UI immediately
   - A success toast notification should appear

4. **Verify Changes in Database**
   - Run the following SQL query to check `wp_users` and `wp_usermeta` tables:
   ```sql
   SELECT u.ID, u.user_email, u.display_name, 
          fn.meta_value as first_name, 
          ln.meta_value as last_name,
          p.meta_value as phone,
          c.meta_value as company
   FROM wp_users u
   LEFT JOIN wp_usermeta fn ON u.ID = fn.user_id AND fn.meta_key = 'first_name'
   LEFT JOIN wp_usermeta ln ON u.ID = ln.user_id AND ln.meta_key = 'last_name'
   LEFT JOIN wp_usermeta p ON u.ID = p.user_id AND p.meta_key = 'phone'
   LEFT JOIN wp_usermeta c ON u.ID = c.user_id AND c.meta_key = 'company'
   WHERE u.ID = [YOUR_USER_ID];
   ```
   - Verify that the changes match what you entered in the form

### 2. Network Request Analysis

1. **Open Network Tab**
   - In browser dev tools, go to the Network tab
   - Filter for "update-profile.php"
   - Make another profile change
   - Observe the request/response

2. **Verify Request Structure**
   - The request should be a POST to `/auth/update-profile.php`
   - Should include Authorization header with Bearer token
   - Request payload should include the fields you modified

3. **Verify Response Structure**
   - Status code should be 200 OK
   - Response should include:
     - `success: true`
     - `user` object with updated information
     - `tokens` object with new access and refresh tokens

### 3. Customer Service Synchronization

1. **Verify Customer Record**
   - Run the following SQL query to check customer data synchronization:
   ```sql
   SELECT * FROM wp_users u
   INNER JOIN charterhub_registered_customers c ON u.user_email = c.email
   WHERE u.ID = [YOUR_USER_ID];
   ```
   - Verify that data is consistent between user and customer tables

2. **Check Admin Dashboard**
   - Login as an admin user
   - Navigate to the admin dashboard's customer section
   - Verify that the client appears in the list with correct information
   - Open the client's details to verify all fields are synchronized correctly

### 4. Console Log Analysis

Check the browser console and PHP error logs for the following success indicators:

1. **Frontend Logs**
   - `[AuthContext] Starting profile update with data:`
   - `[AuthContext] Making API request to update profile`
   - `[AuthContext] API response for profile update:`
   - `[AuthContext] Updated user data in storage`
   - `[AuthContext] Starting API customer service sync`
   - `[AuthContext] Customer match found for API sync?`
   - `[AuthContext] Successfully synchronized API user profile with customer record`
   - `[AuthContext] Profile update operation complete`

2. **Backend Logs**
   - `UPDATE-PROFILE.PHP: User authenticated`
   - `UPDATE-PROFILE.PHP: Updating user meta data for user`
   - `UPDATE-PROFILE.PHP: Updating meta key`
   - `CUSTOMERS/UPDATE.PHP: Updating user in wp_users table`
   - `CUSTOMERS/UPDATE.PHP: Successfully updated wp_users table`

### 5. Error Scenarios to Check

1. **Network Interruption**
   - Disable network temporarily during save
   - Re-enable network and try again
   - Verify that retry mechanism works

2. **Invalid Data**
   - Try to submit invalid data (very long strings, empty required fields)
   - Verify proper validation and error handling

3. **Missing Customer Record**
   - Create a new client user without a corresponding customer record
   - Update profile and verify that a new customer record is created

## Troubleshooting

If issues persist, check the following:

1. **Authentication Issues**
   - Verify token format in request headers
   - Check for token expiration
   - Ensure CORS configuration is correct

2. **Database Connectivity**
   - Check database connection parameters
   - Verify user permissions for database operations

3. **API Endpoint Configuration**
   - Verify URL configuration in frontend services
   - Check for any proxy or routing issues

4. **Client-Side Storage**
   - Check browser localStorage and sessionStorage
   - Verify token and user data are being stored correctly

5. **PHP Error Logs**
   - Check server error logs for PHP exceptions
   - Look for transaction rollbacks or SQL errors 