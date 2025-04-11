<?php
/**
 * Direct Database Fix Tool - No Dependencies
 * 
 * This script creates database views without the wp_ prefix
 * to make the code work with both table naming conventions
 */

// Enable all error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Set content type
header('Content-Type: text/plain');
echo "=== CHARTERHUB DIRECT PREFIX FIX ===\n\n";

try {
    // Connect directly to database using environment variables
    echo "Connecting directly to database...\n";
    $host = getenv('DB_HOST');
    $dbname = getenv('DB_NAME');
    $user = getenv('DB_USER');
    $password = getenv('DB_PASSWORD');
    
    echo "Database host: " . $host . "\n";
    echo "Database name: " . $dbname . "\n";
    echo "Database user: " . $user . "\n";
    
    // Create PDO connection
    $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    $pdo = new PDO($dsn, $user, $password, $options);
    echo "Connected to database successfully\n\n";
    
    // Get all tables with wp_charterhub_ prefix
    echo "Querying for tables with wp_charterhub_ prefix...\n";
    $stmt = $pdo->query("SHOW TABLES LIKE 'wp_charterhub_%'");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "Found " . count($tables) . " tables with wp_charterhub_ prefix\n\n";
    
    if (count($tables) === 0) {
        // Look for tables with just wp_ prefix
        echo "No wp_charterhub_ tables found. Checking for wp_ tables...\n";
        $stmt = $pdo->query("SHOW TABLES LIKE 'wp_%'");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        echo "Found " . count($tables) . " tables with wp_ prefix\n\n";
        
        if (count($tables) === 0) {
            echo "No tables found with wp_ prefix. Exiting.";
            exit;
        }
    }
    
    // Process each table and create a view without the wp_ prefix
    foreach ($tables as $table) {
        // Only process user-related tables
        if (strpos($table, 'users') !== false || 
            strpos($table, 'auth') !== false || 
            strpos($table, 'usermeta') !== false ||
            strpos($table, 'userdata') !== false) {
            
            $viewName = str_replace('wp_', '', $table);
            
            try {
                echo "Processing table: {$table}\n";
                
                // Drop view if exists
                echo "  Dropping existing view if any: {$viewName}\n";
                $pdo->exec("DROP VIEW IF EXISTS `{$viewName}`");
                
                // Create view
                echo "  Creating view: {$viewName} -> {$table}\n";
                $pdo->exec("CREATE VIEW `{$viewName}` AS SELECT * FROM `{$table}`");
                
                echo "✅ Created view: {$viewName} -> {$table}\n";
            } catch (Exception $e) {
                echo "❌ Error creating view {$viewName}: " . $e->getMessage() . "\n";
                echo "  Error code: " . $e->getCode() . "\n";
            }
        } else {
            echo "Skipping non-user table: {$table}\n";
        }
    }
    
    echo "\nTable prefix fix completed!\n";
    echo "All authentication endpoints should now work with both table naming conventions.\n";
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "Error code: " . $e->getCode() . "\n";
    echo "File: " . $e->getFile() . " on line " . $e->getLine() . "\n";
}
?> 