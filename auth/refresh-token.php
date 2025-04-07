// At the top of the file, enforce POST method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Method Not Allowed. Use POST." ]);
    exit;
}

// Require the Authorization header with Bearer token
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

$oldToken = trim(substr($authHeader, 7));
error_log('Refresh Token Received: ' . $oldToken);

// Decode the token without enforcing expiration, allowing refresh of expired tokens
$userData = decode_jwt_token_allow_expired($oldToken);
if ($userData) {
    error_log('Decoded token data: ' . print_r($userData, true));
} else {
    error_log('Failed to decode token in refresh endpoint.');
    http_response_code(401);
    echo json_encode(["error" => "Invalid token or token data could not be decoded." ]);
    exit;
}

// Optionally, you can check here if the token is within an allowed refresh window
// For example, if (time() - $userData->iat > $allowedRefreshWindow) { ... }

// Generate a new JWT token using the improved token generation function
$newToken = generate_jwt_token($userData);
if (!$newToken) {
    http_response_code(500);
    echo json_encode(["error" => "Failed to generate new token." ]);
    exit;
}

header('Content-Type: application/json');
http_response_code(200);
echo json_encode(["token" => $newToken]);

// End of refresh-token endpoint logic 