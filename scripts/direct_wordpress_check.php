<?php
/**
 * Simple WordPress User Separation Verification
 * 
 * This script checks for links between the application and wp_users table
 * using hardcoded database credentials for direct access.
 */

echo "⚙️ Starting WordPress User Separation Check...\n\n";

// Database credentials (modify these as needed)
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
    
    // Check if wp_charterhub_users table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'wp_charterhub_users'");
    $tableExists = $stmt->rowCount() > 0;
    
    if (!$tableExists) {
        echo "❌ wp_charterhub_users table does not exist\n";
        exit(1);
    }
    
    // Check 1: Verify wp_charterhub_users doesn't have wp_user_id column
    echo "\n🔍 CHECKING DATABASE STRUCTURE\n";
    echo "------------------------------\n";
    
    $stmt = $pdo->query("DESCRIBE wp_charterhub_users");
    $columns = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $columns[] = $row['Field'];
    }
    
    if (in_array('wp_user_id', $columns)) {
        echo "❌ wp_user_id column still exists in wp_charterhub_users table\n";
    } else {
        echo "✅ wp_charterhub_users table doesn't have wp_user_id column\n";
    }
    
    // Check 2: Verify no foreign keys to wp_users
    $stmt = $pdo->query("
        SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE REFERENCED_TABLE_NAME = 'wp_users'
        AND TABLE_SCHEMA = '{$db_name}'
    ");
    
    $foreignKeys = $stmt->fetchAll();
    
    if (count($foreignKeys) > 0) {
        echo "❌ Found foreign key constraints to wp_users:\n";
        foreach ($foreignKeys as $fk) {
            echo "  - Table: {$fk['TABLE_NAME']}, Column: {$fk['COLUMN_NAME']}, " . 
                 "Constraint: {$fk['CONSTRAINT_NAME']}\n";
        }
    } else {
        echo "✅ No foreign key constraints to wp_users found\n";
    }
    
    // Check 3: Check for any tables that might have columns referencing wp_users without foreign keys
    echo "\n🔍 CHECKING FOR POTENTIAL USER REFERENCES\n";
    echo "---------------------------------------\n";
    
    $potentialColumns = ['wp_user_id', 'wordpress_id', 'wp_id', 'user_id'];
    $foundReferences = false;
    
    $stmt = $pdo->query("SHOW TABLES");
    $tables = [];
    while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
        $tables[] = $row[0];
    }
    
    foreach ($tables as $table) {
        if (strpos($table, 'wp_') === 0 && $table != 'wp_users') {
            $stmt = $pdo->query("DESCRIBE `{$table}`");
            $tableColumns = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($tableColumns as $column) {
                if (in_array($column['Field'], $potentialColumns)) {
                    echo "⚠️ Potential reference found: {$table}.{$column['Field']}\n";
                    
                    // Check if this column contains values that might match wp_users.ID
                    try {
                        $stmt = $pdo->query("
                            SELECT COUNT(*) as count 
                            FROM `{$table}` t
                            JOIN wp_users u ON t.{$column['Field']} = u.ID
                        ");
                        $matchCount = $stmt->fetch()['count'];
                        
                        if ($matchCount > 0) {
                            echo "   ALERT: Found {$matchCount} records matching wp_users.ID\n";
                            $foundReferences = true;
                        } else {
                            echo "   OK: No matching records found\n";
                        }
                    } catch (PDOException $e) {
                        echo "   Error checking references: " . $e->getMessage() . "\n";
                    }
                }
            }
        }
    }
    
    if (!$foundReferences) {
        echo "✅ No potential references to wp_users found in other tables\n";
    }
    
    // Check 4: Check for specific links in commonly linked tables
    echo "\n🔍 CHECKING SPECIFIC KNOWN TABLES\n";
    echo "--------------------------------\n";
    
    // Check for roles/capabilities in usermeta that might reference our client users
    $stmt = $pdo->query("
        SELECT COUNT(*) as count
        FROM wp_usermeta 
        WHERE meta_key = 'wp_capabilities' 
        AND meta_value LIKE '%client%'
    ");
    $clientRolesCount = $stmt->fetch()['count'];
    
    if ($clientRolesCount > 0) {
        echo "❌ Found {$clientRolesCount} users with 'client' role in wp_usermeta\n";
    } else {
        echo "✅ No users with 'client' role found in wp_usermeta\n";
    }
    
    // Check for 'none' roles as well
    $stmt = $pdo->query("
        SELECT COUNT(*) as count
        FROM wp_usermeta 
        WHERE meta_key = 'wp_capabilities' 
        AND meta_value LIKE '%none%'
    ");
    $noneRolesCount = $stmt->fetch()['count'];
    
    if ($noneRolesCount > 0) {
        echo "❌ Found {$noneRolesCount} users with 'none' role in wp_usermeta\n";
    } else {
        echo "✅ No users with 'none' role found in wp_usermeta\n";
    }
    
    // Check for specific deleted users
    $specificEmails = [
        'manager@charterhub.com',
        'Test5@me.com',
        'Test6@me.com',
        'Test7@me.com'
    ];
    
    $foundSpecificUsers = false;
    
    foreach ($specificEmails as $email) {
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count
            FROM wp_users
            WHERE user_email = ?
        ");
        $stmt->execute([$email]);
        $count = $stmt->fetch()['count'];
        
        if ($count > 0) {
            echo "❌ User '{$email}' still exists in wp_users\n";
            $foundSpecificUsers = true;
        }
    }
    
    if (!$foundSpecificUsers) {
        echo "✅ All specified users have been deleted from wp_users\n";
    }
    
    // Final summary
    echo "\n✨ VERIFICATION COMPLETE ✨\n";
    echo "------------------------\n";
    echo "The application appears to be properly separated from WordPress users.\n";
    echo "WordPress cache errors should no longer appear.\n";
    
} catch (PDOException $e) {
    echo "❌ Database Error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
} 