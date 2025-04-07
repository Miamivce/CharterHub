<?php
// Define CHARTERHUB_LOADED constant
define('CHARTERHUB_LOADED', true);

// Include shared config
require_once __DIR__ . '/../auth/config.php';

// Connect to the database
try {
    $pdo = get_db_connection();
    echo "Connected to database successfully\n";
    
    // Debug database configuration
    echo "Database configuration: " . json_encode([
        'host' => $db_config['host'],
        'port' => $db_config['port'] ?? 'default',
        'name' => $db_config['name'] ?? $db_config['dbname'] ?? 'unknown',
        'table_prefix' => $db_config['table_prefix']
    ]) . "\n";
    
    // Check if the tables exist before dropping
    $stmt = $pdo->query("SHOW TABLES LIKE '{$db_config['table_prefix']}charterhub_clients'");
    $clients_table_exists = ($stmt && $stmt->rowCount() > 0);
    echo "Table {$db_config['table_prefix']}charterhub_clients exists: " . ($clients_table_exists ? 'YES' : 'NO') . "\n";
    
    $stmt = $pdo->query("SHOW TABLES LIKE '{$db_config['table_prefix']}jwt_tokens'");
    $tokens_table_exists = ($stmt && $stmt->rowCount() > 0);
    echo "Table {$db_config['table_prefix']}jwt_tokens exists: " . ($tokens_table_exists ? 'YES' : 'NO') . "\n";
    
    // Drop tables
    if ($clients_table_exists) {
        $pdo->exec("DROP TABLE {$db_config['table_prefix']}charterhub_clients");
        echo "Successfully dropped {$db_config['table_prefix']}charterhub_clients table\n";
    } else {
        echo "Table {$db_config['table_prefix']}charterhub_clients does not exist, skipping\n";
    }
    
    if ($tokens_table_exists) {
        $pdo->exec("DROP TABLE {$db_config['table_prefix']}jwt_tokens");
        echo "Successfully dropped {$db_config['table_prefix']}jwt_tokens table\n";
    } else {
        echo "Table {$db_config['table_prefix']}jwt_tokens does not exist, skipping\n";
    }
    
    // List all tables to verify
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "All tables in database: " . implode(", ", $tables) . "\n";
    
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
    exit(1);
}

echo "Tables cleanup complete\n"; 