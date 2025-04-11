<?php
header("Content-Type: text/plain");
echo "=== SIMPLIFIED LOGIN CREATOR ===\n\n";

// Create auth/simple-login.php
$simple_login = <<<'EOD'
<?php
// Simplified login handler for Render free tier
header("Content-Type: application/json");

// Add CORS headers immediately
header("Access-Control-Allow-Origin: https://charter-hub.vercel.app");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Authorization, Content-Type, X-CSRF-Token, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Get JSON input
$data = json_decode(file_get_contents("php://input"), true);
$email = $data["email"] ?? "";
$password = $data["password"] ?? "";

// Quick validation
if (empty($email) || empty($password)) {
    echo json_encode([
        "success" => false,
        "message" => "Email and password are required"
    ]);
    exit;
}

// Connect to database
$host = "mysql-charterhub-charterhub.c.aivencloud.com";
$port = "19174";
$dbname = "defaultdb";
$user = "avnadmin";
$pass = "AVNS_HCZbm5bZJE1L9C8Pz8C";

try {
    $db = new PDO("mysql:host=$host;port=$port;dbname=$dbname", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false
    ]);

    // Check credentials
    $stmt = $db->prepare("SELECT id, email, password, first_name, last_name, role FROM wp_charterhub_users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && password_verify($password, $user["password"])) {
        // Generate a simple token
        $token = bin2hex(random_bytes(32));
        
        // Return success response
        echo json_encode([
            "success" => true,
            "token" => $token,
            "user" => [
                "id" => $user["id"],
                "email" => $user["email"],
                "firstName" => $user["first_name"],
                "lastName" => $user["last_name"],
                "role" => $user["role"]
            ]
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Invalid email or password"
        ]);
    }
} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Server error",
        "debug" => $e->getMessage()
    ]);
}
EOD;

if (!file_exists('auth')) {
    mkdir('auth', 0755, true);
    echo "Created auth directory\n";
}

if (file_put_contents('auth/simple-login.php', $simple_login)) {
    echo "✅ Created simplified login handler: auth/simple-login.php\n\n";
    echo "Instructions:\n";
    echo "1. Access this login endpoint at: https://charterhub-api.onrender.com/auth/simple-login.php\n";
    echo "2. Update your frontend code to use this new endpoint\n";
    echo "3. This simplified version avoids complex processing that might cause 502 errors\n";
} else {
    echo "❌ Failed to create login handler\n";
} 