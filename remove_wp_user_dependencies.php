<?php
// Define constant to avoid direct access errors
define('CHARTERHUB_LOADED', true);

// Include the database configuration
require_once __DIR__ . '/../backend/auth/config.php';

echo "Starting to remove WordPress user dependencies...\n";

try {
    // Connect to the database
    $pdo = get_db_connection();
    echo "Connected to database\n";
    
    // 1. Check if wp_user_id column exists in charterhub_users table
    echo "\nChecking wp_charterhub_users table structure...\n";
    $table_name = $db_config['table_prefix'] . 'charterhub_users';
    $stmt = $pdo->query("DESCRIBE $table_name");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $wp_user_id_exists = false;
    foreach ($columns as $col) {
        if ($col['Field'] === 'wp_user_id') {
            $wp_user_id_exists = true;
            break;
        }
    }
    
    if ($wp_user_id_exists) {
        echo "Found wp_user_id column in $table_name table\n";
        
        // 2. Remove the wp_user_id column
        $pdo->beginTransaction();
        try {
            // First update the table to remove this column
            echo "Removing wp_user_id column from $table_name...\n";
            $pdo->exec("ALTER TABLE $table_name DROP COLUMN wp_user_id");
            echo "Column wp_user_id successfully removed\n";
            
            $pdo->commit();
        } catch (PDOException $e) {
            $pdo->rollBack();
            echo "Error removing wp_user_id column: " . $e->getMessage() . "\n";
        }
    } else {
        echo "wp_user_id column does not exist in $table_name table - no action needed\n";
    }
    
    // 3. Now let's find and update key backend files to ensure they don't reference wp_users
    echo "\nNow checking key authentication files for WordPress user dependencies...\n";
    
    $files_to_check = [
        __DIR__ . '/../backend/auth/login.php',
        __DIR__ . '/../backend/auth/register.php',
        __DIR__ . '/../backend/auth/update-profile.php',
        __DIR__ . '/../backend/auth/is-authenticated.php',
        __DIR__ . '/../backend/auth/admin-auth.php',
        __DIR__ . '/../backend/auth/jwt-fix.php'
    ];
    
    foreach ($files_to_check as $file) {
        if (file_exists($file)) {
            $content = file_get_contents($file);
            
            // Check for wp_users references
            $wp_users_count = substr_count(strtolower($content), 'wp_users');
            $wp_user_id_count = substr_count(strtolower($content), 'wp_user_id');
            
            echo "File: " . basename($file) . "\n";
            echo "  wp_users references: $wp_users_count\n";
            echo "  wp_user_id references: $wp_user_id_count\n";
            
            // We're not automatically modifying these files as they might need careful consideration
            // But we're identifying them for manual review
        } else {
            echo "File not found: " . basename($file) . "\n";
        }
    }
    
    echo "\nCheck complete. Use this information to manually update the identified files.\n";
    
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
} 