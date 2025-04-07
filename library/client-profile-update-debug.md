# Client Profile Update Debugging Plan

## System Architecture

1. **Frontend Flow:**
   - Client visits `/client/profile`
   - Profile component loads user data from AuthContext
   - User edits profile fields and clicks "Save"
   - Frontend calls `auth.updateProfile()` in AuthContext
   - AuthContext makes API request to `/auth/update-profile.php`
   - Upon success, AuthContext attempts to sync with customerService

2. **Backend Flow:**
   - `/auth/update-profile.php` handles profile updates with dual authentication
   - Updates user in `wp_users` table and metadata in `wp_usermeta`
   - Returns updated user data and new tokens
   - `/customers/update.php` handles customer-specific updates
   - Updates same user data but focused on customer-specific fields

3. **Synchronization Issues:**
   - Client profile updates should sync to customer records
   - Customer records not showing in admin dashboard
   - Multiple database locations and possible inconsistencies

## Testing Steps

### 1. Debug Authentication Flow

```bash
# Test JWT token creation and validation
curl -X POST http://localhost:8000/auth/login.php \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com", "password":"password123"}' \
  --verbose

# Verify token with
curl -X GET http://localhost:8000/auth/me.php \
  -H "Authorization: Bearer [TOKEN]" \
  --verbose
```

### 2. Test Profile Update Endpoints Directly

```bash
# Test profile update endpoint
curl -X POST http://localhost:8000/auth/update-profile.php \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [TOKEN]" \
  -d '{"firstName":"Test","lastName":"User","phoneNumber":"1234567890","company":"Test Co"}' \
  --verbose

# Test customer update endpoint
curl -X POST "http://localhost:8000/customers/update.php?id=[USER_ID]" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [TOKEN]" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","phone":"1234567890","company":"Test Co"}' \
  --verbose
```

### 3. Frontend Console Testing

Add the following debug logs to frontend code:

```javascript
// In AuthContext.updateProfile method:
console.log('Profile update data:', data);
console.log('JWT token:', TokenStorage.getItem('auth_token'));
console.log('User before update:', user);

// After wpApi.updateProfile call:
console.log('API response:', updatedUser);
console.log('User after update:', typedUpdatedUser);

// In customer service sync section:
console.log('Starting customer service sync');
console.log('Customer found:', matchingCustomer);
console.log('Customer service sync result:', syncResult);
```

### 4. Network Request Analysis

1. Open browser devtools and go to Network tab
2. Apply these filters:
   - Filter for "update-profile.php" and "update.php"
   - Check for request/response headers and authentication tokens
   - Verify CORS configuration is correct
   - Check request payload format and response data

### 5. Database Verification

```sql
-- Verify user data in wp_users table
SELECT ID, user_email, display_name FROM wp_users WHERE ID = [USER_ID];

-- Verify user meta data
SELECT user_id, meta_key, meta_value FROM wp_usermeta 
WHERE user_id = [USER_ID] AND meta_key IN ('first_name', 'last_name', 'phone_number', 'company');
```

## Known Issues and Solutions

1. **JWT Token Validation**
   - Possible issue: Token not being sent or validated correctly
   - Solution: Ensure token is properly formatted and sent in Authorization header

2. **CORS Configuration**
   - Possible issue: CORS headers not allowing client requests
   - Solution: Verify CORS configuration in `cors-fix.php` and each endpoint

3. **Dual Authentication Issues**
   - Possible issue: `is_authenticated` function not handling both auth methods
   - Solution: Debug and ensure function handles JWT tokens for clients

4. **Customer Service Synchronization**
   - Possible issue: Customer sync failing after profile update
   - Solution: Ensure customer service can find the user by email

5. **Database Updates**
   - Possible issue: Database transactions rolling back or not committing
   - Solution: Add explicit error handling and transaction management

## Proposed Fixes

1. Add comprehensive logging to auth and customer update flows
2. Enhance error handling with specific error messages
3. Implement robust token validation and regeneration
4. Ensure consistent field names between frontend and backend
5. Add fallback mechanisms for customer sync failures 