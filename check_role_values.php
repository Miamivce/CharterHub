<?php
/**
 * Script to check the role column in the wp_charterhub_users table
 */

// Include database configuration
require_once __DIR__ . '/backend/auth/config.php';

try {
    // Create PDO connection
    $pdo = get_db_connection();
    
    // Check the database engine and version
    $stmt = $pdo->query("SELECT VERSION()");
    $version = $stmt->fetchColumn();
    echo "Database version: $version\n\n";
    
    // Get more details about the role column
    $stmt = $pdo->query("
        SELECT *
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE 
            TABLE_SCHEMA = DATABASE() AND
            TABLE_NAME = '{$db_config['table_prefix']}charterhub_users' AND
            COLUMN_NAME = 'role'
    ");
    
    $roleDetails = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($roleDetails) {
        echo "Details for 'role' column:\n";
        foreach ($roleDetails as $key => $value) {
            echo "$key: " . ($value ?? 'NULL') . "\n";
        }
    } else {
        echo "No details found for the 'role' column.\n";
    }
    
    // Try to get validation rules if any
    echo "\nLooking for validation rules...\n";
    
    // Try to insert different role values directly
    echo "\nTesting direct insertion with different role values...\n";
    
    // Test roles to try
    $testRoles = ['user', 'admin', 'subscriber', 'client', 'charter_client'];
    
    // Start transaction
    $pdo->beginTransaction();
    
    try {
        // Create a temporary test table
        $pdo->exec("
            CREATE TEMPORARY TABLE temp_role_test (
                id INT AUTO_INCREMENT PRIMARY KEY,
                role VARCHAR(50) NOT NULL
            )
        ");
        
        echo "\nCreated temporary test table\n";
        
        // Try inserting each role
        foreach ($testRoles as $role) {
            try {
                $stmt = $pdo->prepare("INSERT INTO temp_role_test (role) VALUES (?)");
                $result = $stmt->execute([$role]);
                $success = $result ? "Success" : "Failed";
                echo "Inserting role '$role': $success\n";
            } catch (PDOException $e) {
                echo "Error inserting role '$role': " . $e->getMessage() . "\n";
            }
        }
        
        // Check what was actually inserted
        $stmt = $pdo->query("SELECT * FROM temp_role_test");
        $insertedRoles = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "\nRoles successfully inserted into test table:\n";
        foreach ($insertedRoles as $row) {
            echo "ID: {$row['id']}, Role: {$row['role']}\n";
        }
        
        // Test with different role values - directly in the real table
        echo "\nTesting with query to see if there's a check constraint:\n";
        $stmt = $pdo->prepare("
            EXPLAIN SELECT * FROM {$db_config['table_prefix']}charterhub_users
            WHERE role = ?
        ");
        
        foreach ($testRoles as $role) {
            try {
                $stmt->execute([$role]);
                $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $rowCount = count($result);
                echo "Query with role='$role': Success (potential rows: $rowCount)\n";
            } catch (PDOException $e) {
                echo "Query error with role='$role': " . $e->getMessage() . "\n";
            }
        }
        
        // Check if there's an enum constraint in the create table statement
        $stmt = $pdo->query("SHOW CREATE TABLE {$db_config['table_prefix']}charterhub_users");
        $createTable = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (isset($createTable['Create Table'])) {
            echo "\nTable creation statement:\n";
            echo $createTable['Create Table'] . "\n";
            
            // Extract the role column definition
            if (preg_match('/`role`[^,]+/', $createTable['Create Table'], $matches)) {
                echo "\nRole column definition:\n";
                echo $matches[0] . "\n";
            }
        }
        
    } finally {
        // Rollback to ensure we don't make any changes
        $pdo->rollBack();
        echo "\nRolled back transaction (no changes made to database)\n";
    }
    
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
} 