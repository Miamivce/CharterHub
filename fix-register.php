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
    require_once __DIR__ . '/utils/database.php';
    addMessage("✅ Database utilities loaded successfully");
    
    // Test database connection
    try {
        $pdo = getDbConnection();
        addMessage("✅ Database connection established successfully");
        
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