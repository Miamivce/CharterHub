<?php
header('Content-Type: text/plain');
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "=== ENVIRONMENT SETTINGS UPDATE ===\n\n";

// Define proper connection details from the connection URL
$db_url = "mysql://avnadmin:AVNS_HCZbm5bZJE1L9C8Pz8C@mysql-charterhub-charterhub.c.aivencloud.com:19174/defaultdb?ssl-mode=REQUIRED";
$parsed = parse_url($db_url);

$db_host = $parsed['host'] . ':' . $parsed['port']; // Include port in host
$db_name = substr($parsed['path'], 1);
$db_user = $parsed['user'];
$db_password = $parsed['pass'];

echo "Extracted connection details:\n";
echo "DB_HOST: $db_host\n";
echo "DB_NAME: $db_name\n";
echo "DB_USER: $db_user\n";
echo "DB_PASSWORD: [hidden]\n\n";

// Check current environment settings
echo "Current environment settings:\n";
echo "DB_HOST: " . (getenv('DB_HOST') ?: 'Not set') . "\n";
echo "DB_NAME: " . (getenv('DB_NAME') ?: 'Not set') . "\n";
echo "DB_USER: " . (getenv('DB_USER') ?: 'Not set') . "\n";
echo "DB_PASSWORD: " . (getenv('DB_PASSWORD') ? '[Set]' : 'Not set') . "\n\n";

// Look for .env file
$env_file = dirname(__FILE__) . '/.env';
if (file_exists($env_file)) {
    echo "Found .env file, creating backup...\n";
    copy($env_file, $env_file . '.bak_' . date('YmdHis'));
    
    // Read current content
    $env_content = file_get_contents($env_file);
    
    // Update environment variables
    $patterns = [
        '/DB_HOST=.*/' => "DB_HOST=$db_host",
        '/DB_NAME=.*/' => "DB_NAME=$db_name",
        '/DB_USER=.*/' => "DB_USER=$db_user",
        '/DB_PASSWORD=.*/' => "DB_PASSWORD=$db_password",
        '/DB_PORT=.*/' => "DB_PORT=19174",
    ];
    
    $updated_content = $env_content;
    foreach ($patterns as $pattern => $replacement) {
        if (preg_match($pattern, $env_content)) {
            $updated_content = preg_replace($pattern, $replacement, $updated_content);
            echo "Updated " . substr($replacement, 0, strpos($replacement, '=') + 1) . 
                 (strpos($replacement, 'PASSWORD') !== false ? "[hidden]" : substr($replacement, strpos($replacement, '=') + 1)) . "\n";
        } else {
            // Add the value if not present
            $updated_content .= "\n" . $replacement;
            echo "Added " . substr($replacement, 0, strpos($replacement, '=') + 1) . 
                 (strpos($replacement, 'PASSWORD') !== false ? "[hidden]" : substr($replacement, strpos($replacement, '=') + 1)) . "\n";
        }
    }
    
    // Add SSL settings
    if (strpos($updated_content, 'MYSQL_SSL_VERIFY') === false) {
        $updated_content .= "\nMYSQL_SSL_VERIFY=false";
        echo "Added MYSQL_SSL_VERIFY=false\n";
    }
    
    // Write updated content
    if (file_put_contents($env_file, $updated_content)) {
        echo "✅ Successfully updated .env file\n";
    } else {
        echo "❌ Failed to update .env file\n";
    }
} else {
    echo "No .env file found, creating new one...\n";
    
    // Create content for new .env file
    $env_content = "# Database Configuration\n";
    $env_content .= "DB_HOST=$db_host\n";
    $env_content .= "DB_NAME=$db_name\n";
    $env_content .= "DB_USER=$db_user\n";
    $env_content .= "DB_PASSWORD=$db_password\n";
    $env_content .= "DB_PORT=19174\n";
    $env_content .= "MYSQL_SSL_VERIFY=false\n";
    
    if (file_put_contents($env_file, $env_content)) {
        echo "✅ Created new .env file with database settings\n";
    } else {
        echo "❌ Failed to create .env file\n";
    }
}

echo "\nUpdating database utility file to use port and SSL settings...\n";
$utils_db_file = dirname(__FILE__) . '/utils/database.php';
if (file_exists($utils_db_file)) {
    // Read file content
    $db_utils_content = file_get_contents($utils_db_file);
    
    // Create backup
    copy($utils_db_file, $utils_db_file . '.bak_' . date('YmdHis'));
    
    // Check if the file already has port and SSL settings
    $needs_update = !(strpos($db_utils_content, 'port=') !== false && 
                      strpos($db_utils_content, 'MYSQL_ATTR_SSL_VERIFY_SERVER_CERT') !== false);
    
    if ($needs_update) {
        // Find DSN construction pattern and add port
        $dsn_pattern = '/(\$dsn\s*=\s*"mysql:host=\$db_host;dbname=\$db_name)/i';
        if (preg_match($dsn_pattern, $db_utils_content)) {
            $db_utils_content = preg_replace($dsn_pattern, '$1;port=19174', $db_utils_content);
            echo "Added port to DSN\n";
        }
        
        // Add SSL options to PDO options array
        $options_pattern = '/(\$options\s*=\s*\[.*?PDO::ATTR_EMULATE_PREPARES\s*=>\s*false)/is';
        if (preg_match($options_pattern, $db_utils_content)) {
            $replacement = '$1,' . "\n" . '        PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false';
            $db_utils_content = preg_replace($options_pattern, $replacement, $db_utils_content);
            echo "Added SSL options to PDO connection\n";
        }
        
        // Write updated content
        if (file_put_contents($utils_db_file, $db_utils_content)) {
            echo "✅ Successfully updated database utility file\n";
        } else {
            echo "❌ Failed to update database utility file\n";
        }
    } else {
        echo "Database utility file already has port and SSL settings\n";
    }
} else {
    echo "❌ Database utility file not found\n";
}

echo "\n=== ENVIRONMENT UPDATE COMPLETE ===\n";
echo "Please restart your application for the changes to take effect.\n";
?> 