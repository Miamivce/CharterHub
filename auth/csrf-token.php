<?php
// At the very top of the file, before any output
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Allow-Headers: cache-control,expires,pragma,x-csrf-token,x-requested-with');
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["error" => "Method Not Allowed. Use GET." ]);
    exit;
}

// Generate CSRF token using assumed function generate_csrf_token()
$csrfToken = generate_csrf_token();

header('Content-Type: application/json');
http_response_code(200);
echo json_encode(["csrf_token" => $csrfToken]); 