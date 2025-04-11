<?php header("Content-Type: text/plain"); error_reporting(E_ALL); ini_set("display_errors", 1); echo "=== AUTH LOGIN FIX ===\n\n";

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

echo "Diagnostic mode - checking database schema only, no changes will be made\n\n";

// Test connection
try {
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false
    ];
    
    $dsn = "mysql:host=$host;port=$port;dbname=$dbname";
    $pdo = new PDO($dsn, $user, $pass, $options);
    echo "✅ Connected to database successfully\n\n";
    
    // List all tables
    echo "=== DATABASE TABLES ===\n";
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    foreach ($tables as $table) {
        echo "- $table\n";
    }
    
    // Check for user tables
    echo "\n=== USER TABLES ANALYSIS ===\n";
    $user_tables = [];
    foreach ($tables as $table) {
        if (stripos($table, 'user') !== false) {
            $user_tables[] = $table;
        }
    }
    
    if (empty($user_tables)) {
        echo "❌ No user tables found!\n";
    } else {
        echo "Found " . count($user_tables) . " potential user tables:\n";
        
        foreach ($user_tables as $table) {
            echo "\n--- TABLE: $table ---\n";
            
            try {
                // Examine table structure
                $columns = $pdo->query("DESCRIBE `$table`")->fetchAll(PDO::FETCH_ASSOC);
                foreach ($columns as $column) {
                    $field = $column['Field'];
                    $type = $column['Type'];
                    $null = $column['Null'];
                    $key = $column['Key'];
                    
                    // Highlight important authentication columns
                    $important = '';
                    if (in_array(strtolower($field), ['id', 'user_id', 'password', 'user_pass', 'email', 'user_email'])) {
                        $important = ' ⭐';
                    }
                    
                    echo "  $field ($type)$important\n";
                }
                
                // Check if this is a view
                $result = $pdo->query("SHOW CREATE TABLE `$table`")->fetch(PDO::FETCH_ASSOC);
                if (isset($result['Create Table']) && stripos($result['Create Table'], 'VIEW') !== false) {
                    echo "  [This is a VIEW]\n";
                }
                
                // Sample data (first row only)
                $sampleQuery = $pdo->query("SELECT * FROM `$table` LIMIT 1");
                if ($sampleQuery->rowCount() > 0) {
                    $sample = $sampleQuery->fetch(PDO::FETCH_ASSOC);
                    echo "\n  Sample data (first row):\n";
                    foreach ($sample as $key => $value) {
                        // Don't show actual password hash or sensitive data
                        if (in_array(strtolower($key), ['password', 'user_pass'])) {
                            echo "  - $key: [HASH HIDDEN]\n";
                        } else {
                            // Truncate long values
                            $displayValue = (strlen($value) > 30) ? substr($value, 0, 27) . '...' : $value;
                            echo "  - $key: $displayValue\n";
                        }
                    }
                } else {
                    echo "\n  No data in table\n";
                }
            } catch (PDOException $e) {
                echo "  Error examining table: " . $e->getMessage() . "\n";
            }
        }
    }
    
    // Check for CSRF related tables
    echo "\n=== CSRF CONFIGURATION ===\n";
    
    // Check for CSRF token table
    $csrf_table_found = false;
    foreach ($tables as $table) {
        if (stripos($table, 'csrf') !== false || stripos($table, 'token') !== false) {
            echo "Possible CSRF table found: $table\n";
            $csrf_table_found = true;
            
            // Examine structure
            $columns = $pdo->query("DESCRIBE `$table`")->fetchAll(PDO::FETCH_ASSOC);
            foreach ($columns as $column) {
                echo "  - {$column['Field']} ({$column['Type']})\n";
            }
        }
    }
    
    if (!$csrf_table_found) {
        echo "No dedicated CSRF tables found.\n";
        echo "CSRF may be handled via session variables or other mechanism.\n";
    }
    
    // Check the auth files
    echo "\n=== AUTH ENDPOINT CHECK ===\n";
    $auth_files = [
        'auth/client-login.php',
        'auth/csrf-token.php',
        'utils/database.php'
    ];
    
    foreach ($auth_files as $file) {
        if (file_exists($file)) {
            echo "✅ $file exists\n";
            
            // For certain critical files, check their content for key patterns
            if ($file == 'auth/client-login.php') {
                $content = file_get_contents($file);
                
                if (stripos($content, 'password') !== false) {
                    echo "  - File contains references to 'password'\n";
                }
                
                if (stripos($content, 'user_pass') !== false) {
                    echo "  - File contains references to 'user_pass'\n";
                }
            }
            
            if ($file == 'auth/csrf-token.php') {
                echo "  - This endpoint returns status 503, likely due to service hibernation\n";
            }
        } else {
            echo "❌ $file not found\n";
        }
    }
    
    echo "\n=== DIAGNOSTIC COMPLETE ===\n";
    echo "Next steps:\n";
    echo "1. Check column naming in user tables against auth code\n";
    echo "2. Ensure database views map correctly\n";
    echo "3. Consider upgrading Render service to prevent hibernation\n";
    
} catch (PDOException $e) {
    echo "❌ Database error: " . $e->getMessage() . "\n";
}
?> 