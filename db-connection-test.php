<?php
// Database connection test script
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: text/plain');

echo "=== DATABASE CONNECTION TEST ===\n\n";

// Output environment variables (without passwords)
echo "Environment variables:\n";
echo "DB_HOST: " . (getenv('DB_HOST') ? getenv('DB_HOST') : 'Not set') . "\n";
echo "DB_NAME: " . (getenv('DB_NAME') ? getenv('DB_NAME') : 'Not set') . "\n";
echo "DB_USER: " . (getenv('DB_USER') ? getenv('DB_USER') : 'Not set') . "\n";
echo "DB_PASSWORD: " . (getenv('DB_PASSWORD') ? 'Is set (hidden)' : 'Not set') . "\n\n";

// Try database connection
try {
    echo "Attempting database connection...\n";
    
    $host = getenv('DB_HOST');
    $dbname = getenv('DB_NAME');
    $user = getenv('DB_USER');
    $password = getenv('DB_PASSWORD');
    
    if (!$host || !$dbname || !$user || !$password) {
        throw new Exception("Missing required database environment variables");
    }
    
    // Create DSN with SSL mode disabled for testing
    $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false // Disable SSL verification
    ];
    
    echo "Connecting with DSN: $dsn\n";
    $pdo = new PDO($dsn, $user, $password, $options);
    echo "✅ Successfully connected to database!\n\n";
    
    // Check for wp_ tables
    echo "Checking for tables with wp_ prefix:\n";
    $stmt = $pdo->query("SHOW TABLES LIKE 'wp_%'");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    if (count($tables) > 0) {
        echo "Found " . count($tables) . " tables with wp_ prefix:\n";
        foreach ($tables as $table) {
            echo "- $table\n";
        }
    } else {
        echo "No tables found with wp_ prefix\n";
    }
    
    // Check for charterhub_ tables
    echo "\nChecking for tables with charterhub_ prefix:\n";
    $stmt = $pdo->query("SHOW TABLES LIKE 'charterhub_%'");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    if (count($tables) > 0) {
        echo "Found " . count($tables) . " tables with charterhub_ prefix:\n";
        foreach ($tables as $table) {
            echo "- $table\n";
        }
    } else {
        echo "No tables found with charterhub_ prefix\n";
    }
    
    // Test creating a view
    echo "\nTesting view creation permission:\n";
    try {
        // First try to drop any existing test view
        $pdo->exec("DROP VIEW IF EXISTS test_view");
        echo "Successfully dropped test view if it existed\n";
        
        // Now try to create a new test view
        $pdo->exec("CREATE VIEW test_view AS SELECT 1 as test");
        echo "✅ Successfully created test view - you have CREATE VIEW permission\n";
        
        // Clean up by dropping the test view
        $pdo->exec("DROP VIEW test_view");
        echo "Successfully cleaned up test view\n";
    } catch (Exception $e) {
        echo "❌ Failed to create view: " . $e->getMessage() . "\n";
        echo "You may not have CREATE VIEW permission on this database\n";
    }
    
} catch (PDOException $e) {
    echo "❌ Database connection error:\n";
    echo "Error code: " . $e->getCode() . "\n";
    echo "Error message: " . $e->getMessage() . "\n";
    
    // Special handling for common errors
    if (strpos($e->getMessage(), 'ssl') !== false) {
        echo "\nThis appears to be an SSL/TLS issue. Try modifying connection options to disable SSL verification.\n";
    }
    
    if (strpos($e->getMessage(), 'Access denied') !== false) {
        echo "\nThis appears to be an authentication issue. Check your username and password.\n";
    }
    
    if (strpos($e->getMessage(), 'Unknown database') !== false) {
        echo "\nThe database name appears to be incorrect or does not exist.\n";
    }
} catch (Exception $e) {
    echo "❌ General error: " . $e->getMessage() . "\n";
}

echo "\n=== TEST COMPLETE ===\n";
?> 