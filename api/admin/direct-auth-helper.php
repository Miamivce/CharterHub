<?php
/**
 * Direct Auth Helper
 * 
 * This file provides authentication helper functions for the direct API endpoints.
 * It handles JWT token validation and admin authorization.
 */

// Don't allow direct access
if (!defined('CHARTERHUB_LOADED')) {
    die('Direct access not allowed');
}

// Include global CORS helper
require_once __DIR__ . '/../../auth/global-cors.php';

/**
 * Get database connection
 * 
 * @return mysqli Database connection
 */
function get_database_connection() {
    static $conn = null;
    
    if ($conn !== null) {
        return $conn;
    }
    
    try {
        // Database configuration
        $db_config = [
            'host' => getenv('DB_HOST') ?: 'mysql-charterhub-charterhub.c.aivencloud.com',
            'name' => getenv('DB_NAME') ?: 'defaultdb',
            'user' => getenv('DB_USER') ?: 'avnadmin',
            'pass' => getenv('DB_PASS') ?: 'AVNS_HCZbm5bZJE1L9C8Pz8C',
            'port' => getenv('DB_PORT') ?: '19174'
        ];
        
        // Create connection
        $conn = new mysqli(
            $db_config['host'],
            $db_config['user'],
            $db_config['pass'],
            $db_config['name'],
            $db_config['port']
        );
        
        // Check connection
        if ($conn->connect_error) {
            throw new Exception("Connection failed: " . $conn->connect_error);
        }
        
        return $conn;
    } catch (Exception $e) {
        error_log("Database connection exception: " . $e->getMessage());
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'message' => 'Database connection error',
            'error' => 'db_connection_error'
        ]);
        exit;
    }
}

/**
 * Manually validate JWT token
 * 
 * @param string $token JWT token
 * @return object|false Decoded token payload or false if invalid
 */
function validate_token_manual($token) {
    if (empty($token)) {
        return false;
    }
    
    // Split the token
    $token_parts = explode('.', $token);
    if (count($token_parts) !== 3) {
        return false;
    }
    
    // Decode payload
    $payload_json = base64_decode(str_replace(['-', '_'], ['+', '/'], $token_parts[1]));
    $payload = json_decode($payload_json);
    
    if (!$payload) {
        return false;
    }
    
    // Check expiration
    if (isset($payload->exp) && $payload->exp < time()) {
        return false;
    }
    
    return $payload;
}

/**
 * Extract and validate token from Authorization header
 * 
 * @return object Decoded token payload
 */
function get_validated_token() {
    $headers = getallheaders();
    $auth_header = isset($headers['Authorization']) ? $headers['Authorization'] : 
                  (isset($headers['authorization']) ? $headers['authorization'] : null);
    
    if (!$auth_header || !preg_match('/Bearer\s(\S+)/', $auth_header, $matches)) {
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'message' => 'Authorization header missing or invalid',
            'error' => 'auth_header_invalid'
        ]);
        http_response_code(401);
        exit;
    }
    
    $token = $matches[1];
    $payload = validate_token_manual($token);
    
    if (!$payload) {
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'message' => 'Invalid or expired token',
            'error' => 'token_invalid'
        ]);
        http_response_code(401);
        exit;
    }
    
    return $payload;
}

/**
 * Check if user is an admin
 * 
 * @return array Admin user info
 */
function ensure_admin_access() {
    // Get and validate token
    $payload = get_validated_token();
    
    // Check admin role
    if (!isset($payload->role) || $payload->role !== 'admin') {
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'message' => 'Admin access required',
            'error' => 'admin_required',
            'role' => $payload->role ?? 'none'
        ]);
        http_response_code(403);
        exit;
    }
    
    // Verify user exists in database
    $conn = get_database_connection();
    $user_id = $payload->sub;
    
    $stmt = $conn->prepare("SELECT id, email, role FROM wp_charterhub_users WHERE id = ? AND role = 'admin'");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if (!$result->num_rows) {
        $conn->close();
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'message' => 'Admin user not found in database',
            'error' => 'admin_not_found'
        ]);
        http_response_code(403);
        exit;
    }
    
    $user = $result->fetch_assoc();
    $stmt->close();
    $conn->close();
    
    return [
        'user_id' => $user_id,
        'email' => $user['email'],
        'role' => $user['role']
    ];
}

/**
 * Sanitize input data
 * 
 * @param mixed $data Input data
 * @return mixed Sanitized data
 */
if (!function_exists('sanitize_input')) {
    function sanitize_input($data) {
        if (is_array($data)) {
            return array_map('sanitize_input', $data);
        }
        return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
    }
}

/**
 * Send JSON response
 * 
 * @param mixed $data Response data
 * @param int $status HTTP status code
 */
if (!function_exists('json_response')) {
    function json_response($data, $status = 200) {
        header('Content-Type: application/json');
        http_response_code($status);
        echo json_encode($data);
        exit;
    }
}

/**
 * Check if user is admin (boolean version)
 * 
 * @return bool True if admin, false otherwise
 */
if (!function_exists('is_admin_user')) {
    function is_admin_user() {
        try {
            ensure_admin_access();
            return true;
        } catch (Exception $e) {
            return false;
        }
    }
}

/**
 * Handle admin API request with proper CORS handling
 * 
 * This function provides standardized handling for admin API endpoints:
 * 1. Applies CORS headers before any authentication
 * 2. Handles preflight OPTIONS requests immediately
 * 3. Only performs authentication for non-OPTIONS requests
 * 4. Provides consistent error handling and response format
 * 
 * @param callable $callback Function that contains the endpoint-specific logic
 * @return void
 */
function handle_admin_request($callback) {
    // 1. Apply global CORS headers immediately
    apply_cors_headers();
    
    // 2. Handle preflight requests before authentication
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
    
    // 3. Initialize response structure
    $response = [
        'success' => false,
        'message' => '',
        'data' => null
    ];
    
    try {
        // 4. Perform authentication only for non-OPTIONS requests
        $admin_user = ensure_admin_access();
        
        // 5. Execute endpoint-specific callback
        $result = $callback($admin_user);
        
        // 6. Set success response
        $response['success'] = true;
        $response['data'] = $result;
        
    } catch (Exception $e) {
        // Handle exceptions
        $response['message'] = $e->getMessage();
        $response['error'] = true;
        
        // Log the error
        error_log("Admin API exception: " . $e->getMessage());
    }
    
    // 7. Return JSON response
    header('Content-Type: application/json');
    echo json_encode($response);
    exit;
} 