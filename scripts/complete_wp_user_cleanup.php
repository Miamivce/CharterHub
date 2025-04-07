<?php
/**
 * Complete WordPress User Cleanup
 * 
 * This script performs a comprehensive cleanup of all remaining WordPress user links:
 * 1. Removes wp_user_id column from wp_charterhub_users table
 * 2. Removes foreign key constraints to wp_users
 * 3. Updates records in tables that reference wp_users IDs
 */

echo "⚙️ Starting Complete WordPress User Cleanup...\n\n";

// Database credentials
$db_host = '127.0.0.1:8889';
$db_name = 'charterhub_local';
$db_user = 'root';
$db_pass = 'root';

try {
    // Connect to the database
    $pdo = new PDO(
        "mysql:host={$db_host};dbname={$db_name};charset=utf8mb4",
        $db_user,
        $db_pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );
    
    echo "✅ Database connection established\n";
    
    // Start a transaction for safety
    $pdo->beginTransaction();
    
    // Step 1: Drop foreign key constraints to wp_users
    echo "\n🔄 DROPPING FOREIGN KEY CONSTRAINTS\n";
    echo "-----------------------------------\n";
    
    $stmt = $pdo->query("
        SELECT TABLE_NAME, CONSTRAINT_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE REFERENCED_TABLE_NAME = 'wp_users'
        AND TABLE_SCHEMA = '{$db_name}'
    ");
    
    $foreignKeys = $stmt->fetchAll();
    
    if (count($foreignKeys) > 0) {
        foreach ($foreignKeys as $fk) {
            echo "  - Dropping constraint {$fk['CONSTRAINT_NAME']} from {$fk['TABLE_NAME']}\n";
            
            $pdo->exec("
                ALTER TABLE `{$fk['TABLE_NAME']}`
                DROP FOREIGN KEY `{$fk['CONSTRAINT_NAME']}`
            ");
        }
    } else {
        echo "  No foreign key constraints found\n";
    }
    
    // Step 2: Update or clear wp_user_id connections
    echo "\n🔄 REMOVING WordPress User ID REFERENCES\n";
    echo "--------------------------------------\n";
    
    // 2.1: Handle wp_charterhub_users.wp_user_id column
    echo "  - Checking wp_charterhub_users table for wp_user_id column\n";
    
    $stmt = $pdo->query("DESCRIBE wp_charterhub_users");
    $columns = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $columns[] = $row['Field'];
    }
    
    if (in_array('wp_user_id', $columns)) {
        echo "  - Dropping wp_user_id column from wp_charterhub_users table\n";
        $pdo->exec("ALTER TABLE wp_charterhub_users DROP COLUMN wp_user_id");
    } else {
        echo "  - wp_user_id column not found in wp_charterhub_users table\n";
    }
    
    // 2.2: Check and update other tables with potential references
    $potentialTables = [
        'wp_charterhub_auth_logs' => 'user_id',
        'wp_charterhub_jwt_tokens' => 'user_id',
        'wp_charterhub_bookings' => 'customer_id'
    ];
    
    foreach ($potentialTables as $table => $column) {
        // First check if table exists
        $stmt = $pdo->query("SHOW TABLES LIKE '{$table}'");
        $tableExists = $stmt->rowCount() > 0;
        
        if (!$tableExists) {
            echo "  - Table {$table} does not exist, skipping\n";
            continue;
        }
        
        // Then check if column exists
        $stmt = $pdo->query("DESCRIBE `{$table}`");
        $tableColumns = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $tableColumns[] = $row['Field'];
        }
        
        if (in_array($column, $tableColumns)) {
            echo "  - Found potential WordPress user reference in {$table}.{$column}\n";
            
            // Check if it references wp_users
            try {
                $stmt = $pdo->query("
                    SELECT COUNT(*) as count 
                    FROM `{$table}` t
                    JOIN wp_users u ON t.{$column} = u.ID
                ");
                $matchCount = $stmt->fetch()['count'];
                
                if ($matchCount > 0) {
                    echo "    Found {$matchCount} records matching wp_users.ID\n";
                    
                    // Update the references to NULL
                    $pdo->exec("
                        UPDATE `{$table}` 
                        SET `{$column}` = NULL
                        WHERE `{$column}` IN (SELECT ID FROM wp_users)
                    ");
                    
                    echo "    Updated {$matchCount} records to remove wp_users references\n";
                } else {
                    echo "    No matching records found\n";
                }
            } catch (PDOException $e) {
                echo "    Error checking references: " . $e->getMessage() . "\n";
            }
        }
    }
    
    // Step 3: Remove any indexes on the affected columns to ensure they're completely disconnected
    echo "\n🔄 CHECKING AND REMOVING INDEXES\n";
    echo "------------------------------\n";
    
    foreach ($potentialTables as $table => $column) {
        // Check if table exists
        $stmt = $pdo->query("SHOW TABLES LIKE '{$table}'");
        $tableExists = $stmt->rowCount() > 0;
        
        if (!$tableExists) {
            continue;
        }
        
        // Get all indexes on the table
        $stmt = $pdo->query("SHOW INDEX FROM `{$table}`");
        $indexes = $stmt->fetchAll();
        
        foreach ($indexes as $index) {
            if ($index['Column_name'] === $column) {
                $indexName = $index['Key_name'];
                
                // Don't drop primary keys
                if ($indexName !== 'PRIMARY') {
                    echo "  - Dropping index {$indexName} from {$table}\n";
                    try {
                        $pdo->exec("ALTER TABLE `{$table}` DROP INDEX `{$indexName}`");
                    } catch (PDOException $e) {
                        echo "    Error dropping index: " . $e->getMessage() . "\n";
                    }
                }
            }
        }
    }
    
    // Step 4: Verify cleanup
    echo "\n🔍 VERIFYING CLEANUP\n";
    echo "------------------\n";
    
    $stmt = $pdo->query("
        SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE REFERENCED_TABLE_NAME = 'wp_users'
        AND TABLE_SCHEMA = '{$db_name}'
    ");
    
    $foreignKeys = $stmt->fetchAll();
    
    if (count($foreignKeys) > 0) {
        echo "❌ Still found foreign key constraints to wp_users:\n";
        foreach ($foreignKeys as $fk) {
            echo "  - Table: {$fk['TABLE_NAME']}, Column: {$fk['COLUMN_NAME']}, " . 
                 "Constraint: {$fk['CONSTRAINT_NAME']}\n";
        }
        
        // Rollback if verification fails
        $pdo->rollBack();
        echo "❌ Rollback performed due to verification failure\n";
        exit(1);
    } else {
        echo "✅ No foreign key constraints to wp_users found\n";
    }
    
    // Commit changes
    $pdo->commit();
    
    echo "\n✨ CLEANUP COMPLETE ✨\n";
    echo "-------------------\n";
    echo "All WordPress user links have been successfully removed.\n";
    echo "The application is now completely separated from WordPress users.\n";
    
} catch (PDOException $e) {
    // Roll back if there's an error
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo "❌ Database Error: " . $e->getMessage() . "\n";
    exit(1);
} catch (Exception $e) {
    // Roll back if there's an error
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
} 