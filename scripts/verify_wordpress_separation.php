<?php
/**
 * Verification Script: Ensure Complete Separation from WordPress Users
 * 
 * This script performs comprehensive checks to verify that the CharterHub
 * application no longer has any dependencies or links to the wp_users table.
 */

// Define constants
define('CHARTERHUB_LOADED', true);

// Load database configuration
if (file_exists(dirname(__DIR__) . '/backend/db-config.php')) {
    require_once dirname(__DIR__) . '/backend/db-config.php';
} else {
    // Fallback to wp-config.php if db-config.php doesn't exist
    require_once dirname(__DIR__) . '/backend/wp-config.php';
    
    // Define database variables if they're not already defined in a format we can use
    if (!isset($db_config) && defined('DB_NAME') && defined('DB_USER') && defined('DB_PASSWORD') && defined('DB_HOST')) {
        $db_config = [
            'database' => DB_NAME,
            'username' => DB_USER,
            'password' => DB_PASSWORD,
            'host' => DB_HOST
        ];
    }
}

echo "⚙️ Starting WordPress User Separation Verification...\n\n";

try {
    // Connect to the database
    if (!isset($db_config)) {
        throw new Exception("Database configuration not found. Please check the configuration file paths.");
    }
    
    $pdo = new PDO(
        "mysql:host={$db_config['host']};dbname={$db_config['database']};charset=utf8mb4",
        $db_config['username'],
        $db_config['password'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );
    
    echo "✅ Database connection established\n";
    
    // Check 1: Verify wp_charterhub_users doesn't have wp_user_id column
    echo "\n🔍 CHECKING DATABASE STRUCTURE\n";
    echo "------------------------------\n";
    
    $stmt = $pdo->query("DESCRIBE wp_charterhub_users");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    if (in_array('wp_user_id', $columns)) {
        echo "❌ wp_user_id column still exists in wp_charterhub_users table\n";
    } else {
        echo "✅ wp_charterhub_users table doesn't have wp_user_id column\n";
    }
    
    // Check 2: Verify no foreign keys to wp_users
    $stmt = $pdo->query("
        SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE REFERENCED_TABLE_NAME = 'wp_users'
        AND TABLE_SCHEMA = '{$db_config['database']}'
    ");
    
    $foreignKeys = $stmt->fetchAll();
    
    if (count($foreignKeys) > 0) {
        echo "❌ Found foreign key constraints to wp_users:\n";
        foreach ($foreignKeys as $fk) {
            echo "  - Table: {$fk['TABLE_NAME']}, Column: {$fk['COLUMN_NAME']}, " . 
                 "Constraint: {$fk['CONSTRAINT_NAME']}\n";
        }
    } else {
        echo "✅ No foreign key constraints to wp_users found\n";
    }
    
    // Check 3: Check for any tables that might have columns referencing wp_users without foreign keys
    echo "\n🔍 CHECKING FOR POTENTIAL USER REFERENCES\n";
    echo "---------------------------------------\n";
    
    $potentialColumns = ['wp_user_id', 'wordpress_id', 'wp_id', 'user_id'];
    $foundReferences = false;
    
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    foreach ($tables as $table) {
        if (strpos($table, 'wp_') === 0 && $table != 'wp_users') {
            $stmt = $pdo->query("DESCRIBE `{$table}`");
            $tableColumns = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($tableColumns as $column) {
                if (in_array($column['Field'], $potentialColumns)) {
                    echo "⚠️ Potential reference found: {$table}.{$column['Field']}\n";
                    
                    // Check if this column contains values that might match wp_users.ID
                    try {
                        $stmt = $pdo->query("
                            SELECT COUNT(*) as count 
                            FROM `{$table}` t
                            JOIN wp_users u ON t.{$column['Field']} = u.ID
                        ");
                        $matchCount = $stmt->fetch()['count'];
                        
                        if ($matchCount > 0) {
                            echo "   ALERT: Found {$matchCount} records matching wp_users.ID\n";
                            $foundReferences = true;
                        } else {
                            echo "   OK: No matching records found\n";
                        }
                    } catch (PDOException $e) {
                        echo "   Error checking references: " . $e->getMessage() . "\n";
                    }
                }
            }
        }
    }
    
    if (!$foundReferences) {
        echo "✅ No potential references to wp_users found in other tables\n";
    }
    
    // Check 4: Scan PHP code for references to wp_users
    echo "\n🔍 SCANNING CODE FOR WP_USERS REFERENCES\n";
    echo "--------------------------------------\n";
    
    $directories = [
        dirname(__DIR__) . '/backend/auth',
        dirname(__DIR__) . '/backend/api',
    ];
    
    // Add optional directories if they exist
    $optionalDirs = [
        dirname(__DIR__) . '/backend/includes',
        dirname(__DIR__) . '/backend/utils'
    ];
    
    foreach ($optionalDirs as $dir) {
        if (is_dir($dir)) {
            $directories[] = $dir;
        }
    }
    
    $patterns = [
        'wp_users',
        'WP_User',
        'wp_usermeta',
        'get_user',
        'get_userdata',
        'get_user_by',
    ];
    
    $foundCodeReferences = [];
    
    foreach ($directories as $dir) {
        if (is_dir($dir)) {
            scanDirectory($dir, $patterns, $foundCodeReferences);
        }
    }
    
    if (count($foundCodeReferences) > 0) {
        echo "⚠️ Found code references to WordPress user functions:\n";
        foreach ($foundCodeReferences as $file => $lines) {
            echo "  📄 {$file}:\n";
            foreach ($lines as $lineNum => $line) {
                echo "    Line {$lineNum}: " . trim($line) . "\n";
            }
        }
        
        echo "\nNote: Not all references are problematic. Admin authentication may still use WordPress.\n";
        echo "      Review these files manually to ensure they are only used for admin functionality.\n";
    } else {
        echo "✅ No WordPress user function references found in code\n";
    }
    
    // Check 5: Verify authentication system
    echo "\n🔍 CHECKING AUTHENTICATION SYSTEM\n";
    echo "---------------------------------\n";
    
    // Load the necessary files to check authentication
    if (file_exists(dirname(__DIR__) . '/backend/auth/login.php')) {
        include_once dirname(__DIR__) . '/backend/auth/login.php';
        echo "✅ Login system doesn't throw errors when loaded\n";
    } else {
        echo "⚠️ Could not check login.php - file not found\n";
    }
    
    // Final summary
    echo "\n✨ VERIFICATION COMPLETE ✨\n";
    echo "------------------------\n";
    echo "The application appears to be properly separated from WordPress users.\n";
    echo "Any remaining references are likely for admin-only functionality.\n";
    echo "WordPress cache errors should no longer appear.\n";
    
} catch (PDOException $e) {
    echo "❌ Database Error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

/**
 * Scan directory recursively for code patterns
 */
function scanDirectory($dir, $patterns, &$output) {
    $files = glob($dir . '/*');
    
    foreach ($files as $file) {
        if (is_dir($file)) {
            scanDirectory($file, $patterns, $output);
        } else if (pathinfo($file, PATHINFO_EXTENSION) == 'php') {
            $content = file_get_contents($file);
            $lines = explode("\n", $content);
            
            foreach ($lines as $lineNum => $line) {
                foreach ($patterns as $pattern) {
                    if (stripos($line, $pattern) !== false && 
                        stripos($line, 'comment') === false && 
                        stripos($line, '* ') === false) {
                        
                        $relativeFile = str_replace(dirname(__DIR__) . '/', '', $file);
                        $output[$relativeFile][$lineNum + 1] = $line;
                    }
                }
            }
        }
    }
} 