<?php
// Direct Authentication Fix Tool - No Dependencies
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: text/plain');

echo "=== DIRECT AUTHENTICATION FIX ===\n\n";

try {
    $host = getenv('DB_HOST');
    $dbname = getenv('DB_NAME');
    $user = getenv('DB_USER');
    $password = getenv('DB_PASSWORD');
    
    echo "Database configuration:\n";
    echo "Host: $host\n";
    echo "Database: $dbname\n";
    echo "User: $user\n";
    echo "Password: [HIDDEN]\n\n";
    
    // Test if we can connect as a simple client to port 3306
    echo "Testing basic network connectivity to database...\n";
    $socket = @fsockopen($host, 3306, $errno, $errstr, 5);
    if (!$socket) {
        echo "❌ Connection failed: $errstr ($errno)\n";
        echo "This suggests a network connectivity issue between Render and your database.\n";
        echo "Please check your database firewall settings and make sure Render's IP is allowlisted.\n\n";
    } else {
        echo "✅ Socket connection successful\n";
        fclose($socket);
    }
    
    // Create DSN with SSL mode disabled for testing
    echo "\nAttempting full database connection...\n";
    $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false,
    ];
    
    $pdo = new PDO($dsn, $user, $password, $options);
    echo "✅ Database connection successful\n\n";

    // Now let's check for the users table and fix issues
    echo "Looking for user tables...\n";
    
    // Check for wp_charterhub_users
    $stmt = $pdo->query("SHOW TABLES LIKE 'wp_charterhub_users'");
    $users_table = $stmt->fetchColumn();
    
    if ($users_table) {
        echo "Found main users table: wp_charterhub_users\n";
        
        // Create view for users table
        echo "Creating/updating view for users table...\n";
        $pdo->exec("DROP VIEW IF EXISTS charterhub_users");
        $pdo->exec("CREATE VIEW charterhub_users AS SELECT * FROM wp_charterhub_users");
        echo "✅ Created view: charterhub_users\n";
        
        // Check if the auth_logs table has truncation issues
        echo "\nChecking for auth_logs issues...\n";
        $stmt = $pdo->query("SHOW TABLES LIKE 'wp_charterhub_auth_logs'");
        $logs_table = $stmt->fetchColumn();
        
        if ($logs_table) {
            echo "Found auth logs table: wp_charterhub_auth_logs\n";
            
            // Check action column size
            $stmt = $pdo->query("DESCRIBE wp_charterhub_auth_logs");
            $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $action_column = null;
            
            foreach ($columns as $column) {
                if ($column['Field'] === 'action') {
                    $action_column = $column;
                    break;
                }
            }
            
            if ($action_column) {
                echo "Action column found with type: " . $action_column['Type'] . "\n";
                
                // Check if it's too small
                if (preg_match('/varchar\((\d+)\)/', $action_column['Type'], $matches)) {
                    $size = $matches[1];
                    if ((int)$size < 50) {
                        echo "Action column size is only $size characters - too small!\n";
                        echo "Attempting to resize action column...\n";
                        
                        try {
                            $pdo->exec("ALTER TABLE wp_charterhub_auth_logs MODIFY action VARCHAR(100) NOT NULL");
                            echo "✅ Successfully resized action column to VARCHAR(100)\n";
                        } catch (Exception $e) {
                            echo "❌ Failed to resize column: " . $e->getMessage() . "\n";
                        }
                    } else {
                        echo "Column size is adequate ($size characters)\n";
                    }
                }
            }
            
            // Create view for logs table too
            $pdo->exec("DROP VIEW IF EXISTS charterhub_auth_logs");
            $pdo->exec("CREATE VIEW charterhub_auth_logs AS SELECT * FROM wp_charterhub_auth_logs");
            echo "✅ Created view: charterhub_auth_logs\n";
        }
        
    } else {
        // Try wp_users (WordPress standard)
        $stmt = $pdo->query("SHOW TABLES LIKE 'wp_users'");
        $wp_users = $stmt->fetchColumn();
        
        if ($wp_users) {
            echo "Found WordPress users table: wp_users\n";
            echo "Creating view for users...\n";
            $pdo->exec("DROP VIEW IF EXISTS charterhub_users");
            $pdo->exec("CREATE VIEW charterhub_users AS SELECT * FROM wp_users");
            echo "✅ Created view: charterhub_users\n";
        } else {
            echo "❌ No users table found with expected naming conventions\n";
        }
    }
    
    echo "\n=== FIX COMPLETE ===\n";
    echo "Please try logging in again. If issues persist, check network connectivity between Render and your database server.\n";
    
} catch (PDOException $e) {
    echo "❌ Database error: " . $e->getMessage() . "\n";
    
    // Additional diagnostics for common errors
    $error_msg = $e->getMessage();
    if (strpos($error_msg, "Connection refused") !== false) {
        echo "\nThe database server is actively refusing connections. This could indicate:\n";
        echo "- The database server isn't running\n";
        echo "- A firewall is blocking access\n";
        echo "- The host or port number is incorrect\n";
    }
    else if (strpos($error_msg, "Connection timed out") !== false) {
        echo "\nConnection timed out. This typically means:\n";
        echo "- The database server is not accessible at the given IP/hostname\n";
        echo "- A firewall is blocking access\n";
        echo "- The database server is too busy or not responding\n";
        echo "- Network issues between Render and your database\n";
    }
    else if (strpos($error_msg, "Access denied for user") !== false) {
        echo "\nAuthentication failed. Please check:\n";
        echo "- Your username and password are correct\n";
        echo "- The user has access to the specified database\n";
        echo "- The user can connect from Render's IP address\n";
    }
    
} catch (Exception $e) {
    echo "❌ General error: " . $e->getMessage() . "\n";
}
?> 