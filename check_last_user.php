<?php
/**
 * Script to check if the last registered user was saved to the database
 */

// Include database configuration
require_once __DIR__ . '/backend/auth/config.php';

try {
    // Create PDO connection
    $pdo = get_db_connection();
    
    // Query for the last registered user
    $stmt = $pdo->prepare("SELECT * FROM {$db_config['table_prefix']}charterhub_users WHERE email = :email");
    $stmt->execute(['email' => 'test_user123@example.com']);
    
    $user = $stmt->fetch();
    
    if ($user) {
        echo "User found:\n";
        echo "ID: " . $user['id'] . "\n";
        echo "Email: " . $user['email'] . "\n";
        echo "First Name: " . $user['first_name'] . "\n";
        echo "Last Name: " . $user['last_name'] . "\n";
        echo "Created: " . $user['created_at'] . "\n";
    } else {
        echo "No user found with email test_user123@example.com\n";
    }
    
    // Get the most recent user
    $stmt = $pdo->query("SELECT * FROM {$db_config['table_prefix']}charterhub_users ORDER BY id DESC LIMIT 1");
    $latestUser = $stmt->fetch();
    
    echo "\nMost recent user in the database:\n";
    echo "ID: " . $latestUser['id'] . "\n";
    echo "Email: " . $latestUser['email'] . "\n";
    echo "First Name: " . $latestUser['first_name'] . "\n";
    echo "Last Name: " . $latestUser['last_name'] . "\n";
    echo "Created: " . $latestUser['created_at'] . "\n";
    
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
} 