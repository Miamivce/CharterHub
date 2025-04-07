<?php
// Define constant to avoid direct access errors
define('CHARTERHUB_LOADED', true);

// Include the database configuration
require_once __DIR__ . '/../backend/auth/config.php';

// List of email addresses to delete
$emails_to_delete = [
    'manager@charterhub.com',
    'Test5@me.com',
    'Test6@me.com',
    'Test7@me.com'
];

echo "Starting to delete specific WordPress users...\n\n";

try {
    // Connect to the database
    $pdo = get_db_connection();
    echo "Connected to database\n";
    
    // Begin transaction for safety
    $pdo->beginTransaction();
    
    // Find the WordPress users by email
    echo "Identifying WordPress users with specified email addresses\n";
    
    $placeholder_string = implode(',', array_fill(0, count($emails_to_delete), '?'));
    
    $stmt = $pdo->prepare("
        SELECT 
            ID, user_login, user_email 
        FROM {$db_config['table_prefix']}users
        WHERE user_email IN ($placeholder_string)
    ");
    
    $stmt->execute($emails_to_delete);
    $users_to_delete = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Found " . count($users_to_delete) . " WordPress users matching the specified email addresses\n";
    
    if (count($users_to_delete) > 0) {
        echo "The following WordPress users will be removed:\n";
        foreach ($users_to_delete as $user) {
            echo "- ID: {$user['ID']}, Login: {$user['user_login']}, Email: {$user['user_email']}\n";
        }
        
        // Get the list of IDs for deletion
        $wp_user_ids = array_column($users_to_delete, 'ID');
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
        echo "No users found with the specified email addresses - no action needed\n";
    }
    
    // Commit all changes
    $pdo->commit();
    
    echo "\nUser deletion completed successfully!\n";
    
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