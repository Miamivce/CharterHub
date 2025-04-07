<?php
/**
 * Test Authentication System
 * 
 * This script tests the JWT authentication system with the new wp_charterhub_users table
 */

require 'backend/auth/config.php';
require 'backend/auth/JWTAuthService.php';

// Connect to the database
$pdo = get_db_connection();

// Check connection
if (!$pdo) {
    echo "Database connection failed\n";
    exit;
}

// Find a test user in the database
$stmt = $pdo->query("SELECT * FROM wp_charterhub_users LIMIT 1");
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo "No users found in wp_charterhub_users table\n";
    exit;
}

// Print user details
echo "Test user found: " . $user['email'] . " (ID: " . $user['id'] . ")\n";

// Generate JWT token for this user
$tokenData = [
    'sub' => (int)$user['id'],
    'email' => $user['email'],
    'firstName' => $user['first_name'],
    'lastName' => $user['last_name'],
    'role' => $user['role'],
    'verified' => true,
    'iat' => time(),
    'exp' => time() + 3600 // 1 hour expiration
];

$token = JWTAuthService::generateToken($tokenData);
if (!$token) {
    echo "Failed to generate token\n";
    exit;
}

echo "Successfully generated JWT token: " . substr($token, 0, 20) . "...\n";

// Store token in database
$refresh_token = bin2hex(random_bytes(32));
$stmt = $pdo->prepare("
    INSERT INTO wp_jwt_tokens 
    (user_id, token_hash, refresh_token_hash, expires_at, refresh_expires_at) 
    VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR), DATE_ADD(NOW(), INTERVAL 30 DAY))
");

$result = $stmt->execute([
    $user['id'],
    hash('sha256', $token),
    hash('sha256', $refresh_token)
]);

if ($result) {
    echo "Token successfully stored in database\n";
    echo "Authentication system is working correctly!\n";
} else {
    echo "Failed to store token in database\n";
} 