<?php
/**
 * Script to check the database schema for the wp_charterhub_users table
 */

// Include database configuration
require_once __DIR__ . '/backend/auth/config.php';

try {
    // Create PDO connection
    $pdo = get_db_connection();
    
    // Query the table schema
    $stmt = $pdo->query("DESCRIBE {$db_config['table_prefix']}charterhub_users");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Schema for {$db_config['table_prefix']}charterhub_users table:\n\n";
    echo str_repeat("-", 100) . "\n";
    echo sprintf("%-20s | %-20s | %-10s | %-10s | %-20s | %-10s\n", 
        "Field", "Type", "Null", "Key", "Default", "Extra");
    echo str_repeat("-", 100) . "\n";
    
    foreach ($columns as $column) {
        echo sprintf("%-20s | %-20s | %-10s | %-10s | %-20s | %-10s\n", 
            $column['Field'], 
            $column['Type'], 
            $column['Null'], 
            $column['Key'], 
            $column['Default'] ?? 'NULL', 
            $column['Extra']);
    }
    echo str_repeat("-", 100) . "\n";
    
    // Specifically check the role column
    $stmt = $pdo->query("SHOW COLUMNS FROM {$db_config['table_prefix']}charterhub_users WHERE Field = 'role'");
    $roleColumn = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($roleColumn) {
        echo "\nDetailed information for 'role' column:\n";
        foreach ($roleColumn as $key => $value) {
            echo "$key: " . ($value ?? 'NULL') . "\n";
        }
        
        // If it's an enum, extract the allowed values
        if (strpos($roleColumn['Type'], 'enum') === 0) {
            preg_match("/^enum\((.*)\)$/", $roleColumn['Type'], $matches);
            if (isset($matches[1])) {
                $values = str_getcsv($matches[1], ',', "'");
                echo "\nAllowed values for 'role':\n";
                foreach ($values as $value) {
                    echo "- $value\n";
                }
            }
        }
    } else {
        echo "\nRole column not found in the table schema.\n";
    }
    
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
} 