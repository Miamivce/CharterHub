<?php
/**
 * Script to check for database triggers on the wp_charterhub_users table
 */

// Include database configuration
require_once __DIR__ . '/backend/auth/config.php';

try {
    // Create PDO connection
    $pdo = get_db_connection();
    
    // Get the database name
    $stmt = $pdo->query("SELECT DATABASE()");
    $dbName = $stmt->fetchColumn();
    
    echo "Checking triggers in database: $dbName\n\n";
    
    // Query for triggers on the charterhub_users table
    $stmt = $pdo->query("
        SHOW TRIGGERS 
        WHERE `Table` = '{$db_config['table_prefix']}charterhub_users'
    ");
    
    $triggers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($triggers) > 0) {
        echo "Found " . count($triggers) . " triggers on the {$db_config['table_prefix']}charterhub_users table:\n\n";
        
        foreach ($triggers as $trigger) {
            echo "Trigger: " . $trigger['Trigger'] . "\n";
            echo "Event: " . $trigger['Event'] . "\n";
            echo "Table: " . $trigger['Table'] . "\n";
            echo "Statement: " . $trigger['Statement'] . "\n";
            echo "Timing: " . $trigger['Timing'] . "\n";
            echo "Created: " . $trigger['Created'] . "\n";
            echo "sql_mode: " . $trigger['sql_mode'] . "\n";
            echo "Definer: " . $trigger['Definer'] . "\n";
            echo "character_set_client: " . $trigger['character_set_client'] . "\n";
            echo "collation_connection: " . $trigger['collation_connection'] . "\n";
            echo "Database Collation: " . $trigger['Database Collation'] . "\n\n";
        }
    } else {
        echo "No triggers found on the {$db_config['table_prefix']}charterhub_users table.\n";
    }
    
    // Check for any constraints on the table
    echo "\nChecking for constraints on the table:\n";
    
    // Check for foreign keys
    $stmt = $pdo->query("
        SELECT 
            COLUMN_NAME, 
            CONSTRAINT_NAME, 
            REFERENCED_TABLE_NAME,
            REFERENCED_COLUMN_NAME
        FROM
            INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE
            TABLE_SCHEMA = '$dbName' AND
            TABLE_NAME = '{$db_config['table_prefix']}charterhub_users' AND
            REFERENCED_TABLE_NAME IS NOT NULL;
    ");
    
    $foreignKeys = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($foreignKeys) > 0) {
        echo "Found " . count($foreignKeys) . " foreign key constraints:\n\n";
        
        foreach ($foreignKeys as $fk) {
            echo "Column: " . $fk['COLUMN_NAME'] . "\n";
            echo "Constraint: " . $fk['CONSTRAINT_NAME'] . "\n";
            echo "References: " . $fk['REFERENCED_TABLE_NAME'] . "." . $fk['REFERENCED_COLUMN_NAME'] . "\n\n";
        }
    } else {
        echo "No foreign key constraints found.\n";
    }
    
    // Check for any check constraints
    $stmt = $pdo->query("
        SELECT *
        FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = '$dbName'
        AND TABLE_NAME = '{$db_config['table_prefix']}charterhub_users'
    ");
    
    $checkConstraints = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($checkConstraints) > 0) {
        echo "Found " . count($checkConstraints) . " check constraints:\n\n";
        
        foreach ($checkConstraints as $check) {
            echo "Constraint Name: " . $check['CONSTRAINT_NAME'] . "\n";
            echo "Check Clause: " . $check['CHECK_CLAUSE'] . "\n\n";
        }
    } else {
        echo "No check constraints found.\n";
    }
    
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
} 