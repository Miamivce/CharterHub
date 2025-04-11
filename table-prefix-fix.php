<?php
/**
 * CharterHub Table Prefix Maintenance Script
 * 
 * This script automatically detects all tables with the WordPress prefix (wp_charterhub_)
 * and creates views without the prefix to ensure code compatibility.
 */

// Set error display settings for diagnostics
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Define a constant to prevent direct access to included files
define('CHARTERHUB_LOADED', true);

// Set content type to JSON for easier parsing
header('Content-Type: application/json');

// Results storage
$results = [
    'status' => 'running',
    'timestamp' => date('Y-m-d H:i:s'),
    'database_connection' => null,
    'tables_found' => [],
    'views_created' => [],
    'views_updated' => [],
    'errors' => []
];

/**
 * Add a message to the output
 */
function addMessage($message) {
    global $results;
    $results['messages'][] = $message;
    echo $message . "\n";
    flush();
}

try {
    // Include database utilities
    require_once __DIR__ . '/utils/database.php';
    addMessage("✅ Database utilities loaded successfully");
    
    // Test database connection
    try {
        $pdo = getDbConnection();
        $results['database_connection'] = "Success";
        addMessage("✅ Database connection established successfully");
        
        // Get all tables
        $stmt = $pdo->query("SHOW TABLES");
        $allTables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        // Filter for tables with the wp_charterhub_ prefix
        $targetPrefix = 'wp_charterhub_';
        $targetTables = [];
        
        foreach ($allTables as $table) {
            if (strpos($table, $targetPrefix) === 0) {
                $targetTables[] = $table;
            }
        }
        
        $results['tables_found'] = $targetTables;
        addMessage("📊 Found " . count($targetTables) . " tables with prefix '{$targetPrefix}'");
        
        if (empty($targetTables)) {
            addMessage("⚠️ No tables found with prefix '{$targetPrefix}'");
            $results['status'] = "warning";
            echo json_encode($results);
            exit;
        }
        
        // Begin transaction for view creation
        $pdo->beginTransaction();
        
        // Process each table
        foreach ($targetTables as $table) {
            // Get the table name without the prefix
            $viewName = str_replace($targetPrefix, '', $table);
            
            try {
                // Check if view already exists
                $viewExists = false;
                $stmt = $pdo->prepare("SELECT COUNT(*) FROM information_schema.tables 
                                      WHERE table_schema = DATABASE() 
                                      AND table_name = ? 
                                      AND table_type = 'VIEW'");
                $stmt->execute([$viewName]);
                $viewExists = $stmt->fetchColumn() > 0;
                
                if ($viewExists) {
                    // Update existing view
                    $pdo->exec("DROP VIEW IF EXISTS `{$viewName}`");
                    $pdo->exec("CREATE VIEW `{$viewName}` AS SELECT * FROM `{$table}`");
                    addMessage("🔄 Updated existing view '{$viewName}' to point to '{$table}'");
                    $results['views_updated'][] = $viewName;
                } else {
                    // Create new view
                    $pdo->exec("CREATE VIEW `{$viewName}` AS SELECT * FROM `{$table}`");
                    addMessage("✅ Created new view '{$viewName}' pointing to '{$table}'");
                    $results['views_created'][] = $viewName;
                }
            } catch (Exception $e) {
                addMessage("❌ Error creating/updating view '{$viewName}': " . $e->getMessage());
                $results['errors'][] = [
                    'table' => $table,
                    'view' => $viewName,
                    'error' => $e->getMessage()
                ];
            }
        }
        
        // Commit transaction
        $pdo->commit();
        
        // Create a db_config value if it doesn't exist to make future migrations easier
        try {
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM information_schema.tables 
                                  WHERE table_schema = DATABASE() 
                                  AND table_name = 'charterhub_config'");
            $stmt->execute();
            $configTableExists = $stmt->fetchColumn() > 0;
            
            if (!$configTableExists) {
                $pdo->exec("CREATE TABLE IF NOT EXISTS `charterhub_config` (
                    `id` int(11) NOT NULL AUTO_INCREMENT,
                    `config_key` varchar(255) NOT NULL,
                    `config_value` text,
                    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    PRIMARY KEY (`id`),
                    UNIQUE KEY `config_key` (`config_key`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
                
                $stmt = $pdo->prepare("INSERT INTO `charterhub_config` (`config_key`, `config_value`) VALUES (?, ?)");
                $stmt->execute(['table_prefix', 'wp_charterhub_']);
                
                addMessage("✅ Created config table and stored table_prefix setting");
            }
        } catch (Exception $e) {
            addMessage("⚠️ Note: Could not create config table: " . $e->getMessage());
        }
        
        // Summarize results
        $created = count($results['views_created']);
        $updated = count($results['views_updated']);
        $errors = count($results['errors']);
        
        addMessage("\n---- TABLE PREFIX FIX RESULTS ----");
        addMessage("Found {$created} tables with prefix '{$targetPrefix}'");
        
        if ($created > 0) {
            addMessage("✅ Created {$created} new database views");
        }
        
        if ($updated > 0) {
            addMessage("🔄 Updated {$updated} existing database views");
        }
        
        if ($errors > 0) {
            addMessage("❌ Encountered {$errors} errors");
            $results['status'] = "completed_with_errors";
        } else {
            $results['status'] = "completed";
            addMessage("✅ All views created successfully");
        }
        
    } catch (Exception $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        $results['database_connection'] = "Failed: " . $e->getMessage();
        addMessage("❌ Database error: " . $e->getMessage());
        $results['status'] = "error";
        $results['error'] = $e->getMessage();
    }
    
} catch (Exception $e) {
    addMessage("❌ Critical error: " . $e->getMessage());
    $results['status'] = "error";
    $results['error'] = $e->getMessage();
}

// Output final results
echo json_encode($results);
?> 