<?php
header('Content-Type: text/plain');
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "=== CONNECTION PARAMETERS DEBUG ===\n\n";

// Environment variables
echo "Environment variables:\n";
echo "DB_HOST: " . (getenv('DB_HOST') ?: 'Not set') . "\n";
echo "DB_NAME: " . (getenv('DB_NAME') ?: 'Not set') . "\n";
echo "DB_USER: " . (getenv('DB_USER') ?: 'Not set') . "\n";
echo "DB_PASSWORD: " . (getenv('DB_PASSWORD') ? '[Set]' : 'Not set') . "\n\n";

// Include config files to see actual used values
echo "Loading app configuration...\n";
try {
    // Include auth config to see how the app configures itself
    require_once dirname(__FILE__) . '/auth/config.php';
    echo "✅ Successfully loaded auth config\n";
    
    // Look for database connection function to see how it's configured
    if (function_exists('get_db_connection')) {
        echo "Found get_db_connection function, examining...\n";
        
        // Try to get connection parameters from the config
        global $db_config;
        if (isset($db_config)) {
            echo "\nDatabase configuration from code:\n";
            echo "host: " . ($db_config['host'] ?? 'Not found') . "\n";
            echo "dbname: " . ($db_config['dbname'] ?? 'Not found') . "\n";
            echo "username: " . ($db_config['username'] ?? 'Not found') . "\n";
            echo "password: " . (isset($db_config['password']) ? '[Set]' : 'Not found') . "\n";
            echo "charset: " . ($db_config['charset'] ?? 'Not found') . "\n\n";
        } else {
            echo "No global db_config variable found\n";
        }
        
        // Check if there are any code hardcoded connections
        echo "Checking database utility file...\n";
        $utils_db_file = dirname(__FILE__) . '/utils/database.php';
        if (file_exists($utils_db_file)) {
            $db_utils = file_get_contents($utils_db_file);
            if (strpos($db_utils, 'new PDO') !== false) {
                echo "Found PDO connections in database.php (might have hardcoded values)\n";
            }
        }
    }
} catch (Exception $e) {
    echo "❌ Error loading configuration: " . $e->getMessage() . "\n";
}

// Check if there are any SSL certificates in the environment
echo "\nChecking for SSL certificates...\n";
$ssl_cert = getenv('MYSQL_SSL_CA');
if ($ssl_cert) {
    echo "Found MYSQL_SSL_CA environment variable\n";
} else {
    echo "No MYSQL_SSL_CA environment variable found\n";
}

// Try to find why app connections work but direct scripts don't
echo "\nExamining app code for connection details...\n";
$pdo_calls = [];
foreach(['utils/database.php', 'db-config.php', 'auth/config.php'] as $file) {
    $path = dirname(__FILE__) . '/' . $file;
    if (file_exists($path)) {
        $content = file_get_contents($path);
        preg_match_all('/new\s+PDO\s*\([^)]+\)/i', $content, $matches);
        if (!empty($matches[0])) {
            $pdo_calls[$file] = $matches[0];
            echo "Found PDO connection in $file\n";
            foreach ($matches[0] as $call) {
                echo "  - " . substr($call, 0, 100) . (strlen($call) > 100 ? '...' : '') . "\n";
            }
        }
    }
}

echo "\n=== DEBUG COMPLETE ===\n";
?> 