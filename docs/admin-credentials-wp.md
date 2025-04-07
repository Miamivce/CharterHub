# WordPress Admin Authentication Integration Plan

## Overview

This document outlines the implementation plan for allowing WordPress admins from yachtstory.com to use their existing WordPress credentials to log into the CharterHub application. This feature will be implemented alongside the existing JWT authentication system.

## Current Status

**Implementation Status: Development Mode Active**

The admin authentication is currently operating in **development mode** with hardcoded test credentials (username: `admin`, password: `password`). This allows frontend development to continue while the WordPress REST API authentication challenges are being addressed.

## Requirements

1. WordPress admins should be able to log in using their existing WordPress credentials
2. A "Remember Me" checkbox should keep admins logged in for 30 days
3. Regular users should continue using the existing JWT authentication flow
4. Authentication should happen through a custom WordPress REST API endpoint

## Architecture

The admin authentication system consists of three main components:

1. **Frontend React Application**
   - Makes HTTP requests to the PHP backend middleware
   - Stores tokens and manages user sessions
   - Runs on port 3000+ in development

2. **PHP Backend Middleware** 
   - Runs on port 8001 (separate from client auth on port 8000)
   - Acts as intermediary between frontend and WordPress
   - Handles JWT token generation and refresh logic
   - Currently operates in development mode with hardcoded credentials

3. **WordPress Plugin**
   - Provides a REST API endpoint for admin authentication
   - Responsible for verifying WordPress admin credentials
   - Currently requires additional authentication to access

## Implementation Plan

### 1. Create WordPress REST API Endpoint

#### 1.1 Create Custom WordPress Plugin

✅ **COMPLETED:** Created a plugin in the WordPress installation to handle admin authentication:

```php
<?php
/**
 * Plugin Name: CharterHub Admin Authentication
 * Description: Provides REST API endpoints for authenticating WordPress admins with CharterHub
 * Version: 1.0.0
 * Author: CharterHub Team
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class CharterHub_Admin_Auth {
    
    public function __construct() {
        add_action('rest_api_init', array($this, 'register_rest_routes'));
    }
    
    public function register_rest_routes() {
        register_rest_route('charterhub/v1', '/admin-login', array(
            'methods' => 'POST',
            'callback' => array($this, 'admin_login'),
            'permission_callback' => '__return_true',
        ));
    }
    
    public function admin_login($request) {
        // Get parameters
        $username = $request->get_param('username');
        $password = $request->get_param('password');
        
        if (empty($username) || empty($password)) {
            return new WP_Error(
                'missing_credentials',
                'Username and password are required',
                array('status' => 400)
            );
        }
        
        // Authenticate the user
        $user = wp_authenticate($username, $password);
        
        if (is_wp_error($user)) {
            return new WP_Error(
                'invalid_credentials',
                'Invalid username or password',
                array('status' => 401)
            );
        }
        
        // Check if user is an admin
        if (!user_can($user, 'administrator')) {
            return new WP_Error(
                'insufficient_permissions',
                'You must be an administrator to use this login method',
                array('status' => 403)
            );
        }
        
        // Return minimal user data
        return array(
            'user_id' => $user->ID,
            'role' => 'administrator',
            'display_name' => $user->display_name,
            'email' => $user->user_email
        );
    }
}

new CharterHub_Admin_Auth();
```

#### 1.2 Define Authentication Logic

✅ **COMPLETED:** Implemented the authentication logic in the WordPress plugin:

- Validates provided username and password
- Checks if the user has admin privileges
- Returns user data for authenticated admins or errors for failed attempts

### 2. Connect PHP Backend to WordPress

#### 2.1 Create PHP Middleware Endpoint

✅ **COMPLETED:** Created a PHP endpoint that acts as an intermediary between the frontend and WordPress:

```php
<?php
/**
 * Admin Login Endpoint for WordPress Administrators
 * 
 * This endpoint verifies admin credentials with WordPress and
 * issues a JWT token for the CharterHub application.
 */

require_once 'config.php';
header('Content-Type: application/json');

// Enable CORS for development
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header('Access-Control-Allow-Credentials: true');
}

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'])) {
        header('Access-Control-Allow-Methods: POST, OPTIONS');
    }
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'])) {
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
    }
    exit(0);
}

// Only allow POST method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

try {
    // Get input data
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validate input
    if (!isset($data['username']) || !isset($data['password'])) {
        throw new Exception('Username and password are required');
    }
    
    $username = $data['username'];
    $password = $data['password'];
    $remember_me = isset($data['remember_me']) && $data['remember_me'] === true;
    
    // Call WordPress REST API to verify admin credentials
    $wp_url = defined('WP_HOME') ? WP_HOME : 'http://localhost:8888';
    $admin_auth_url = "{$wp_url}/wp-json/charterhub/v1/admin-login";
    
    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => $admin_auth_url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode([
            'username' => $username,
            'password' => $password
        ]),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Accept: application/json'
        ]
    ]);
    
    $response = curl_exec($curl);
    $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);
    
    if ($status !== 200) {
        $error = json_decode($response, true);
        throw new Exception($error['message'] ?? 'Invalid credentials');
    }
    
    $admin_data = json_decode($response, true);
    
    // Check if we have a valid admin response
    if (!isset($admin_data['user_id']) || !isset($admin_data['role']) || $admin_data['role'] !== 'administrator') {
        throw new Exception('Invalid admin credentials');
    }
    
    // Get admin user from our local database or create if doesn't exist
    $stmt = $pdo->prepare("
        SELECT * FROM {$db_config['table_prefix']}users 
        WHERE wp_user_id = :wp_user_id
    ");
    $stmt->execute(['wp_user_id' => $admin_data['user_id']]);
    $admin_user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // If admin doesn't exist in our system, create a local record
    if (!$admin_user) {
        $stmt = $pdo->prepare("
            INSERT INTO {$db_config['table_prefix']}users 
            (user_login, user_email, display_name, role, verified, wp_user_id)
            VALUES (:username, :email, :display_name, 'administrator', 1, :wp_user_id)
        ");
        $stmt->execute([
            'username' => $username,
            'email' => $admin_data['email'],
            'display_name' => $admin_data['display_name'],
            'wp_user_id' => $admin_data['user_id']
        ]);
        
        $admin_user_id = $pdo->lastInsertId();
        
        // Fetch the newly created user
        $stmt = $pdo->prepare("SELECT * FROM {$db_config['table_prefix']}users WHERE ID = :id");
        $stmt->execute(['id' => $admin_user_id]);
        $admin_user = $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    // Set token expiration (30 days for "Remember Me", 1 hour default)
    $expiration_time = $remember_me ? 2592000 : $auth_config['jwt_expiration']; // 30 days or default
    
    // Generate JWT token
    $jwt_token = generate_jwt_token($admin_user, $expiration_time);
    $refresh_token = generate_token(64);
    
    // Update refresh token and login information
    $stmt = $pdo->prepare("
        UPDATE {$db_config['table_prefix']}users 
        SET refresh_token = :refresh_token,
            last_login = NOW(),
            last_ip = :last_ip,
            last_user_agent = :last_user_agent
        WHERE ID = :user_id
    ");
    $stmt->execute([
        'refresh_token' => $refresh_token,
        'last_ip' => $_SERVER['REMOTE_ADDR'],
        'last_user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
        'user_id' => $admin_user['ID']
    ]);
    
    // Log successful admin login
    log_auth_action(
        $admin_user['ID'],
        'admin_login',
        'success',
        [
            'ip_address' => $_SERVER['REMOTE_ADDR'],
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
            'wp_user_id' => $admin_data['user_id']
        ]
    );
    
    // Remove sensitive data
    unset($admin_user['user_pass']);
    unset($admin_user['verification_token']);
    unset($admin_user['reset_password_token']);
    unset($admin_user['refresh_token']);
    
    // Return success response
    echo json_encode([
        'success' => true,
        'message' => 'Admin login successful',
        'token' => $jwt_token,
        'refresh_token' => $refresh_token,
        'expires_in' => $expiration_time,
        'user' => $admin_user
    ]);
    
} catch (Exception $e) {
    // Log the error
    error_log("Admin login error: " . $e->getMessage());
    
    // Return error response
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
```

#### 2.2 Configure Development Mode for Testing

✅ **COMPLETED:** Implemented a development mode to allow testing without WordPress:

```php
// Development mode with test credentials:
// Username: admin
// Password: password
```

### 3. Implement Frontend Integration

✅ **COMPLETED:** Implemented frontend integration:

- Created admin login page at `/admin/login`
- Added support for "Remember Me" functionality (extends token validity to 30 days)
- Implemented token storage using localStorage/sessionStorage
- Added user session management

### 4. Testing & Validation

✅ **COMPLETED:**
- Created a comprehensive test script (`scripts/test-admin-auth.sh`)
- Verified development mode login works correctly
- Identified issues with WordPress REST API authentication

## Current Issues

1. **WordPress REST API Authentication**
   - The WordPress REST API requires a Bearer token for access
   - This creates a circular dependency for authentication
   - We need to authenticate with WordPress to verify admin credentials, but need to authenticate to access the WordPress API

2. **CORS Configuration**
   - WordPress currently only allows requests from `http://localhost:8888`
   - Need to update CORS in the WordPress plugin to allow requests from the PHP middleware

## Next Steps

1. **Continue Development with Dev Mode**
   - Use the current hardcoded credentials for frontend development
   - Run both PHP authentication servers (ports 8000 and 8001)

2. **Fix WordPress Authentication**
   - Update the WordPress plugin to allow unauthenticated access to the admin-login endpoint
   - Configure application passwords for WordPress REST API authentication
   - Add proper CORS headers to WordPress

3. **Production Deployment Configuration**
   - Update the middleware to use production WordPress URL
   - Ensure proper security measures are in place
   - Implement proper error handling for production

4. **Documentation & Training**
   - Update architecture diagrams and technical documentation
   - Provide training for administrators on the new login process

## References

- Admin Authentication Flow Diagram: `docs/admin-auth-flow.md`
- Current Status Document: `docs/admin-auth-current-status.md`
- Test Script: `scripts/test-admin-auth.sh`

## Implementation Timeline

1. Day 1: Create WordPress REST API plugin and test
2. Day 2: Create backend admin-login.php endpoint and database modifications
3. Day 3: Develop frontend components and update Auth Context
4. Day 4: Create WordPress admin redirect plugin
5. Day 5: Comprehensive testing and bug fixes
6. Day 6: Documentation and deployment preparation

## Conclusion

This implementation allows WordPress admins to use their existing credentials to access the CharterHub application while maintaining the security and functionality of the current authentication system. The "Remember Me" feature provides convenience for administrators while keeping security in mind.

The plan provides a complete roadmap for implementing this integration, from the WordPress REST API endpoint to the frontend components and thorough testing procedures. 