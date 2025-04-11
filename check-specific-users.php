<?php
header("Content-Type: text/plain");
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "=== SPECIFIC USERS PASSWORD CHECK ===\n\n";

$host = "mysql-charterhub-charterhub.c.aivencloud.com";
$port = "19174";
$dbname = "defaultdb";
$user = "avnadmin";
$pass = 'AVNS_HCZbm5bZJE1L9C8Pz8C';

// Email addresses to check
$emailsToCheck = [
    'admin@charterhub.com',
    'test3@me.com'
];

try {
    // Connect to database with PDO
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    
    echo "✅ Connected to database successfully\n\n";
    
    // Check both possible table naming conventions
    $tables = [
        'charterhub_users', 
        'wp_charterhub_users', 
        'users'
    ];
    
    foreach ($tables as $table) {
        // Check if table exists
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if ($stmt->rowCount() > 0) {
            echo "Found table: $table\n";
            
            // Get table structure
            echo "Table structure:\n";
            $columns = $pdo->query("DESCRIBE $table");
            $columnNames = [];
            while ($col = $columns->fetch()) {
                echo "  - {$col['Field']} ({$col['Type']})\n";
                $columnNames[] = $col['Field'];
            }
            echo "\n";
            
            // Determine password column name - either 'password' or 'user_pass'
            $passwordColumn = in_array('user_pass', $columnNames) ? 'user_pass' : 'password';
            $emailColumn = in_array('user_email', $columnNames) ? 'user_email' : 'email';
            
            if (!in_array($passwordColumn, $columnNames)) {
                echo "⚠️ No password column found in $table\n\n";
                continue;
            }
            
            // Query for each email
            foreach ($emailsToCheck as $email) {
                $stmt = $pdo->prepare("SELECT * FROM $table WHERE $emailColumn = :email");
                $stmt->execute(['email' => $email]);
                $user = $stmt->fetch();
                
                if ($user) {
                    echo "✅ FOUND USER: $email in table $table\n";
                    echo "User ID: {$user['id'] ?? $user['ID'] ?? 'unknown'}\n";
                    echo "Password hash: {$user[$passwordColumn]}\n";
                    
                    // Analyze hash format
                    $hash = $user[$passwordColumn];
                    if (substr($hash, 0, 4) == '$2y$') {
                        echo "Hash type: BCrypt (PHP native)\n";
                    } elseif (substr($hash, 0, 7) == '$P$B') {
                        echo "Hash type: WordPress phpass\n";
                    } elseif (substr($hash, 0, 7) == '$argon2') {
                        echo "Hash type: Argon2\n";
                    } elseif (strlen($hash) == 32 && ctype_xdigit($hash)) {
                        echo "Hash type: MD5 (insecure)\n";
                    } elseif (strlen($hash) == 40 && ctype_xdigit($hash)) {
                        echo "Hash type: SHA-1 (insecure)\n";
                    } else {
                        echo "Hash type: Unknown format\n";
                    }
                    
                    echo "Other columns:\n";
                    foreach ($user as $key => $value) {
                        if ($key != $passwordColumn && $key != $emailColumn) {
                            echo "  - $key: $value\n";
                        }
                    }
                    echo "\n";
                }
            }
        } else {
            echo "Table '$table' does not exist\n\n";
        }
    }
    
    // Check if auth_logs has entries
    $stmt = $pdo->query("SHOW TABLES LIKE 'auth_logs'");
    if ($stmt->rowCount() > 0) {
        echo "\nRecent auth_logs entries:\n";
        $logs = $pdo->query("SELECT * FROM auth_logs ORDER BY timestamp DESC LIMIT 10");
        while ($log = $logs->fetch()) {
            echo "- {$log['timestamp']}: {$log['email']} - {$log['action']} - {$log['error_message']}\n";
        }
    }
    
} catch (PDOException $e) {
    echo "❌ Database Error: " . $e->getMessage() . "\n";
    
    // Check if it's an SSL issue
    if (strpos($e->getMessage(), 'SSL') !== false) {
        echo "\nThis appears to be an SSL connection issue. Please check:\n";
        echo "1. SSL is properly configured on the server\n";
        echo "2. The correct CA certificate is being used\n";
    }
}
?> 