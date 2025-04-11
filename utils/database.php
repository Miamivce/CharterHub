<?php
// Database connection utility

/**
 * Get PDO database connection with proper SSL configuration
 * 
 * @return PDO Database connection
 */
function getDBConnection() {
    // Get database connection details from environment
    $db_host = getenv('DB_HOST') ?: 'mysql-charterhub-charterhub.c.aivencloud.com';
    $db_port = getenv('DB_PORT') ?: '19174';
    $db_name = getenv('DB_NAME') ?: 'defaultdb';
    $db_user = getenv('DB_USER') ?: 'avnadmin';
    $db_pass = getenv('DB_PASSWORD') ?: 'AVNS_HCZbm5bZJE1L9C8Pz8C';
    
    // Check if we should verify SSL certificate
    $ssl_verify = getenv('MYSQL_SSL_VERIFY');
    $verify_server_cert = ($ssl_verify === 'true');
    
    // PDO connection options
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => $verify_server_cert
    ];
    
    // Check for CA certificate
    $ssl_dir = __DIR__ . '/../ssl';
    $ca_file = $ssl_dir . '/ca.pem';
    
    if (file_exists($ca_file)) {
        $options[PDO::MYSQL_ATTR_SSL_CA] = $ca_file;
    }
    
    // Connection string with port
    $dsn = "mysql:host=$db_host;port=$db_port;dbname=$db_name;charset=utf8mb4";
    
    // Create and return PDO instance
    try {
        return new PDO($dsn, $db_user, $db_pass, $options);
    } catch (PDOException $e) {
        // Log error and rethrow
        error_log("Database connection error: " . $e->getMessage());
        throw $e;
    }
}

/**
 * Log authentication attempts
 * 
 * @param int|null $user_id User ID if available
 * @param string $username Username attempting to authenticate
 * @param string $action Action being performed (login, register, etc.)
 * @param string $status Status of the action (success, failure, etc.)
 * @param string|null $error_message Optional error message
 * @return bool Whether the log was successfully created
 */
function logAuth($user_id, $username, $action, $status, $error_message = null) {
    try {
        $pdo = getDBConnection();
        
        // Determine which table to use (support both prefix patterns)
        $tables = ['charterhub_auth_logs', 'wp_charterhub_auth_logs'];
        $table_to_use = null;
        
        foreach ($tables as $table) {
            $stmt = $pdo->prepare("SHOW TABLES LIKE :table");
            $stmt->execute(['table' => $table]);
            if ($stmt->rowCount() > 0) {
                $table_to_use = $table;
                break;
            }
        }
        
        // If no table exists, try to create it
        if ($table_to_use === null) {
            $table_to_use = 'charterhub_auth_logs';
            $sql = "CREATE TABLE IF NOT EXISTS `$table_to_use` (
                `id` int(11) NOT NULL AUTO_INCREMENT,
                `user_id` int(11) DEFAULT NULL,
                `username` varchar(255) DEFAULT NULL,
                `action` varchar(255) DEFAULT NULL,
                `status` varchar(50) DEFAULT NULL,
                `ip_address` varchar(45) DEFAULT NULL,
                `user_agent` text,
                `error_message` text,
                `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`),
                KEY `user_id` (`user_id`),
                KEY `username` (`username`),
                KEY `action` (`action`),
                KEY `status` (`status`),
                KEY `created_at` (`created_at`)
            )";
            $pdo->exec($sql);
        }
        
        // Check if error_message column exists
        $stmt = $pdo->prepare("SHOW COLUMNS FROM `$table_to_use` LIKE 'error_message'");
        $stmt->execute();
        if ($stmt->rowCount() === 0) {
            // Add error_message column if it doesn't exist
            $pdo->exec("ALTER TABLE `$table_to_use` ADD COLUMN `error_message` text AFTER `user_agent`");
        }
        
        // Insert log entry
        $sql = "INSERT INTO `$table_to_use` 
                (user_id, username, action, status, ip_address, user_agent, error_message) 
                VALUES (:user_id, :username, :action, :status, :ip, :user_agent, :error_message)";
        
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute([
            'user_id' => $user_id,
            'username' => $username,
            'action' => $action, 
            'status' => $status,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? null,
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
            'error_message' => $error_message
        ]);
        
        return $result;
    } catch (Exception $e) {
        error_log("Error logging authentication: " . $e->getMessage());
        return false;
    }
}

/**
 * Convert WordPress-style users table to our expected format
 * Creates views if needed
 */
function ensureUserTablesCompatibility() {
    try {
        $pdo = getDBConnection();
        
        // Check for WordPress tables
        $stmt = $pdo->query("SHOW TABLES LIKE 'wp\\_%'");
        $wp_tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        if (!empty($wp_tables)) {
            // Look for wp_charterhub_users table
            if (in_array('wp_charterhub_users', $wp_tables) && !tableExists($pdo, 'charterhub_users')) {
                // Create a view for the users table
                $pdo->exec("CREATE OR REPLACE VIEW `charterhub_users` AS SELECT * FROM `wp_charterhub_users`");
            }
            
            // Look for wp_charterhub_auth_logs table
            if (in_array('wp_charterhub_auth_logs', $wp_tables) && !tableExists($pdo, 'charterhub_auth_logs')) {
                // Create a view for the auth logs table
                $pdo->exec("CREATE OR REPLACE VIEW `charterhub_auth_logs` AS SELECT * FROM `wp_charterhub_auth_logs`");
            }
        }
        
        return true;
    } catch (Exception $e) {
        error_log("Error ensuring user tables compatibility: " . $e->getMessage());
        return false;
    }
}

/**
 * Check if a table exists
 * 
 * @param PDO $pdo PDO connection
 * @param string $table Table name to check
 * @return bool Whether the table exists
 */
function tableExists($pdo, $table) {
    $stmt = $pdo->prepare("SHOW TABLES LIKE :table");
    $stmt->execute(['table' => $table]);
    return $stmt->rowCount() > 0;
} 