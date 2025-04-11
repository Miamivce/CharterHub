<?php
/**
 * SSL Connection Test & Fix Script for CharterHub
 * 
 * This script tests the connection to the MySQL database
 * using SSL, creates the necessary SSL certificate directory,
 * and verifies/fixes table structures.
 */

// Enable error reporting for diagnostics
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: text/plain');

echo "=== SSL CONNECTION FIX ===\n\n";

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

// Create SSL directory
$ssl_dir = __DIR__ . '/ssl';
if (!file_exists($ssl_dir)) {
    if (mkdir($ssl_dir, 0755, true)) {
        echo "✅ Created SSL directory: $ssl_dir\n";
    } else {
        echo "❌ Failed to create SSL directory\n";
    }
} else {
    echo "SSL directory already exists: $ssl_dir\n";
}

// Download CA certificate
$ca_file = "$ssl_dir/ca.pem";
if (!file_exists($ca_file)) {
    echo "Downloading CA certificate...\n";
    $ca_cert_url = "https://dl.cacerts.digicert.com/DigiCertGlobalRootCA.crt.pem";
    $ca_cert = @file_get_contents($ca_cert_url);
    
    if ($ca_cert === false) {
        echo "❌ Failed to download CA certificate\n";
    } else {
        if (file_put_contents($ca_file, $ca_cert)) {
            echo "✅ Saved CA certificate\n";
        } else {
            echo "❌ Failed to save CA certificate\n";
        }
    }
} else {
    echo "CA certificate already exists\n";
}

// Test connection
try {
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false
    ];
    
    // Add CA file if it exists
    if (file_exists($ca_file)) {
        $options[PDO::MYSQL_ATTR_SSL_CA] = $ca_file;
        echo "Using CA certificate for SSL connection\n";
    }
    
    $dsn = "mysql:host=$host;port=$port;dbname=$dbname";
    $pdo = new PDO($dsn, $user, $pass, $options);
    echo "✅ Connected to database successfully\n\n";
    
    // List tables
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "Found " . count($tables) . " tables\n";
    
    // Check for WordPress tables
    $wp_tables = [];
    foreach ($tables as $table) {
        if (strpos($table, 'wp_') === 0) {
            $wp_tables[] = $table;
        }
    }
    
    if (!empty($wp_tables)) {
        echo "Found " . count($wp_tables) . " WordPress tables\n";
        
        // Create views for user tables
        if (in_array('wp_charterhub_users', $tables) && !in_array('charterhub_users', $tables)) {
            $pdo->exec("CREATE OR REPLACE VIEW `charterhub_users` AS SELECT * FROM `wp_charterhub_users`");
            echo "✅ Created view: charterhub_users -> wp_charterhub_users\n";
        }
        
        if (in_array('wp_charterhub_auth_logs', $tables) && !in_array('charterhub_auth_logs', $tables)) {
            $pdo->exec("CREATE OR REPLACE VIEW `charterhub_auth_logs` AS SELECT * FROM `wp_charterhub_auth_logs`");
            echo "✅ Created view: charterhub_auth_logs -> wp_charterhub_auth_logs\n";
        }
    }
    
    echo "\n=== FIX COMPLETE ===";
    
} catch (PDOException $e) {
    echo "❌ Database error: " . $e->getMessage() . "\n";
}
?> 