<?php
/**
 * Script to query user with ID 23 from wp_charterhub_users
 */

// Include database configuration
require_once __DIR__ . '/backend/auth/config.php';

// Use the database config from the included file
try {
    // Create PDO connection with the correct parameter names
    $dsn = "mysql:host={$db_config['host']};port={$db_config['port']};dbname={$db_config['name']};charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    $pdo = new PDO($dsn, $db_config['user'], $db_config['pass'], $options);
    
    // Query the user with ID 23
    $stmt = $pdo->prepare("SELECT * FROM wp_charterhub_users WHERE id = :id");
    $stmt->execute(['id' => 23]);
    
    $user = $stmt->fetch();
    
    if ($user) {
        echo "User ID 23 found:\n";
        echo "ID: " . $user['id'] . "\n";
        echo "Email: " . $user['email'] . "\n";
        echo "First Name: " . $user['first_name'] . "\n";
        echo "Last Name: " . $user['last_name'] . "\n";
        echo "Display Name: " . $user['display_name'] . "\n";
        echo "Role: " . $user['role'] . "\n";
        echo "Created: " . $user['created_at'] . "\n";
        
        // Include any additional fields that might be useful
        if (isset($user['phone_number'])) {
            echo "Phone: " . $user['phone_number'] . "\n";
        }
        if (isset($user['company'])) {
            echo "Company: " . $user['company'] . "\n";
        }
    } else {
        echo "No user found with ID 23\n";
    }
    
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
}
?> 