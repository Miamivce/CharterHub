<?php 
header("Content-Type: text/plain"); 
echo "=== TARGETED PASSWORD CHECK ===\n\n"; 
$host = "mysql-charterhub-charterhub.c.aivencloud.com"; 
$port = "19174"; 
$dbname = "defaultdb"; 
$user = "avnadmin"; 
$pass = 'AVNS_HCZbm5bZJE1L9C8Pz8C'; 

try { 
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, 
        PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]); 
    echo "✅ Connected\n\n"; 
    
    $emails = ["admin@charterhub.com", "test3@me.com"]; 
    
    foreach($emails as $email) { 
        echo "Checking user: $email\n"; 
        $stmt = $pdo->prepare("SELECT id, email, password, role FROM wp_charterhub_users WHERE email = ?"); 
        $stmt->execute([$email]); 
        $user = $stmt->fetch(); 
        
        if(!$user) { 
            echo "- User not found\n\n"; 
            continue; 
        } 
        
        echo "- User found! ID: {$user["id"]}, Role: {$user["role"]}\n"; 
        echo "- Password hash: " . substr($user["password"], 0, 10) . "...\n"; 
        
        $hash_type = ""; 
        if(strpos($user["password"], "$2y$") === 0) { 
            $hash_type = "bcrypt (PHP password_hash)"; 
        } elseif(strpos($user["password"], "$P$") === 0) { 
            $hash_type = "WordPress phpass"; 
        } elseif(strlen($user["password"]) === 32 && ctype_xdigit($user["password"])) { 
            $hash_type = "MD5 (unsalted)"; 
        } elseif(strlen($user["password"]) === 40 && ctype_xdigit($user["password"])) { 
            $hash_type = "SHA1 (unsalted)"; 
        } else {
            $hash_type = "Unknown format";
        }
        
        echo "- Hash type: $hash_type\n\n"; 
    } 
    
    // Check alternative table names
    echo "\nChecking alternative table names:\n";
    $tables = [
        "charterhub_users", 
        "users",
        "wp_users"
    ];
    
    foreach($tables as $table) {
        try {
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM $table");
            $result = $stmt->fetch();
            echo "- Table '$table': {$result['count']} users found\n";
            
            // Show a sample if users exist
            if($result['count'] > 0) {
                $sample = $pdo->query("SELECT * FROM $table LIMIT 1")->fetch();
                echo "  Sample columns: " . implode(", ", array_keys($sample)) . "\n";
                
                // Check password column names
                $columns = ["password", "user_pass", "pass"];
                foreach($columns as $col) {
                    if(isset($sample[$col])) {
                        echo "  Password column found: '$col'\n";
                        break;
                    }
                }
            }
        } catch(PDOException $e) {
            echo "- Table '$table': not found\n";
        }
    }
    
    // List all tables
    echo "\nAll database tables:\n";
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    foreach($tables as $table) {
        echo "- $table\n";
    }
} catch(PDOException $e) { 
    echo "❌ Error: ".$e->getMessage(); 
} 