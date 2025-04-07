<?php
/**
 * Test script for the registration endpoint
 * 
 * This script sends a proper POST request to the registration endpoint
 * to test if it works correctly.
 */

// Test data
$test_data = [
    'email' => 'test_endpoint_' . time() . '@example.com',
    'password' => 'Password123!',
    'firstName' => 'TestEndpoint',
    'lastName' => 'User',
    'phoneNumber' => '123-456-7890',
    'company' => 'Test Company'
];

echo "Testing registration endpoint with data:\n";
echo "Email: " . $test_data['email'] . "\n";
echo "First Name: " . $test_data['firstName'] . "\n";
echo "Last Name: " . $test_data['lastName'] . "\n\n";

// Initialize cURL session
$curl = curl_init();

// Configure cURL options
curl_setopt_array($curl, [
    CURLOPT_URL => 'http://localhost:8000/auth/register.php',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_MAXREDIRS => 10,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
    CURLOPT_CUSTOMREQUEST => 'POST',
    CURLOPT_POSTFIELDS => json_encode($test_data),
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Accept: application/json'
    ],
]);

// Execute cURL request
echo "Sending request to registration endpoint...\n";
$response = curl_exec($curl);
$err = curl_error($curl);
$http_code = curl_getinfo($curl, CURLINFO_HTTP_CODE);

// Close cURL session
curl_close($curl);

echo "HTTP Status Code: " . $http_code . "\n\n";

if ($err) {
    echo "cURL Error: " . $err . "\n";
} else {
    echo "Response:\n" . $response . "\n";
    
    // Decode JSON response
    $json_response = json_decode($response, true);
    
    if (json_last_error() === JSON_ERROR_NONE) {
        echo "\nDecoded Response:\n";
        print_r($json_response);
        
        // Check for verification token and URL
        if (isset($json_response['verification']['token'])) {
            echo "\nVerification Token: " . $json_response['verification']['token'] . "\n";
            echo "Verification URL: " . $json_response['verification']['url'] . "\n";
            
            // Test verification by making a GET request to the verification endpoint
            echo "\nTesting verification...\n";
            
            $verify_curl = curl_init();
            curl_setopt_array($verify_curl, [
                CURLOPT_URL => 'http://localhost:8000/auth/verify-email.php?token=' . $json_response['verification']['token'],
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_MAXREDIRS => 10,
                CURLOPT_TIMEOUT => 30,
                CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
                CURLOPT_CUSTOMREQUEST => 'GET',
                CURLOPT_HTTPHEADER => [
                    'Accept: application/json'
                ],
            ]);
            
            $verify_response = curl_exec($verify_curl);
            $verify_err = curl_error($verify_curl);
            $verify_http_code = curl_getinfo($verify_curl, CURLINFO_HTTP_CODE);
            
            curl_close($verify_curl);
            
            echo "Verification HTTP Status Code: " . $verify_http_code . "\n\n";
            
            if ($verify_err) {
                echo "Verification cURL Error: " . $verify_err . "\n";
            } else {
                echo "Verification Response:\n" . $verify_response . "\n";
            }
        }
    } else {
        echo "Error decoding JSON response: " . json_last_error_msg() . "\n";
    }
} 