<?php
// Define constant to avoid direct access errors
define('CHARTERHUB_LOADED', true);

// Include the database configuration
require_once __DIR__ . '/../backend/auth/config.php';

echo "Starting to completely separate CharterHub users from WordPress...\n\n";

try {
    // Connect to the database
    $pdo = get_db_connection();
    echo "Connected to database\n";
    
    // Begin transaction for safety
    $pdo->beginTransaction();
    
    // 1. First, find WordPress users with 'client' role to remove
    echo "Step 1: Identifying WordPress client users to remove\n";
    
    // WordPress stores user roles in wp_usermeta with meta_key = wp_capabilities
    $stmt = $pdo->prepare("
        SELECT 
            u.ID, u.user_login, u.user_email 
        FROM {$db_config['table_prefix']}users u
        JOIN {$db_config['table_prefix']}usermeta m ON u.ID = m.user_id
        WHERE m.meta_key = '{$db_config['table_prefix']}capabilities'
        AND m.meta_value LIKE '%client%'
    ");
    
    $stmt->execute();
    $client_wp_users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Found " . count($client_wp_users) . " WordPress users with 'client' role\n";
    
    if (count($client_wp_users) > 0) {
        echo "The following WordPress users will be removed:\n";
        foreach ($client_wp_users as $user) {
            echo "- ID: {$user['ID']}, Login: {$user['user_login']}, Email: {$user['user_email']}\n";
        }
        
        // Get the list of IDs for deletion
        $wp_user_ids = array_column($client_wp_users, 'ID');
        $id_placeholders = implode(',', array_fill(0, count($wp_user_ids), '?'));
        
        // Delete from wp_usermeta
        $stmt = $pdo->prepare("DELETE FROM {$db_config['table_prefix']}usermeta WHERE user_id IN ($id_placeholders)");
        $stmt->execute($wp_user_ids);
        $usermeta_deleted = $stmt->rowCount();
        
        // Delete from wp_users
        $stmt = $pdo->prepare("DELETE FROM {$db_config['table_prefix']}users WHERE ID IN ($id_placeholders)");
        $stmt->execute($wp_user_ids);
        $users_deleted = $stmt->rowCount();
        
        echo "Deleted " . $users_deleted . " users from wp_users\n";
        echo "Deleted " . $usermeta_deleted . " rows from wp_usermeta\n";
    }
    
    // 2. Check if wp_user_id column exists in charterhub_users table
    echo "\nStep 2: Removing wp_user_id column from charterhub_users table\n";
    
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
        
        // Drop the wp_user_id column
        $pdo->exec("ALTER TABLE $table_name DROP COLUMN wp_user_id");
        echo "Column wp_user_id successfully removed from $table_name\n";
    } else {
        echo "wp_user_id column does not exist in $table_name table - no action needed\n";
    }
    
    // 3. Identify and modify code that might be referencing wp_user_id
    echo "\nStep 3: Checking for code that might still try to sync users\n";
    
    $auth_files = [
        'admin-auth.php' => __DIR__ . '/../backend/auth/admin-auth.php',
        'is-authenticated.php' => __DIR__ . '/../backend/auth/is-authenticated.php'
    ];
    
    foreach ($auth_files as $filename => $filepath) {
        if (file_exists($filepath)) {
            echo "Found auth file: $filename\n";
            
            // We don't modify files here, just report findings for manual action
            $content = file_get_contents($filepath);
            
            if (strpos($content, 'wp_user_id') !== false) {
                echo "⚠️ File $filename contains references to wp_user_id and may need updating\n";
                
                $lines = explode("\n", $content);
                foreach ($lines as $i => $line) {
                    if (stripos($line, 'wp_user_id') !== false) {
                        echo "  Line " . ($i + 1) . ": " . trim($line) . "\n";
                    }
                }
            }
            
            if (strpos($content, 'wp_users') !== false || strpos($content, $db_config['table_prefix'] . 'users') !== false) {
                echo "⚠️ File $filename contains references to WordPress users table and may need updating\n";
            }
        }
    }
    
    // Commit all changes
    $pdo->commit();
    
    echo "\nUser separation completed successfully!\n";
    echo "WordPress client users have been removed, and the wp_user_id column has been dropped.\n";
    echo "Verify your application functions correctly after these changes.\n";
    
} catch (PDOException $e) {
    // Roll back transaction on error
    if ($pdo && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo "Database error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    if ($pdo && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo "Error: " . $e->getMessage() . "\n";
} 