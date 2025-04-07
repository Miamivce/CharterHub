# Authentication Best Practices Guide

## Overview

This document provides guidelines and best practices for implementing authentication functionality in CharterHub endpoints, based on our recent experiences and fixes. Following these practices will help maintain consistency and reliability across the system.

## Endpoint Development Checklist

When creating or modifying authentication-related endpoints, ensure the following:

### 1. Required Dependencies

- [ ] Include `db-config.php` for database connections
  ```php
  require_once '../db-config.php';
  ```
  
- [ ] Include `global-cors.php` and apply CORS headers early
  ```php
  require_once 'global-cors.php';
  apply_global_cors(['GET', 'POST', 'OPTIONS']); // Adjust methods as needed
  ```
  
- [ ] Include `jwt-fix.php` for token handling functions
  ```php
  require_once 'jwt-fix.php';
  ```

### 2. Database Connections

- [ ] **Always** use `get_db_connection_from_config()` for database connectivity
  ```php
  $pdo = get_db_connection_from_config();
  ```
  
- [ ] Create fresh connections for each major operation
  ```php
  // Connection for user validation
  $user_db = get_db_connection_from_config();
  
  // Fresh connection for profile updates
  $update_db = get_db_connection_from_config();
  ```

### 3. Token Validation

- [ ] Implement direct token payload extraction as the primary validation method
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
  
- [ ] Verify the user exists in the database after token validation
  ```php
  $stmt = $pdo->prepare("SELECT * FROM wp_charterhub_users WHERE id = ?");
  $stmt->execute([$user_id]);
  $user = $stmt->fetch(PDO::FETCH_ASSOC);
  
  if (!$user) {
      error_log("User not found for ID: $user_id");
      throw new Exception("User not found");
  }
  ```

### 4. Error Handling

- [ ] Implement comprehensive error logging
  ```php
  error_log("ENDPOINT_NAME: Detailed message about the current step");
  error_log("ENDPOINT_NAME: Variable value: " . json_encode($variable));
  ```
  
- [ ] Use standardized JSON responses for errors
  ```php
  function send_json_response($data, $status = 200) {
      // Clear any output buffering
      while (ob_get_level()) {
          ob_end_clean();
      }
      http_response_code($status);
      header('Content-Type: application/json');
      echo json_encode($data);
      exit;
  }
  
  // Using the function
  send_json_response([
      'success' => false,
      'message' => 'Authentication failed: ' . $e->getMessage(),
      'code' => 'auth_failed'
  ], 401);
  ```

### 5. Transaction Management

- [ ] Use transactions for data modifications
  ```php
  $pdo->beginTransaction();
  try {
      // Database operations...
      $pdo->commit();
  } catch (Exception $e) {
      if ($pdo->inTransaction()) {
          $pdo->rollBack();
      }
      // Error handling
  }
  ```

### 6. Input Sanitization

- [ ] Always sanitize input data
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
  
  // Usage
  $email = sanitize_input($data['email'] ?? '');
  ```

## Endpoint Structure Template

Use this template as a starting point for authentication-related endpoints:

```php
<?php
// Define CHARTERHUB_LOADED constant
define('CHARTERHUB_LOADED', true);
define('DEBUG_MODE', true);

// Include shared config and utilities
require_once 'config.php';
require_once 'global-cors.php';
apply_global_cors(['POST', 'OPTIONS', 'GET']); // Adjust as needed
require_once 'jwt-fix.php';
require_once '../db-config.php';

// Start error logging
error_log("ENDPOINT_NAME: Script started");

// Helper functions
function send_json_response($data, $status = 200) {
    while (ob_get_level()) {
        ob_end_clean();
    }
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function sanitize_input($data) {
    if ($data === null) {
        return null;
    }
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
    return $data;
}

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

// Validate request method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { // Adjust as needed
    send_json_response([
        'success' => false,
        'message' => 'Method not allowed',
        'code' => 'method_not_allowed'
    ], 405);
}

try {
    // Get the token from Authorization header
    $token = null;
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $auth_header = $_SERVER['HTTP_AUTHORIZATION'];
        if (preg_match('/Bearer\s(\S+)/', $auth_header, $matches)) {
            $token = $matches[1];
            error_log("ENDPOINT_NAME: Found token: " . substr($token, 0, 10) . "...");
        }
    }
    
    if (!$token) {
        error_log("ENDPOINT_NAME: No token found in Authorization header");
        send_json_response([
            'success' => false,
            'message' => 'Authentication required',
            'code' => 'auth_required'
        ], 401);
    }
    
    // Parse input data
    $input_json = file_get_contents('php://input');
    $data = json_decode($input_json, true);
    if (!$data) {
        error_log("ENDPOINT_NAME: Invalid JSON input");
        send_json_response([
            'success' => false,
            'message' => 'Invalid input data',
            'code' => 'invalid_input'
        ], 400);
    }
    
    // Validate token
    $token_parts = explode('.', $token);
    if (count($token_parts) !== 3) {
        error_log("ENDPOINT_NAME: Invalid token format");
        send_json_response([
            'success' => false,
            'message' => 'Invalid token format',
            'code' => 'token_invalid'
        ], 401);
    }
    
    // Decode payload
    $payload_json = base64url_decode($token_parts[1]);
    $payload = json_decode($payload_json);
    
    if (!$payload || !isset($payload->sub)) {
        error_log("ENDPOINT_NAME: Invalid token payload");
        send_json_response([
            'success' => false,
            'message' => 'Invalid token payload',
            'code' => 'token_invalid'
        ], 401);
    }
    
    // Get user ID and fetch user from database
    $user_id = $payload->sub;
    error_log("ENDPOINT_NAME: User ID from token: $user_id");
    
    $pdo = get_db_connection_from_config();
    $stmt = $pdo->prepare("SELECT * FROM wp_charterhub_users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        error_log("ENDPOINT_NAME: User not found for ID: $user_id");
        send_json_response([
            'success' => false,
            'message' => 'User not found',
            'code' => 'user_not_found'
        ], 401);
    }
    
    error_log("ENDPOINT_NAME: User found: {$user['email']}");
    
    // Main endpoint logic here...
    
    // Example: Return success response
    send_json_response([
        'success' => true,
        'message' => 'Operation successful',
        'user' => [
            'id' => (int)$user['id'],
            'email' => $user['email'],
            'firstName' => $user['first_name'],
            'lastName' => $user['last_name'],
            // Other fields as needed
        ]
    ]);
    
} catch (Exception $e) {
    error_log("ENDPOINT_NAME: Error: " . $e->getMessage());
    
    send_json_response([
        'success' => false,
        'message' => 'An error occurred: ' . $e->getMessage(),
        'code' => 'server_error'
    ], 500);
}
```

## Testing Authentication

For each authentication-related endpoint:

1. Test with a **valid token** for an **existing user**
2. Test with a **valid token** for a **non-existent user**
3. Test with an **invalid token** (malformed)
4. Test with an **expired token**
5. Test with **no token**

Use the existing test scripts as templates:
- `backend/test-me-endpoint.php`
- `backend/token-debug.php`
- `backend/test-update-profile-simplified.php`

## Common Pitfalls to Avoid

1. ❌ Using `get_db_connection()` instead of `get_db_connection_from_config()`
2. ❌ Forgetting to include `db-config.php`
3. ❌ Relying solely on database token validation
4. ❌ Insufficient error logging
5. ❌ Not checking for transaction state before rollback
6. ❌ Function name conflicts across endpoints
7. ❌ Inconsistent response formats
8. ❌ Missing CORS headers

## Resources

- [`docs/profile_update_fixes.md`](./profile_update_fixes.md) - Detailed documentation on profile update authentication fixes
- [`docs/test_scripts.md`](./test_scripts.md) - Documentation on available authentication test scripts
- [`docs/auth_migration_plan.md`](./auth_migration_plan.md) - Overall authentication migration plan 