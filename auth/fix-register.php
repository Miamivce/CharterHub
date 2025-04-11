<?php
/**
 * CharterHub Registration Fix
 * 
 * This script patches the registration issues by using the correct table names
 */

// Set error display settings for diagnostics
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Define a constant to prevent direct access to included files
define('CHARTERHUB_LOADED', true);

// Set content type to JSON for easier parsing
header('Content-Type: application/json');

// Results storage
$results = [
    'status' => 'running',
    'timestamp' => date('Y-m-d H:i:s'),
    'fixes' => []
];

/**
 * Add a message to the output
 */
function addMessage($message) {
    global $results;
    $results['messages'][] = $message;
    echo $message . "\n";
    flush();
}

try {
    // Include database utilities
    require_once __DIR__ . '/../utils/database.php';
    addMessage("✅ Database utilities loaded successfully");
    
    // Test database connection
    try {
        $pdo = getDbConnection();
        addMessage("✅ Database connection established successfully");
        
        // Check which tables exist
        $stmt = $pdo->query("SHOW TABLES LIKE 'wp_charterhub_users'");
        $wp_table_exists = $stmt->rowCount() > 0;
        
        $stmt = $pdo->query("SHOW TABLES LIKE 'charterhub_users'");
        $table_exists = $stmt->rowCount() > 0;
        
        if ($wp_table_exists) {
            addMessage("✅ Table wp_charterhub_users exists");
        } else {
            addMessage("❌ Table wp_charterhub_users does not exist");
        }
        
        if ($table_exists) {
            addMessage("ℹ️ Table charterhub_users exists");
        } else {
            addMessage("ℹ️ Table charterhub_users does not exist");
        }
        
        // If both exist, we should sync them
        if ($wp_table_exists && $table_exists) {
            addMessage("⚠️ Both tables exist - syncing data");
            
            // Copy from charterhub_users to wp_charterhub_users if needed
            $stmt = $pdo->query("SELECT COUNT(*) FROM charterhub_users");
            $count = $stmt->fetchColumn();
            
            if ($count > 0) {
                $columns = $pdo->query("DESCRIBE charterhub_users")->fetchAll(PDO::FETCH_COLUMN);
                $columns_str = implode(', ', $columns);
                
                $pdo->exec("INSERT IGNORE INTO wp_charterhub_users ($columns_str) 
                           SELECT $columns_str FROM charterhub_users");
                           
                addMessage("✅ Synced data from charterhub_users to wp_charterhub_users");
                $results['fixes'][] = "synced_data";
            }
        }
        
        // Create a view to handle both table names
        $pdo->exec("CREATE OR REPLACE VIEW charterhub_users AS SELECT * FROM wp_charterhub_users");
        addMessage("✅ Created view 'charterhub_users' pointing to 'wp_charterhub_users'");
        $results['fixes'][] = "created_view";
        
        $results['status'] = "completed";
        addMessage("✅ Registration fix completed successfully");
        
    } catch (Exception $e) {
        addMessage("❌ Database error: " . $e->getMessage());
        $results['status'] = "error";
        $results['error'] = $e->getMessage();
    }
    
} catch (Exception $e) {
    addMessage("❌ Critical error: " . $e->getMessage());
    $results['status'] = "error";
    $results['error'] = $e->getMessage();
}

// Output final results
echo json_encode($results);
?> 