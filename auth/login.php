<?php
// At the very top, after including necessary files
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Method Not Allowed. Use POST." ]);
    exit;
}

// Read JSON payload
$input = file_get_contents('php://input');
$data = json_decode($input, true);
if (!is_array($data) || !isset($data['username']) || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode(["error" => "Username and password are required." ]);
    exit;
}

$username = trim($data['username']);
$password = trim($data['password']);

// Authenticate the user using custom or WP authentication logic
// For client users, ensure we use JWT authentication exclusively
$user = authenticate_client_user($username, $password);
if (!$user) {
    http_response_code(401);
    echo json_encode(["error" => "Invalid credentials." ]);
    exit;
}

// Generate JWT token using improved jwt-fix functions
// generate_jwt_token is assumed to be defined in jwt-fix.php
$token = generate_jwt_token($user);
if (!$token) {
    http_response_code(500);
    echo json_encode(["error" => "Could not generate token." ]);
    exit;
}

// Return token and user info
header('Content-Type: application/json');
http_response_code(200);
echo json_encode([
    "token" => $token,
    "user"  => [
         "id" => $user->ID,
         "username" => $user->user_login,
         "role" => $user->role,
         "auth_method" => "jwt"
    ]
]); 