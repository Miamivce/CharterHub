<?php
/**
 * Script to remove WordPress users with the 'none' role
 * This script identifies and removes WordPress users that have the 'none' role
 */

// Define constant to avoid direct access errors
define('CHARTERHUB_LOADED', true);

// Include the database configuration
require_once __DIR__ . '/../backend/auth/config.php';

echo "Starting to remove WordPress users with 'none' role...\n\n";

try {
    // Connect to the database
    $pdo = get_db_connection();
    echo "Connected to database\n";
    
    // First, let's examine the structure of the meta_value to understand the format
    echo "Analyzing role formats in the database...\n";
    $stmt = $pdo->prepare("
        SELECT meta_value, COUNT(*) as count
        FROM {$db_config['table_prefix']}usermeta 
        WHERE meta_key = '{$db_config['table_prefix']}capabilities'
        GROUP BY meta_value
    ");
    $stmt->execute();
    $role_formats = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Found " . count($role_formats) . " different role formats:\n";
    foreach ($role_formats as $format) {
        echo "- {$format['meta_value']} (Count: {$format['count']})\n";
    }
    
    // Begin transaction for safety
    $pdo->beginTransaction();
    
    // Find WordPress users with 'none' role in wp_usermeta with different possible formats
    echo "\nIdentifying WordPress users with 'none' role\n";
    
    $stmt = $pdo->prepare("
        SELECT 
            u.ID, u.user_login, u.user_email, m.meta_value 
        FROM {$db_config['table_prefix']}users u
        JOIN {$db_config['table_prefix']}usermeta m ON u.ID = m.user_id
        WHERE m.meta_key = '{$db_config['table_prefix']}capabilities'
        AND (
            m.meta_value LIKE '%\"none\"%' OR
            m.meta_value LIKE '%:none;%' OR
            m.meta_value LIKE '%none%' OR
            m.meta_value = 'none' OR
            m.meta_value = 'a:0:{}'  -- empty serialized array, could mean no role
        )
    ");
    
    $stmt->execute();
    $none_wp_users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Found " . count($none_wp_users) . " WordPress users with 'none' role or no role\n";
    
    if (count($none_wp_users) > 0) {
        echo "The following WordPress users will be removed:\n";
        foreach ($none_wp_users as $user) {
            echo "- ID: {$user['ID']}, Login: {$user['user_login']}, Email: {$user['user_email']}, Role Value: {$user['meta_value']}\n";
        }
        
        // Get the list of IDs for deletion
        $wp_user_ids = array_column($none_wp_users, 'ID');
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
    } else {
        echo "No users with 'none' role found - no action needed\n";
    }
    
    // Commit all changes
    $pdo->commit();
    
    echo "\nRemoval of WordPress users with 'none' role completed successfully!\n";
    
} catch (PDOException $e) {
    // Roll back transaction on error
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo "Database error: " . $e->getMessage() . "\n";
    exit(1);
} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
} 