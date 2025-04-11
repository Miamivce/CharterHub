<?php header("Content-Type: text/plain"); error_reporting(E_ALL); ini_set("display_errors", 1); echo "=== QUICK AUTH CHECK ===\n\n";

// Parse connection URL - hardcoded for speed
$host = "mysql-charterhub-charterhub.c.aivencloud.com";
$port = "19174";
$dbname = "defaultdb";
$user = "avnadmin";
$pass = "AVNS_HCZbm5bZJE1L9C8Pz8C";

echo "Diagnostic: checking core authentication tables only\n\n";

try {
    // Simple connection setup
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false
    ];
    
    $dsn = "mysql:host=$host;port=$port;dbname=$dbname";
    $pdo = new PDO($dsn, $user, $pass, $options);
    echo "✅ Connected to database\n\n";
    
    // Check for wp_charterhub_users
    echo "Checking user tables...\n";
    $tables_to_check = [
        'wp_charterhub_users',
        'charterhub_users',
        'wp_users'
    ];
    
    foreach ($tables_to_check as $table) {
        echo "Checking table: $table... ";
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if ($stmt->rowCount() > 0) {
            echo "EXISTS\n";
            
            // Check for password column
            $password_column = null;
            $email_column = null;
            
            $columns = $pdo->query("DESCRIBE `$table`")->fetchAll(PDO::FETCH_ASSOC);
            foreach ($columns as $column) {
                $field = $column['Field'];
                
                // Look for password field
                if (strtolower($field) == 'password') {
                    $password_column = 'password';
                } else if (strtolower($field) == 'user_pass') {
                    $password_column = 'user_pass';
                }
                
                // Look for email field
                if (strtolower($field) == 'email') {
                    $email_column = 'email';
                } else if (strtolower($field) == 'user_email') {
                    $email_column = 'user_email';
                }
            }
            
            echo "  - Password column: " . ($password_column ?? 'NOT FOUND') . "\n";
            echo "  - Email column: " . ($email_column ?? 'NOT FOUND') . "\n";
            
            // If this is a view, we need to know
            try {
                $result = $pdo->query("SHOW CREATE TABLE `$table`")->fetch(PDO::FETCH_ASSOC);
                if (isset($result['Create Table']) && stripos($result['Create Table'], 'VIEW') !== false) {
                    echo "  - This is a VIEW\n";
                    
                    // Try to determine what it's a view of
                    preg_match('/FROM\s+`?([a-zA-Z0-9_]+)`?/i', $result['Create Table'], $matches);
                    if (isset($matches[1])) {
                        echo "  - View of table: {$matches[1]}\n";
                    }
                }
            } catch (PDOException $e) {
                // Ignore errors here
            }
        } else {
            echo "NOT FOUND\n";
        }
    }
    
    // Check client-login.php for references
    echo "\nChecking auth/client-login.php...\n";
    
    if (file_exists('auth/client-login.php')) {
        $content = file_get_contents('auth/client-login.php');
        
        $password_references = [];
        if (preg_match_all('/[\'"]password[\'"]/i', $content, $matches)) {
            $password_references[] = 'password';
        }
        if (preg_match_all('/[\'"]user_pass[\'"]/i', $content, $matches)) {
            $password_references[] = 'user_pass';
        }
        
        echo "  Password field references: " . implode(', ', $password_references) . "\n";
    } else {
        echo "  File not found!\n";
    }
    
    // Check CSRF token handling
    echo "\nChecking CSRF token handling...\n";
    if (file_exists('auth/csrf-token.php')) {
        echo "  CSRF token file exists\n";
    } else {
        echo "  CSRF token file not found\n";
    }
    
    echo "\n=== QUICK CHECK COMPLETE ===\n";
    
} catch (PDOException $e) {
    echo "❌ Database error: " . $e->getMessage() . "\n";
} 