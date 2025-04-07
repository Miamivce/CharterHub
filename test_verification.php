<?php
/**
 * Test script for the verification endpoint
 * 
 * This script tests the verification endpoint directly by querying the database
 * for a verification token and then making a request to the verification endpoint.
 */

// Include database configuration
require_once 'backend/db-config.php';

try {
    // Get database connection
    $pdo = get_db_connection_from_config();
    echo "Database connection successful\n";
    
    // Get the most recent unverified user with a verification token
    $stmt = $pdo->prepare("
        SELECT id, email, verification_token 
        FROM wp_charterhub_users 
        WHERE verified = 0 
        AND verification_token IS NOT NULL 
        ORDER BY id DESC 
        LIMIT 1
    ");
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        echo "No unverified users found with verification tokens\n";
        exit;
    }
    
    echo "Found unverified user:\n";
    echo "ID: " . $user['id'] . "\n";
    echo "Email: " . $user['email'] . "\n";
    echo "Verification Token: " . $user['verification_token'] . "\n\n";
    
    // Test verification by making a GET request to the verification endpoint
    echo "Testing verification...\n";
    
    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => 'http://localhost:8000/auth/verify-email.php?token=' . $user['verification_token'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_MAXREDIRS => 10,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_CUSTOMREQUEST => 'GET',
        CURLOPT_HTTPHEADER => [
            'Accept: application/json'
        ],
        CURLOPT_VERBOSE => true
    ]);
    
    $response = curl_exec($curl);
    $err = curl_error($curl);
    $http_code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    
    curl_close($curl);
    
    echo "HTTP Status Code: " . $http_code . "\n\n";
    
    if ($err) {
        echo "cURL Error: " . $err . "\n";
    } else {
        echo "Response:\n" . $response . "\n";
        
        // Check if user is now verified
        $stmt = $pdo->prepare("SELECT verified FROM wp_charterhub_users WHERE id = ?");
        $stmt->execute([$user['id']]);
        $updated_user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($updated_user) {
            echo "\nUser verification status: " . ($updated_user['verified'] ? "Verified" : "Not Verified") . "\n";
        }
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
} 