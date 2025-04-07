<?php
// Define constant to avoid direct access errors
define('CHARTERHUB_LOADED', true);

// Include the database configuration
require_once __DIR__ . '/../backend/auth/config.php';

echo "Analyzing WordPress dependencies (READ-ONLY mode - no changes will be made)...\n";

try {
    // Connect to the database
    $pdo = get_db_connection();
    echo "Connected to database\n";
    
    // 1. Check existing tables
    echo "\nWordPress-related tables in database:\n";
    $stmt = $pdo->query("SHOW TABLES LIKE 'wp\\_%'");
    $wp_tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    foreach ($wp_tables as $table) {
        echo "- $table\n";
    }
    
    // 2. Check how wp_charterhub_users relates to wp_users
    echo "\nExamining wp_charterhub_users table structure:\n";
    $table_name = $db_config['table_prefix'] . 'charterhub_users';
    $stmt = $pdo->query("DESCRIBE $table_name");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($columns as $col) {
        $field = $col['Field'];
        $type = $col['Type'];
        $key = $col['Key'];
        
        echo "- $field ($type)" . ($key ? " [KEY: $key]" : "") . "\n";
        
        // Highlight WordPress-related columns
        if ($field === 'wp_user_id') {
            echo "  ⚠️  This column links to WordPress users table\n";
            
            // Check if it's actually being used
            $stmt = $pdo->query("SELECT COUNT(*) FROM $table_name WHERE wp_user_id IS NOT NULL AND wp_user_id > 0");
            $count = $stmt->fetchColumn();
            echo "  ℹ️  $count records have WordPress user associations\n";
        }
    }
    
    // 3. Analyze backend files for WordPress dependencies
    echo "\nAnalyzing key authentication files for WordPress dependencies:\n";
    
    $files_to_check = [
        __DIR__ . '/../backend/auth/login.php',
        __DIR__ . '/../backend/auth/register.php',
        __DIR__ . '/../backend/auth/update-profile.php',
        __DIR__ . '/../backend/auth/is-authenticated.php',
        __DIR__ . '/../backend/auth/admin-auth.php',
        __DIR__ . '/../backend/auth/jwt-fix.php'
    ];
    
    foreach ($files_to_check as $file) {
        if (file_exists($file)) {
            $content = file_get_contents($file);
            $filename = basename($file);
            
            echo "\nFile: $filename\n";
            
            // Check for various WordPress dependencies
            $wp_patterns = [
                'wp_users' => 'WordPress users table',
                'wp_user_id' => 'WordPress user ID field',
                'check_admin_auth' => 'WordPress admin authentication',
                'wp-load.php' => 'WordPress core',
                'is_user_logged_in' => 'WordPress authentication functions'
            ];
            
            $has_wp_dependencies = false;
            
            foreach ($wp_patterns as $pattern => $description) {
                $count = substr_count(strtolower($content), strtolower($pattern));
                if ($count > 0) {
                    echo "  ⚠️  $count references to $description\n";
                    $has_wp_dependencies = true;
                    
                    // Extract some context for the first occurrence
                    $pos = stripos($content, $pattern);
                    if ($pos !== false) {
                        $start = max(0, $pos - 50);
                        $length = min(100, strlen($content) - $start);
                        $context = substr($content, $start, $length);
                        $context = preg_replace('/[\r\n\s]+/', ' ', $context);
                        echo "    Context: \"..." . htmlspecialchars($context) . "...\"\n";
                    }
                }
            }
            
            if (!$has_wp_dependencies) {
                echo "  ✅ No WordPress dependencies found\n";
            }
        } else {
            echo "File not found: $file\n";
        }
    }
    
    // 4. Check for legacy client endpoints
    echo "\nChecking for legacy client endpoints:\n";
    $legacy_endpoints = [
        __DIR__ . '/../backend/client',
        __DIR__ . '/../backend/api/clients'
    ];
    
    foreach ($legacy_endpoints as $dir) {
        if (is_dir($dir)) {
            echo "- ⚠️ Legacy directory found: " . basename($dir) . "\n";
            
            // Count PHP files
            $php_files = glob("$dir/*.php");
            $php_files = array_merge($php_files, glob("$dir/*/*.php"));
            
            echo "  Contains " . count($php_files) . " PHP files that might need review\n";
        } else {
            echo "- ✅ Legacy directory not found: " . basename($dir) . "\n";
        }
    }
    
    echo "\nAnalysis complete. No changes were made to your system.\n";
    echo "Review the findings above to determine which WordPress dependencies are still needed.\n";
    
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
} 