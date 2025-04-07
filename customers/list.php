// At the very top of the file, before any output
if (!isset($_SERVER['HTTP_AUTHORIZATION'])) {
    http_response_code(401);
    echo json_encode(["error" => "Missing JWT token. Client authentication required." ]);
    exit;
}

$authHeader = $_SERVER['HTTP_AUTHORIZATION'];
if (strpos($authHeader, 'Bearer ') !== 0) {
    http_response_code(400);
    echo json_encode(["error" => "Malformed Authorization header." ]);
    exit;
}

$jwtToken = trim(substr($authHeader, 7));

// Verify the JWT token using our jwt-fix functions
$userData = verify_jwt_token($jwtToken);
if (!$userData) {
    http_response_code(401);
    echo json_encode(["error" => "Invalid or expired token." ]);
    exit;
}

// ... existing code continues ... 