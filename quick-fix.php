<?php
// Quick fix for wp_charterhub_users table
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: text/plain');

echo "=== QUICK FIX FOR USERS TABLE ===\n\n";

try {
    // Connect to database
    echo "Connecting to database...\n";
    
    $host = getenv('DB_HOST');
    $dbname = getenv('DB_NAME');
    $user = getenv('DB_USER');
    $password = getenv('DB_PASSWORD');
    
    // Create DSN with SSL mode disabled for testing
    $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false // Disable SSL verification
    ];
    
    $pdo = new PDO($dsn, $user, $password, $options);
    echo "Connected to database successfully\n\n";
    
    // Check if wp_charterhub_users exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'wp_charterhub_users'");
    $usersTable = $stmt->fetchColumn();
    
    if ($usersTable) {
        echo "Found table: wp_charterhub_users\n";
        
        // Create view for the users table
        echo "Creating view for users table...\n";
        $pdo->exec("DROP VIEW IF EXISTS charterhub_users");
        $pdo->exec("CREATE VIEW charterhub_users AS SELECT * FROM wp_charterhub_users");
        echo "✅ Successfully created view: charterhub_users\n";
    } else {
        // Check for wp_users instead
        $stmt = $pdo->query("SHOW TABLES LIKE 'wp_users'");
        $wpUsersTable = $stmt->fetchColumn();
        
        if ($wpUsersTable) {
            echo "Found WordPress users table: wp_users\n";
            echo "Creating view for WordPress users table...\n";
            $pdo->exec("DROP VIEW IF EXISTS charterhub_users");
            $pdo->exec("CREATE VIEW charterhub_users AS SELECT * FROM wp_users");
            echo "✅ Successfully created view: charterhub_users -> wp_users\n";
        } else {
            echo "❌ No users table found with either naming convention.\n";
        }
    }
    
    // Now check if the view works
    $stmt = $pdo->query("SELECT COUNT(*) FROM charterhub_users");
    $userCount = $stmt->fetchColumn();
    echo "User count in charterhub_users view: $userCount\n";
    
} catch (PDOException $e) {
    echo "❌ Database error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "\n=== QUICK FIX COMPLETE ===\n";
?> 