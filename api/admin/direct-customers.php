<?php
/**
 * Direct Customers API Endpoint
 * 
 * Handles customer data operations for the admin API.
 * Supported HTTP methods: GET, POST, DELETE
 */

// Define constant to prevent direct access
define('CHARTERHUB_LOADED', true);

// Start output buffering to prevent header issues
ob_start();

// Define allowed origins for CORS
$allowed_origins = [
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://localhost:5173',
    'http://localhost:8080',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:8080',
    'https://charterhub.app',
    'https://staging.charterhub.app',
    'https://dev.charterhub.app',
    'https://charterhub.yachtstory.com',
    'https://staging-charterhub.yachtstory.com',
    'https://app.yachtstory.be',
    'https://admin.yachtstory.be',
    'https://www.admin.yachtstory.be',
    'http://admin.yachtstory.be',
    'https://yachtstory.be',
    'https://www.yachtstory.be',
    'https://charter-hub.vercel.app/'
];

// Get the request origin
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

// Log CORS check for debugging
error_log("DIRECT-CUSTOMERS.PHP - Request received from origin: $origin, method: " . $_SERVER['REQUEST_METHOD']);
error_log("DIRECT-CUSTOMERS.PHP - Checking CORS allowed origins. Origin=$origin, isAllowed=" . (in_array($origin, $allowed_origins) ? '1' : '0'));

// Set CORS headers directly for immediate handling
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header("Access-Control-Max-Age: 86400"); // Cache preflight for 24 hours
    
    error_log("DIRECT-CUSTOMERS.PHP - Set CORS headers for origin: $origin");
} else {
    error_log("DIRECT-CUSTOMERS.PHP - Origin not allowed: $origin");
}

// Handle preflight OPTIONS requests immediately before any other processing
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    error_log("DIRECT-CUSTOMERS.PHP - Handling OPTIONS preflight request directly");
    http_response_code(200);
    exit;
}

// Now include auth helper after handling OPTIONS requests
require_once __DIR__ . '/direct-auth-helper.php';

// Initialize response array
$response = [
    'success' => false,
    'message' => '',
    'data' => null
];

// Process the request through the secure handler
handle_admin_request(function($admin_user) {
    // Process request based on HTTP method
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            // Handle GET request to fetch customers
            return handleGetCustomers();
            
        case 'POST':
            // Handle POST request to create/update customer
            return handlePostCustomer();
            
        case 'DELETE':
            // Handle DELETE request to delete customer
            return handleDeleteCustomer();
            
        default:
            // Method not allowed
            throw new Exception("Method not allowed", 405);
    }
});

/**
 * Handle GET requests
 */
function handleGetCustomers() {
    // Get database connection
    $db = get_database_connection();
    
    // Check if a specific customer ID is requested
    $customerId = isset($_GET['id']) ? (int)$_GET['id'] : null;
    
    if ($customerId) {
        // Fetch a specific customer
        $stmt = $db->prepare("SELECT * FROM wp_charterhub_users WHERE id = ? AND role = 'client'");
        $stmt->bind_param("i", $customerId);
        $stmt->execute();
        $result = $stmt->get_result();
        $customer = $result->fetch_assoc();
        
        if (!$customer) {
            return [
                'success' => false,
                'message' => "Customer not found",
                'data' => null
            ];
        }
        
        // Format customer data for response
        $formattedCustomer = formatUserToCustomer($customer);
        
        return [
            'success' => true,
            'message' => "Customer retrieved successfully",
            'data' => $formattedCustomer
        ];
    } else {
        // Fetch all customers with pagination
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
        $offset = ($page - 1) * $limit;
        
        $stmt = $db->prepare("SELECT * FROM wp_charterhub_users WHERE role = 'client' ORDER BY created_at DESC LIMIT ?, ?");
        $stmt->bind_param("ii", $offset, $limit);
        $stmt->execute();
        $result = $stmt->get_result();
        $customers = [];
        
        while ($row = $result->fetch_assoc()) {
            $customers[] = formatUserToCustomer($row);
        }
        
        // Get total count for pagination
        $countResult = $db->query("SELECT COUNT(*) as total FROM wp_charterhub_users WHERE role = 'client'");
        $countRow = $countResult->fetch_assoc();
        $totalCount = $countRow['total'];
        
        return [
            'success' => true,
            'message' => "Customers retrieved successfully",
            'data' => [
                'customers' => $customers,
                'pagination' => [
                    'total' => $totalCount,
                    'page' => $page,
                    'limit' => $limit,
                    'pages' => ceil($totalCount / $limit)
                ]
            ]
        ];
    }
}

/**
 * Helper function to format user data to customer format
 * Maps wp_charterhub_users fields to expected customer format
 */
function formatUserToCustomer($user) {
    return [
        'id' => (int)$user['id'],
        'name' => $user['display_name'] ?? trim($user['first_name'] . ' ' . $user['last_name']),
        'email' => $user['email'] ?? '',
        'phone' => $user['phone_number'] ?? '',
        'address' => $user['address'] ?? '',
        'city' => $user['city'] ?? '',
        'country' => $user['country'] ?? '',
        'company' => $user['company'] ?? '',
        'notes' => $user['notes'] ?? '',
        'firstName' => $user['first_name'] ?? '',
        'lastName' => $user['last_name'] ?? '',
        'created_at' => $user['created_at'],
        'updated_at' => $user['updated_at'] ?? $user['created_at']
    ];
}

/**
 * Handle POST requests
 */
function handlePostCustomer() {
    // Get database connection
    $db = get_database_connection();
    
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        return [
            'success' => false,
            'message' => "Invalid input data",
            'data' => null
        ];
    }
    
    // Log the received data
    error_log("Request Body: " . print_r($input, true));
    
    // Check if updating existing customer
    $customerId = isset($input['id']) ? (int)$input['id'] : null;
    
    if ($customerId) {
        // Update existing customer
        $query = "UPDATE wp_charterhub_users SET ";
        $params = [];
        $types = "";
        
        // Build dynamic update query based on provided fields
        $updateFields = [];
        
        if (isset($input['firstName'])) {
            $updateFields[] = "first_name = ?";
            $params[] = $input['firstName'];
            $types .= "s";
        }
        
        if (isset($input['lastName'])) {
            $updateFields[] = "last_name = ?";
            $params[] = $input['lastName'];
            $types .= "s";
        }
        
        // Calculate display_name if first or last name is provided
        if (isset($input['firstName']) || isset($input['lastName'])) {
            // Get current values for fields not being updated
            if (!isset($input['firstName']) || !isset($input['lastName'])) {
                $currentStmt = $db->prepare("SELECT first_name, last_name FROM wp_charterhub_users WHERE id = ?");
                $currentStmt->bind_param("i", $customerId);
                $currentStmt->execute();
                $currentData = $currentStmt->get_result()->fetch_assoc();
                $currentStmt->close();
                
                if (!isset($input['firstName'])) $input['firstName'] = $currentData['first_name'];
                if (!isset($input['lastName'])) $input['lastName'] = $currentData['last_name'];
            }
            
            $displayName = trim($input['firstName'] . ' ' . $input['lastName']);
            $updateFields[] = "display_name = ?";
            $params[] = $displayName;
            $types .= "s";
        }
        
        if (isset($input['email'])) {
            $updateFields[] = "email = ?";
            $params[] = $input['email'];
            $types .= "s";
        }
        
        if (isset($input['phone'])) {
            $updateFields[] = "phone_number = ?";
            $params[] = $input['phone'];
            $types .= "s";
        }
        
        if (isset($input['address'])) {
            $updateFields[] = "address = ?";
            $params[] = $input['address'];
            $types .= "s";
        }
        
        if (isset($input['country'])) {
            $updateFields[] = "country = ?";
            $params[] = $input['country'];
            $types .= "s";
        }
        
        if (isset($input['company'])) {
            $updateFields[] = "company = ?";
            $params[] = $input['company'];
            $types .= "s";
        }
        
        if (isset($input['notes'])) {
            $updateFields[] = "notes = ?";
            $params[] = $input['notes'];
            $types .= "s";
        }
        
        if (empty($updateFields)) {
            return [
                'success' => false,
                'message' => "No fields to update",
                'data' => null
            ];
        }
        
        $updateFields[] = "updated_at = NOW()";
        
        $query .= implode(", ", $updateFields);
        $query .= " WHERE id = ?";
        
        $params[] = $customerId;
        $types .= "i";
        
        // Execute update query
        $stmt = $db->prepare($query);
        $stmt->bind_param($types, ...$params);
        $result = $stmt->execute();
        
        if ($result) {
            // Get updated customer
            $stmt = $db->prepare("SELECT * FROM wp_charterhub_users WHERE id = ?");
            $stmt->bind_param("i", $customerId);
            $stmt->execute();
            $customer = $stmt->get_result()->fetch_assoc();
            $stmt->close();
            
            return [
                'success' => true,
                'message' => "Customer updated successfully",
                'data' => formatUserToCustomer($customer)
            ];
        } else {
            return [
                'success' => false,
                'message' => "Failed to update customer: " . $db->error,
                'data' => null
            ];
        }
    } else {
        // Create new customer
        $password = $input['password'] ?? generatePassword();
        $username = $input['username'] ?? generateUsername($input['firstName'], $input['lastName']);
        
        $stmt = $db->prepare(
            "INSERT INTO wp_charterhub_users 
                (username, email, password, first_name, last_name, display_name, phone_number, 
                company, country, address, notes, role, verified, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'client', 1, NOW(), NOW())"
        );
        
        $displayName = trim($input['firstName'] . ' ' . $input['lastName']);
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        
        $stmt->bind_param("sssssssssss", 
            $username,
            $input['email'],
            $hashedPassword,
            $input['firstName'],
            $input['lastName'],
            $displayName,
            $input['phone'] ?? '',
            $input['company'] ?? '',
            $input['country'] ?? '',
            $input['address'] ?? '',
            $input['notes'] ?? ''
        );
        
        $result = $stmt->execute();
        
        if ($result) {
            $newId = $db->insert_id;
            
            // Get created customer
            $stmt = $db->prepare("SELECT * FROM wp_charterhub_users WHERE id = ?");
            $stmt->bind_param("i", $newId);
            $stmt->execute();
            $customer = $stmt->get_result()->fetch_assoc();
            $stmt->close();
            
            return [
                'success' => true,
                'message' => "Customer created successfully",
                'data' => formatUserToCustomer($customer)
            ];
        } else {
            return [
                'success' => false,
                'message' => "Failed to create customer: " . $db->error,
                'data' => null
            ];
        }
    }
}

/**
 * Generate a random password
 */
function generatePassword() {
    $length = 10;
    $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    $password = '';
    
    for ($i = 0; $i < $length; $i++) {
        $password .= $chars[rand(0, strlen($chars) - 1)];
    }
    
    // Add a special character
    $specials = '!@#$%^&*()_+';
    $password .= $specials[rand(0, strlen($specials) - 1)];
    
    return $password;
}

/**
 * Generate a username from first and last name
 */
function generateUsername($firstName, $lastName) {
    $base = strtolower($firstName . $lastName);
    $base = preg_replace('/[^a-z0-9]/', '', $base);
    
    // Add a random number suffix
    $suffix = '_' . rand(10000, 99999);
    
    return $base . $suffix;
}

/**
 * Handle DELETE requests
 */
function handleDeleteCustomer() {
    // Get database connection
    $db = get_database_connection();
    
    // Get customer ID from query params
    $customerId = isset($_GET['id']) ? (int)$_GET['id'] : null;
    
    if (!$customerId) {
        return [
            'success' => false,
            'message' => "Customer ID is required",
            'data' => null
        ];
    }
    
    // Delete customer
    $stmt = $db->prepare("DELETE FROM wp_charterhub_users WHERE id = ? AND role = 'client'");
    $stmt->bind_param("i", $customerId);
    $result = $stmt->execute();
    
    return [
        'success' => $result,
        'message' => $result ? "Customer deleted successfully" : "Failed to delete customer: " . $db->error,
        'data' => null
    ];
} 