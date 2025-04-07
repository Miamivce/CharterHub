<?php
/**
 * Simple script to query user details from wp_users and wp_usermeta
 */

// Include database configuration
require_once __DIR__ . '/backend/auth/config.php';

// Use the database config from the included file
try {
    // Create PDO connection
    $dsn = "mysql:host={$db_config['host']};port={$db_config['port']};dbname={$db_config['name']};charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    $pdo = new PDO($dsn, $db_config['user'], $db_config['pass'], $options);
    
    // Query the user with email test3@me.com from wp_users
    $stmt = $pdo->prepare("
        SELECT u.*, 
               fn.meta_value as first_name,
               ln.meta_value as last_name,
               p.meta_value as phone_number,
               c.meta_value as company
        FROM wp_users u
        LEFT JOIN wp_usermeta fn ON u.ID = fn.user_id AND fn.meta_key = 'first_name'
        LEFT JOIN wp_usermeta ln ON u.ID = ln.user_id AND ln.meta_key = 'last_name'
        LEFT JOIN wp_usermeta p ON u.ID = p.user_id AND p.meta_key = 'phone_number'
        LEFT JOIN wp_usermeta c ON u.ID = c.user_id AND c.meta_key = 'company'
        WHERE u.user_email = :email
    ");
    $stmt->execute(['email' => 'test3@me.com']);
    
    $user = $stmt->fetch();
    
    if ($user) {
        echo "User found in wp_users table:\n";
        echo "ID: " . $user['ID'] . "\n";
        echo "Email: " . $user['user_email'] . "\n";
        echo "Username: " . $user['user_login'] . "\n";
        echo "Display Name: " . $user['display_name'] . "\n";
        echo "First Name: " . ($user['first_name'] ?? 'Not set') . "\n";
        echo "Last Name: " . ($user['last_name'] ?? 'Not set') . "\n";
        echo "Phone: " . ($user['phone_number'] ?? 'Not set') . "\n";
        echo "Company: " . ($user['company'] ?? 'Not set') . "\n";
        echo "Registered: " . $user['user_registered'] . "\n";
        
        // Fetch user roles from user meta
        $stmt = $pdo->prepare("
            SELECT meta_value 
            FROM wp_usermeta 
            WHERE user_id = :user_id 
            AND meta_key = 'wp_capabilities'
        ");
        $stmt->execute(['user_id' => $user['ID']]);
        $capabilities = $stmt->fetchColumn();
        
        echo "Capabilities: " . ($capabilities ?? 'None') . "\n";
    } else {
        echo "No user found in wp_users table with email test3@me.com\n";
    }
    
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
} 