<?php
/**
 * Script to query all users from wp_charterhub_users in charterhub_local database
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
    
    // Query all users from the table
    $stmt = $pdo->query("SELECT * FROM wp_charterhub_users");
    $users = $stmt->fetchAll();
    
    if (count($users) > 0) {
        echo "Found " . count($users) . " users in wp_charterhub_users:\n\n";
        
        // Display each user in a detailed box format
        foreach ($users as $user) {
            echo "┌" . str_repeat("─", 80) . "┐\n";
            echo "│ USER #" . str_pad($user['id'], 5, " ", STR_PAD_LEFT) . str_repeat(" ", 67) . "│\n";
            echo "├" . str_repeat("─", 80) . "┤\n";
            
            // Basic info
            echo "│ Email:       " . str_pad($user['email'], 61, " ") . "│\n";
            echo "│ Name:        " . str_pad(($user['first_name'] . " " . $user['last_name']), 61, " ") . "│\n";
            echo "│ Display:     " . str_pad($user['display_name'] ?? 'N/A', 61, " ") . "│\n";
            echo "│ Role:        " . str_pad($user['role'] ?? 'N/A', 61, " ") . "│\n";
            
            // Contact & Business
            echo "│ Phone:       " . str_pad($user['phone_number'] ?? 'N/A', 61, " ") . "│\n";
            echo "│ Company:     " . str_pad($user['company'] ?? 'N/A', 61, " ") . "│\n";
            
            // Account info
            echo "│ Created:     " . str_pad($user['created_at'] ?? 'N/A', 61, " ") . "│\n";
            echo "│ Updated:     " . str_pad($user['updated_at'] ?? 'N/A', 61, " ") . "│\n";
            echo "│ Status:      " . str_pad(($user['active'] ?? 1 ? 'Active' : 'Inactive'), 61, " ") . "│\n";
            
            // End box
            echo "└" . str_repeat("─", 80) . "┘\n\n";
        }
    } else {
        echo "No users found in the wp_charterhub_users table\n";
    }
    
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
} 