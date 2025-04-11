<?php
header('Content-Type: text/plain');
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "=== APP-BASED FIX ===\n\n";

// First try to determine if we have access to the logs
echo "Checking for logs...\n";
$log_files = glob('/tmp/php_error.log');
if (!empty($log_files)) {
    echo "Found log files: " . implode(', ', $log_files) . "\n";
    foreach ($log_files as $log_file) {
        if (file_exists($log_file) && is_readable($log_file)) {
            $content = file_get_contents($log_file);
            $last_lines = implode("\n", array_slice(explode("\n", $content), -20));
            echo "Last 20 lines of log:\n$last_lines\n\n";
        }
    }
} else {
    echo "No log files found\n";
}

// Try to use the app's connection method
echo "Attempting to use app's database connection method...\n";
try {
    // Include necessary files from the app
    if (file_exists(dirname(__FILE__) . '/auth/config.php')) {
        require_once dirname(__FILE__) . '/auth/config.php';
        echo "Loaded auth/config.php\n";
    } else {
        echo "❌ auth/config.php not found\n";
    }
    
    // Try to get the app's database connection
    if (function_exists('get_db_connection')) {
        echo "Using app's get_db_connection function...\n";
        $pdo = get_db_connection();
        echo "✅ Successfully connected to database using app's method\n\n";
        
        // Now use this connection to create the views
        echo "Creating views using app's connection...\n";
        $pdo->exec("DROP VIEW IF EXISTS charterhub_users");
        $pdo->exec("CREATE VIEW charterhub_users AS SELECT * FROM wp_charterhub_users");
        echo "✅ Created charterhub_users view\n";
        
        // Check and fix auth_logs table
        $stmt = $pdo->query("SHOW TABLES LIKE 'wp_charterhub_auth_logs'");
        $logs_table = $stmt->fetchColumn();
        if ($logs_table) {
            $stmt = $pdo->query("DESCRIBE wp_charterhub_auth_logs");
            $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($columns as $column) {
                if ($column['Field'] === 'action') {
                    $pdo->exec("ALTER TABLE wp_charterhub_auth_logs MODIFY action VARCHAR(100) NOT NULL");
                    echo "✅ Fixed action column size in auth_logs table\n";
                    break;
                }
            }
        }
        
        echo "✅ Fix completed using app's database connection\n";
    } else {
        echo "❌ App's get_db_connection function not found\n";
        
        // Fall back to db-config.php if it exists
        if (file_exists(dirname(__FILE__) . '/db-config.php')) {
            require_once dirname(__FILE__) . '/db-config.php';
            echo "Loaded db-config.php\n";
            
            if (function_exists('get_db_connection_from_config')) {
                echo "Using get_db_connection_from_config function...\n";
                $pdo = get_db_connection_from_config();
                echo "✅ Successfully connected to database using config method\n\n";
                
                // Create the views
                $pdo->exec("DROP VIEW IF EXISTS charterhub_users");
                $pdo->exec("CREATE VIEW charterhub_users AS SELECT * FROM wp_charterhub_users");
                echo "✅ Created charterhub_users view\n";
                
                // Fix auth_logs table
                $stmt = $pdo->query("SHOW TABLES LIKE 'wp_charterhub_auth_logs'");
                $logs_table = $stmt->fetchColumn();
                if ($logs_table) {
                    $pdo->exec("ALTER TABLE wp_charterhub_auth_logs MODIFY action VARCHAR(100) NOT NULL");
                    echo "✅ Fixed action column size in auth_logs table\n";
                }
                
                echo "✅ Fix completed using config-based connection\n";
            } else {
                echo "❌ get_db_connection_from_config function not found\n";
            }
        } else {
            echo "❌ db-config.php not found\n";
        }
    }
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    
    // Try direct connection as last resort
    echo "\nFalling back to direct connection method...\n";
    try {
        $host = getenv('DB_HOST');
        $dbname = getenv('DB_NAME');
        $user = getenv('DB_USER');
        $password = getenv('DB_PASSWORD');
        
        // Try to create a socket connection first
        $socket = @fsockopen($host, 3306, $errno, $errstr, 5);
        if (!$socket) {
            echo "❌ TCP connection failed: $errstr ($errno)\n";
            echo "This suggests a firewall or network connectivity issue.\n";
        } else {
            fclose($socket);
            echo "✅ TCP connection successful\n";
            
            // Try PDO connection with verbose error reporting
            $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false,
            ];
            
            echo "Connecting with dsn: $dsn\n";
            $pdo = new PDO($dsn, $user, $password, $options);
            
            // If we get here, the connection worked
            echo "✅ Direct database connection successful\n";
            
            // Create views
            $pdo->exec("DROP VIEW IF EXISTS charterhub_users");
            $pdo->exec("CREATE VIEW charterhub_users AS SELECT * FROM wp_charterhub_users");
            echo "✅ Created charterhub_users view\n";
        }
    } catch (Exception $fallback_e) {
        echo "❌ Fallback connection failed: " . $fallback_e->getMessage() . "\n";
    }
}

echo "\n=== FIX ATTEMPT COMPLETE ===\n";
?> 