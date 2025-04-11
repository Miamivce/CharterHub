<?php
// Authentication Fix Tool
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: text/plain');

echo "=== AUTHENTICATION FIX TOOL ===\n\n";

try {
    echo "Connecting to database using application credentials...\n";
    
    // We'll use the direct database connection approach that works in the app logs
    require_once dirname(__FILE__) . '/auth/config.php';
    
    // Get database connection (reusing the app's connection method)
    $pdo = get_db_connection();
    echo "✅ Connected to database successfully\n\n";
    
    // Check for user table with wp_charterhub_users
    echo "Checking for user tables...\n";
    $stmt = $pdo->query("SHOW TABLES LIKE 'wp_charterhub_users'");
    $usersTable = $stmt->fetchColumn();
    
    if ($usersTable) {
        echo "Found table: wp_charterhub_users\n\n";
        
        // Examine the table structure
        echo "Examining table structure...\n";
        $stmt = $pdo->query("DESCRIBE wp_charterhub_users");
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Check for password column
        $passwordColumn = null;
        foreach ($columns as $column) {
            if (strtolower($column['Field']) === 'password') {
                $passwordColumn = $column;
                break;
            }
        }
        
        if ($passwordColumn) {
            echo "✅ Found password column: " . $passwordColumn['Field'] . "\n";
            
            // Check type of password column
            echo "Password column type: " . $passwordColumn['Type'] . "\n";
            
            // Check a sample value
            $stmt = $pdo->query("SELECT id, email, password FROM wp_charterhub_users LIMIT 1");
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($user) {
                echo "Sample user found: ID " . $user['id'] . ", Email: " . $user['email'] . "\n";
                echo "Password hash starts with: " . substr($user['password'], 0, 10) . "...\n";
                
                // Diagnose potential password issues
                $passwordLength = strlen($user['password']);
                echo "Password hash length: $passwordLength characters\n";
                
                if ($passwordLength < 20) {
                    echo "⚠️ WARNING: Password hash length is suspiciously short!\n";
                }
                
                if (strpos($user['password'], '$2y$') === 0) {
                    echo "✅ Password appears to be a valid bcrypt hash\n";
                } else if (strpos($user['password'], '$P$') === 0) {
                    echo "✅ Password appears to be a valid WordPress phpass hash\n";
                } else if (strlen($user['password']) === 32 || strlen($user['password']) === 40) {
                    echo "⚠️ Password appears to be an unsupported hash format (MD5 or SHA1)\n";
                } else {
                    echo "⚠️ Unable to determine password hash format\n";
                }
            } else {
                echo "❌ No users found in the table\n";
            }
        } else {
            echo "❌ No 'password' column found!\n";
            
            // Check for user_pass (WordPress convention)
            foreach ($columns as $column) {
                if (strtolower($column['Field']) === 'user_pass') {
                    echo "✅ Found WordPress-style 'user_pass' column\n";
                    echo "This suggests you might be using a WordPress users table\n";
                    
                    // Create a mapping view
                    echo "\nCreating a compatibility view for WordPress users...\n";
                    $pdo->exec("DROP VIEW IF EXISTS charterhub_users_compat");
                    $pdo->exec("CREATE VIEW charterhub_users_compat AS 
                               SELECT 
                                 ID as id,
                                 user_login as username,
                                 user_pass as password,
                                 user_email as email,
                                 display_name as name,
                                 user_registered as created_at
                               FROM wp_charterhub_users");
                    echo "✅ Created compatibility view: charterhub_users_compat\n";
                    break;
                }
            }
        }
        
        // Create a regular view without wp_ prefix regardless
        echo "\nCreating standard view without wp_ prefix...\n";
        $pdo->exec("DROP VIEW IF EXISTS charterhub_users");
        $pdo->exec("CREATE VIEW charterhub_users AS SELECT * FROM wp_charterhub_users");
        echo "✅ Created view: charterhub_users\n";
        
    } else {
        // Check for WordPress-style wp_users
        $stmt = $pdo->query("SHOW TABLES LIKE 'wp_users'");
        $wpUsers = $stmt->fetchColumn();
        
        if ($wpUsers) {
            echo "Found WordPress users table: wp_users\n";
            echo "Creating view for WordPress users...\n";
            $pdo->exec("DROP VIEW IF EXISTS charterhub_users");
            $pdo->exec("CREATE VIEW charterhub_users AS SELECT * FROM wp_users");
            echo "✅ Created view: charterhub_users -> wp_users\n";
        } else {
            echo "❌ No users table found with any known naming convention\n";
        }
    }
    
    // Now check for related tables (usermeta, etc.)
    $relatedTables = [
        'wp_charterhub_user_meta' => 'charterhub_user_meta',
        'wp_charterhub_sessions' => 'charterhub_sessions',
        'wp_charterhub_auth_logs' => 'charterhub_auth_logs',
        'wp_usermeta' => 'charterhub_usermeta',
    ];
    
    echo "\nChecking for related tables...\n";
    foreach ($relatedTables as $sourceTable => $viewName) {
        $stmt = $pdo->query("SHOW TABLES LIKE '$sourceTable'");
        $tableExists = $stmt->fetchColumn();
        
        if ($tableExists) {
            echo "Found table: $sourceTable\n";
            $pdo->exec("DROP VIEW IF EXISTS $viewName");
            $pdo->exec("CREATE VIEW $viewName AS SELECT * FROM $sourceTable");
            echo "✅ Created view: $viewName -> $sourceTable\n";
        }
    }
    
    // Check for logging issues
    echo "\nChecking auth logs table for potential issues...\n";
    $stmt = $pdo->query("SHOW TABLES LIKE 'wp_charterhub_auth_logs'");
    $logsTable = $stmt->fetchColumn();
    
    if ($logsTable) {
        // Check column sizes
        $stmt = $pdo->query("DESCRIBE wp_charterhub_auth_logs");
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($columns as $column) {
            if ($column['Field'] === 'action' && strpos($column['Type'], 'varchar') !== false) {
                preg_match('/varchar\((\d+)\)/', $column['Type'], $matches);
                if (isset($matches[1]) && $matches[1] < 50) {
                    echo "⚠️ 'action' column is too small: " . $column['Type'] . "\n";
                    echo "Attempting to alter column size...\n";
                    try {
                        $pdo->exec("ALTER TABLE wp_charterhub_auth_logs MODIFY action VARCHAR(100) NOT NULL");
                        echo "✅ Increased 'action' column size to VARCHAR(100)\n";
                    } catch (Exception $e) {
                        echo "❌ Failed to alter column: " . $e->getMessage() . "\n";
                    }
                } else {
                    echo "✅ 'action' column size is adequate: " . $column['Type'] . "\n";
                }
            }
        }
    }
    
    echo "\n=== FIX COMPLETE ===\n";
    echo "Please try logging in again. If issues persist, check the logs for more details.\n";
    
} catch (PDOException $e) {
    echo "❌ Database error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?> 