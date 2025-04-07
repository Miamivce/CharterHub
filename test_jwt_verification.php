<?php
// Define CHARTERHUB_LOADED constant
define('CHARTERHUB_LOADED', true);
define('DEBUG_MODE', true);

// Include configuration and JWT handling
require_once 'backend/auth/config.php';
require_once 'backend/auth/jwt-fix.php';

// Enable error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Print the table prefix
echo "Table prefix from db_config: " . $GLOBALS['db_config']['table_prefix'] . "\n\n";

// Test a simple database query
try {
    $pdo = get_db_connection();
    
    // Test query to verify database connection
    echo "Testing database connection with a simple query:\n";
    $stmt = $pdo->query("SELECT DATABASE() as current_db");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Connected to database: " . $result['current_db'] . "\n\n";
    
    // Test query to verify wp_charterhub_users table
    echo "Testing wp_charterhub_users table:\n";
    $stmt = $pdo->query("SELECT COUNT(*) as user_count FROM wp_charterhub_users");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "User count: " . $result['user_count'] . "\n\n";
    
    // Test query to verify wp_jwt_tokens table
    echo "Testing wp_jwt_tokens table:\n";
    $stmt = $pdo->query("SELECT COUNT(*) as token_count FROM wp_jwt_tokens");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Token count: " . $result['token_count'] . "\n\n";
    
    // Test query to verify specific token
    echo "Testing specific token query:\n";
    $token_hash = '17446f6dcc845a99a48e45d1fdf39393d4b84b0fa819f57dff50e5db285c1198';
    $stmt = $pdo->prepare("SELECT COUNT(*) as token_count FROM wp_jwt_tokens WHERE token_hash = ?");
    $stmt->execute([$token_hash]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Token count for hash " . $token_hash . ": " . $result['token_count'] . "\n\n";
} catch (Exception $e) {
    echo "Database connection test error: " . $e->getMessage() . "\n\n";
}

// The token to verify
$jwt = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOjE1LCJlbWFpbCI6InRlc3QxMjNAZXhhbXBsZS5jb20iLCJmaXJzdE5hbWUiOiJUZXN0IiwibGFzdE5hbWUiOiJVc2VyIiwicGhvbmVOdW1iZXIiOiIiLCJjb21wYW55IjoiIiwicm9sZSI6ImNsaWVudCIsInZlcmlmaWVkIjp0cnVlLCJpYXQiOjE3NDE2ODM5ODIsImV4cCI6MTc0MTY4NzU4Mn0.doe-0ABL3fTAPyyAifZPIuSCtahYyjMy4Wlh8yZpzic';

// Compute token hash
$token_hash = hash('sha256', $jwt);
echo "Token hash: " . $token_hash . "\n\n";

// Check if token exists in database
try {
    $pdo = get_db_connection();
    
    // Print the SQL query with the actual table prefix
    $sql = "
        SELECT t.*, u.role, u.verified
        FROM {$GLOBALS['db_config']['table_prefix']}jwt_tokens t
        JOIN {$GLOBALS['db_config']['table_prefix']}charterhub_users u 
            ON t.user_id = u.id
        WHERE t.token_hash = ? 
        AND t.revoked = 0
        AND (t.expires_at > NOW() OR ?)
    ";
    echo "SQL query with actual table prefix:\n" . str_replace('?', "'$token_hash'", $sql) . "\n\n";
    
    // Use the exact same query as in improved_verify_jwt_token
    $stmt = $pdo->prepare($sql);
    
    $stmt->execute([$token_hash, true]); // true to allow expired tokens
    $token_data = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($token_data) {
        echo "Token found in database:\n";
        print_r($token_data);
    } else {
        echo "Token NOT found in database with hash: " . $token_hash . "\n";
        
        // Try with hardcoded table names
        echo "\nTrying with hardcoded table names:\n";
        $stmt = $pdo->prepare("
            SELECT t.*, u.role, u.verified
            FROM wp_jwt_tokens t
            JOIN wp_charterhub_users u 
                ON t.user_id = u.id
            WHERE t.token_hash = ? 
            AND t.revoked = 0
        ");
        
        $stmt->execute([$token_hash]);
        $token_data = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($token_data) {
            echo "Token found with hardcoded table names:\n";
            print_r($token_data);
        } else {
            echo "Token still not found with hardcoded table names\n";
        }
        
        // Check all tokens for this user
        echo "\nChecking all tokens for user ID 15:\n";
        $stmt = $pdo->prepare("
            SELECT t.*, u.id, u.role, u.verified
            FROM wp_jwt_tokens t
            JOIN wp_charterhub_users u 
                ON t.user_id = u.id
            WHERE u.id = 15
        ");
        
        $stmt->execute();
        $all_tokens = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (count($all_tokens) > 0) {
            foreach ($all_tokens as $token) {
                echo "Token hash: " . $token['token_hash'] . "\n";
            }
        } else {
            echo "No tokens found for user ID 15\n";
        }
    }
} catch (Exception $e) {
    echo "Database error: " . $e->getMessage() . "\n";
}

// Try to manually verify the token
try {
    echo "\nAttempting to verify token with improved_verify_jwt_token():\n";
    $payload = improved_verify_jwt_token($jwt, true); // Allow expired tokens
    echo "Token verified! Payload:\n";
    print_r($payload);
} catch (Exception $e) {
    echo "Token verification failed: " . $e->getMessage() . "\n";
    
    // Debug
    echo "\nDebugging token verification:\n";
    
    // Decode and display token parts
    $token_parts = explode('.', $jwt);
    $header = json_decode(base64url_decode($token_parts[0]), true);
    $payload = json_decode(base64url_decode($token_parts[1]), true);
    
    echo "Header:\n";
    print_r($header);
    
    echo "\nPayload:\n";
    print_r($payload);
    
    // Check token in database with direct SQL
    if ($pdo) {
        echo "\nChecking token in database with direct SQL:\n";
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as token_count 
            FROM wp_jwt_tokens 
            WHERE token_hash = ?
        ");
        $stmt->execute([$token_hash]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "Token count in database: " . $result['token_count'] . "\n";
    }
} 