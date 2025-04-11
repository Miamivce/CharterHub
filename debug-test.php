<?php
// Basic diagnostic script with no dependencies

// Try to force error display at all levels
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Set content type
header('Content-Type: text/plain');
echo "=== CHARTERHUB DIAGNOSTIC TEST ===\n\n";

// Test PHP version and basic functions
echo "PHP Version: " . phpversion() . "\n";
echo "Server Software: " . $_SERVER['SERVER_SOFTWARE'] . "\n";
echo "Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "\n\n";

// Test environment variables
echo "Environment Variables:\n";
echo "DB_HOST: " . (getenv('DB_HOST') ? 'Available' : 'Not available') . "\n";
echo "DB_NAME: " . (getenv('DB_NAME') ? 'Available' : 'Not available') . "\n";
echo "DB_USER: " . (getenv('DB_USER') ? 'Available' : 'Not available') . "\n";
echo "DB_PASSWORD: " . (getenv('DB_PASSWORD') ? 'Available (hidden)' : 'Not available') . "\n";
echo "JWT_SECRET: " . (getenv('JWT_SECRET') ? 'Available (hidden)' : 'Not available') . "\n\n";

// Test file existence
echo "File Structure:\n";
$authConfigPath = dirname(__FILE__) . '/auth/config.php';
$utilsDatabasePath = dirname(__FILE__) . '/utils/database.php';

echo "auth/config.php: " . (file_exists($authConfigPath) ? 'Exists' : 'Missing') . "\n";
echo "utils/database.php: " . (file_exists($utilsDatabasePath) ? 'Exists' : 'Missing') . "\n\n";

// Test directory structure
echo "Directory Structure:\n";
$dirs = ['auth', 'utils'];
foreach ($dirs as $dir) {
    $path = dirname(__FILE__) . '/' . $dir;
    echo "$dir/: " . (is_dir($path) ? 'Exists' : 'Missing') . "\n";
    
    if (is_dir($path)) {
        echo "  Contents of $dir/:\n";
        $files = scandir($path);
        foreach ($files as $file) {
            if ($file != '.' && $file != '..') {
                echo "  - $file\n";
            }
        }
    }
}

// Try a very basic database connection test
echo "\nAttempting basic database connection test:\n";
try {
    // Only try to connect if environment variables are available
    if (getenv('DB_HOST') && getenv('DB_NAME') && getenv('DB_USER') && getenv('DB_PASSWORD')) {
        $dsn = "mysql:host=" . getenv('DB_HOST') . ";dbname=" . getenv('DB_NAME');
        $pdo = new PDO($dsn, getenv('DB_USER'), getenv('DB_PASSWORD'), [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);
        echo "✅ Basic database connection successful\n";
        
        // Test for tables with wp_charterhub_ prefix
        $stmt = $pdo->query("SHOW TABLES LIKE 'wp_charterhub_%'");
        $wpTables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        echo "Found " . count($wpTables) . " tables with wp_charterhub_ prefix\n";
        
        if (count($wpTables) > 0) {
            echo "Tables found:\n";
            foreach ($wpTables as $table) {
                echo "- $table\n";
            }
        }
        
        // Also test for tables with charterhub_ prefix (no wp_)
        $stmt = $pdo->query("SHOW TABLES LIKE 'charterhub_%'");
        $noWpTables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        echo "Found " . count($noWpTables) . " tables with charterhub_ prefix (no wp_)\n";
        
        if (count($noWpTables) > 0) {
            echo "Tables found:\n";
            foreach ($noWpTables as $table) {
                echo "- $table\n";
            }
        }
    } else {
        echo "❌ Cannot test database connection - environment variables missing\n";
    }
} catch (PDOException $e) {
    echo "❌ Database connection failed: " . $e->getMessage() . "\n";
}

echo "\n=== DIAGNOSTIC TEST COMPLETE ===\n";
?> 