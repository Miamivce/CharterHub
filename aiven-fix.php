<?php
header('Content-Type: text/plain');
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "=== AIVEN DATABASE FIX ===\n\n";

// Parse the connection URL
$db_url = "mysql://avnadmin:AVNS_HCZbm5bZJE1L9C8Pz8C@mysql-charterhub-charterhub.c.aivencloud.com:19174/defaultdb?ssl-mode=REQUIRED";
echo "Using connection URL: " . preg_replace('/avnadmin:(.+?)@/', 'avnadmin:***@', $db_url) . "\n\n";

// Parse URL
$parsed = parse_url($db_url);
$host = $parsed['host'] ?? '';
$port = $parsed['port'] ?? '';
$user = $parsed['user'] ?? '';
$pass = $parsed['pass'] ?? '';
$dbname = isset($parsed['path']) ? substr($parsed['path'], 1) : '';

echo "Host: $host\nPort: $port\nDatabase: $dbname\nUsername: $user\n\n";

// Test connection
try {
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false
    ];
    
    $dsn = "mysql:host=$host;port=$port;dbname=$dbname";
    $pdo = new PDO($dsn, $user, $pass, $options);
    echo "✅ Connected to database successfully\n\n";
    
    // Check if wp_charterhub_users exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'wp_charterhub_users'");
    if ($stmt->rowCount() > 0) {
        echo "Found table: wp_charterhub_users\n";
        $pdo->exec("CREATE OR REPLACE VIEW `charterhub_users` AS SELECT * FROM `wp_charterhub_users`");
        echo "✅ Created view: charterhub_users -> wp_charterhub_users\n";
    } else {
        echo "Table wp_charterhub_users not found\n";
    }
    
    // Check if wp_charterhub_auth_logs exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'wp_charterhub_auth_logs'");
    if ($stmt->rowCount() > 0) {
        echo "Found table: wp_charterhub_auth_logs\n";
        $pdo->exec("CREATE OR REPLACE VIEW `charterhub_auth_logs` AS SELECT * FROM `wp_charterhub_auth_logs`");
        echo "✅ Created view: charterhub_auth_logs -> wp_charterhub_auth_logs\n";
    } else {
        echo "Table wp_charterhub_auth_logs not found\n";
    }
    
    echo "\n=== FIX COMPLETE ===";
    
} catch (PDOException $e) {
    echo "❌ Database error: " . $e->getMessage() . "\n";
}
?> 