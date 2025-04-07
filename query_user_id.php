<?php
/**
 * Simple script to query user details from wp_charterhub_users by ID
 */

// Include database configuration
require_once __DIR__ . '/backend/auth/config.php';

// Get user ID from command line argument
$userId = isset($argv[1]) ? intval($argv[1]) : null;

if (!$userId) {
    echo "Error: Please provide a user ID as a command line argument.\n";
    exit(1);
}

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
    
    // Query the user with the provided ID
    $stmt = $pdo->prepare("SELECT * FROM wp_charterhub_users WHERE id = :id");
    $stmt->execute(['id' => $userId]);
    
    $user = $stmt->fetch();
    
    if ($user) {
        echo "User found:\n";
        echo "ID: " . $user['id'] . "\n";
        echo "Email: " . $user['email'] . "\n";
        echo "First Name: " . $user['first_name'] . "\n";
        echo "Last Name: " . $user['last_name'] . "\n";
        echo "Phone Number: " . $user['phone_number'] . "\n";
        echo "Company: " . $user['company'] . "\n";
        echo "Role: " . $user['role'] . "\n";
        echo "Created: " . $user['created_at'] . "\n";
    } else {
        echo "No user found with ID $userId\n";
    }
    
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
} 