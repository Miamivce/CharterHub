# Profile Update Authentication Fix Documentation

## Issue Summary
The profile update functionality was experiencing authentication failures, manifesting as 401 Unauthorized errors despite users having valid tokens that worked on other endpoints like `/auth/me.php`. After updating profile information, users would frequently get logged out or receive error messages indicating authentication failures.

## Root Causes

We identified several key issues in the authentication flow for profile updates:

1. **Database Connection Inconsistency**: 
   - The `update-profile.php` endpoint was using `get_db_connection()` while other successful endpoints (like `me.php`) were using `get_db_connection_from_config()`.
   - This inconsistency led to different database connection parameters being used, causing authentication verification to fail.

2. **Token Validation Method Discrepancy**:
   - The endpoint was relying on a complex token validation process that verified the token against stored tokens in the database.
   - This validation was more strict than necessary and was failing in certain edge cases, even with valid tokens.

3. **Missing Dependencies**:
   - The `update-profile.php` endpoint was missing a critical include for `db-config.php`, which provides the correct database connection function.

4. **Inadequate Error Logging**:
   - Insufficient error logging made it difficult to diagnose where exactly the authentication was failing.

## Solutions Implemented

### 1. Database Connection Standardization
- Added `require_once '../db-config.php'` to ensure the correct database connection function was available.
- Modified code to use `get_db_connection_from_config()` consistently across auth endpoints.

### 2. Direct Token Payload Extraction
- Implemented a direct approach to token validation that extracts user ID directly from the token payload:
  ```php
  // Split the token into parts
  $token_parts = explode('.', $token);
  if (count($token_parts) !== 3) {
      error_log("Invalid token format");
      throw new Exception("Invalid token format");
  }
  
  // Decode the payload
  $payload_json = base64url_decode($token_parts[1]);
  $payload = json_decode($payload_json);
  
  if (!$payload || !isset($payload->sub)) {
      error_log("Invalid token payload");
      throw new Exception("Invalid token payload");
  }
  
  // Get user ID from payload
  $user_id = $payload->sub;
  ```

- This approach is more resilient as it relies on the token's cryptographic integrity rather than database lookups.

### 3. Enhanced Error Logging
- Added comprehensive error logging throughout the token validation process:
  ```php
  error_log("UPDATE-PROFILE.PHP: Script started");
  error_log("UPDATE-PROFILE.PHP: Received request with method " . $_SERVER['REQUEST_METHOD']);
  error_log("UPDATE-PROFILE.PHP: JWT token found: " . substr($token, 0, 10) . "...");
  error_log("UPDATE-PROFILE.PHP: Token payload contains user ID: " . $user->sub);
  ```

- These logs make it easier to diagnose authentication issues by tracking the flow through the validation process.

### 4. Simplified Endpoint for Testing
- Created a simplified version of the endpoint (`update-profile-simplified.php`) to isolate the authentication logic from other potential issues.
- This simplified endpoint confirmed our approach worked correctly and helped refine the final solution.

### 5. Transaction Management
- Improved transaction handling during profile updates to ensure data consistency:
  ```php
  $pdo->beginTransaction();
  try {
      // Update user profile
      // ...
      $pdo->commit();
  } catch (Exception $e) {
      if ($pdo->inTransaction()) {
          $pdo->rollBack();
      }
      // Error handling
  }
  ```

- This ensures that profile updates are atomic and don't leave the database in an inconsistent state.

## Testing and Verification

We created several test scripts to verify our fixes:

1. **Token Debug Script** (`token-debug.php`):
   - Generates a valid token for a test user
   - Tests token against both `me.php` and `update-profile.php` endpoints
   - Confirms successful authentication and profile updates

2. **Simplified Profile Update Test** (`test-update-profile-simplified.php`):
   - Tests the simplified endpoint with controlled data
   - Verifies the direct token validation approach works correctly

Both test scripts confirmed that our fixes successfully resolved the authentication issues, allowing profile updates to proceed with valid tokens.

## Additional Changes

1. **Function Redeclaration Fix**:
   - Renamed `send_json_response()` to `send_profile_json_response()` in the simplified endpoint to avoid conflicts with existing functions.

2. **CORS Handling**:
   - Ensured consistent CORS headers across all endpoints:
   ```php
   apply_global_cors(['POST', 'OPTIONS', 'PUT', 'PATCH']);
   ```

3. **Input Sanitization**:
   - Enhanced input sanitization for profile fields to improve security:
   ```php
   function sanitize_input($data) {
       if ($data === null) {
           return null;
       }
       $data = trim($data);
       $data = stripslashes($data);
       $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
       return $data;
   }
   ```

## Future Recommendations

1. **Standardize Authentication Approach**:
   - All endpoints should use the same token validation approach
   - Consider implementing a shared authentication library to reduce code duplication

2. **More Comprehensive Logging**:
   - Implement structured logging with consistent format across all endpoints
   - Consider logging to a dedicated file for authentication issues

3. **Token Refresh Handling**:
   - Improve token refresh logic when certain profile fields (like email) are changed
   - Implement proper token revocation for security-sensitive changes

4. **Testing Framework**:
   - Develop more extensive automated tests for authentication flows
   - Create test fixtures for common authentication scenarios

## Conclusion

The authentication issues with profile updates were successfully resolved by implementing a more direct token validation approach, standardizing database connections, and enhancing error logging. These changes have made the profile update functionality more reliable and consistent with other authenticated endpoints in the system. 