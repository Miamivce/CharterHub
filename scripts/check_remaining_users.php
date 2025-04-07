<?php
// Define constant to avoid direct access errors
define('CHARTERHUB_LOADED', true);

// Include the database configuration
require_once __DIR__ . '/../backend/auth/config.php';

echo "Checking remaining WordPress users after cleanup...\n\n";

try {
    // Connect to the database
    $pdo = get_db_connection();
    echo "Connected to database\n";
    
    // Get all WordPress users with their roles
    $stmt = $pdo->prepare("
        SELECT 
            u.ID, 
            u.user_login, 
            u.user_email,
            m.meta_value as capabilities
        FROM {$db_config['table_prefix']}users u
        LEFT JOIN {$db_config['table_prefix']}usermeta m ON u.ID = m.user_id AND m.meta_key = '{$db_config['table_prefix']}capabilities'
        ORDER BY u.ID
    ");
    
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Found " . count($users) . " WordPress users remaining in the system:\n\n";
    
    echo "--------------------------------------------------------\n";
    echo "| ID | Email                | Login       | Role       |\n";
    echo "--------------------------------------------------------\n";
    
    foreach ($users as $user) {
        // Extract role from capabilities serialized string
        $role = 'none';
        if (!empty($user['capabilities'])) {
            // Try to parse the serialized roles
            if (strpos($user['capabilities'], 'administrator') !== false) {
                $role = 'administrator';
            } elseif (strpos($user['capabilities'], 'subscriber') !== false) {
                $role = 'subscriber';
            } elseif (strpos($user['capabilities'], 'client') !== false) {
                $role = 'client';
            } elseif (strpos($user['capabilities'], 'author') !== false) {
                $role = 'author';
            } elseif (strpos($user['capabilities'], 'editor') !== false) {
                $role = 'editor';
            } elseif (strpos($user['capabilities'], 'contributor') !== false) {
                $role = 'contributor';
            }
        }
        
        // Format the table row with fixed width columns
        printf("| %-2d | %-20s | %-11s | %-10s |\n", 
            $user['ID'], 
            substr($user['user_email'], 0, 20), 
            substr($user['user_login'], 0, 11), 
            $role
        );
    }
    
    echo "--------------------------------------------------------\n\n";
    
    // Count users by role
    $roles = [];
    foreach ($users as $user) {
        // Extract role from capabilities serialized string
        $role = 'none';
        if (!empty($user['capabilities'])) {
            if (strpos($user['capabilities'], 'administrator') !== false) {
                $role = 'administrator';
            } elseif (strpos($user['capabilities'], 'subscriber') !== false) {
                $role = 'subscriber';
            } elseif (strpos($user['capabilities'], 'client') !== false) {
                $role = 'client';
            } elseif (strpos($user['capabilities'], 'author') !== false) {
                $role = 'author';
            } elseif (strpos($user['capabilities'], 'editor') !== false) {
                $role = 'editor';
            } elseif (strpos($user['capabilities'], 'contributor') !== false) {
                $role = 'contributor';
            }
        }
        
        if (!isset($roles[$role])) {
            $roles[$role] = 0;
        }
        
        $roles[$role]++;
    }
    
    echo "User count by role:\n";
    foreach ($roles as $role => $count) {
        echo "- $role: $count users\n";
    }
    
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
    exit(1);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1); 