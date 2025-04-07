<?php
/**
 * Test Registration Script
 * 
 * This script tests the registration functionality by directly connecting to the database
 * and inserting a new user with all the required fields.
 */

// Include database configuration
require_once 'backend/db-config.php';

// Set up test data
$test_data = [
    'email' => 'test_user_' . time() . '@example.com',
    'username' => 'testuser' . rand(1000, 9999),
    'password' => password_hash('TestPassword123', PASSWORD_DEFAULT),
    'first_name' => 'Test',
    'last_name' => 'User',
    'display_name' => 'Test User',
    'role' => 'client',
    'verification_token' => bin2hex(random_bytes(16))
];

echo "Testing registration with data:\n";
echo "Email: " . $test_data['email'] . "\n";
echo "Username: " . $test_data['username'] . "\n";
echo "First Name: " . $test_data['first_name'] . "\n";
echo "Last Name: " . $test_data['last_name'] . "\n";
echo "Role: " . $test_data['role'] . "\n\n";

try {
    // Get database connection
    $pdo = get_db_connection_from_config();
    echo "Database connection successful\n";
    
    // Check if user already exists
    $stmt = $pdo->prepare("SELECT id FROM wp_charterhub_users WHERE email = ? OR username = ?");
    $stmt->execute([$test_data['email'], $test_data['username']]);
    if ($result = $stmt->fetch()) {
        echo "User already exists with ID: " . $result['id'] . "\n";
        exit;
    }
    
    // Start transaction
    $pdo->beginTransaction();
    echo "Transaction started\n";
    
    // Insert user
    $sql = "
        INSERT INTO wp_charterhub_users (
            email, 
            username,
            password,
            first_name, 
            last_name, 
            display_name, 
            role, 
            verified, 
            verification_token, 
            created_at, 
            updated_at
        ) VALUES (
            :email,
            :username,
            :password,
            :first_name,
            :last_name,
            :display_name,
            :role,
            0,
            :verification_token,
            NOW(),
            NOW()
        )
    ";
    
    echo "Preparing SQL statement...\n";
    $stmt = $pdo->prepare($sql);
    
    echo "Binding parameters...\n";
    $stmt->bindParam(':email', $test_data['email']);
    $stmt->bindParam(':username', $test_data['username']);
    $stmt->bindParam(':password', $test_data['password']);
    $stmt->bindParam(':first_name', $test_data['first_name']);
    $stmt->bindParam(':last_name', $test_data['last_name']);
    $stmt->bindParam(':display_name', $test_data['display_name']);
    $stmt->bindParam(':role', $test_data['role']);
    $stmt->bindParam(':verification_token', $test_data['verification_token']);
    
    echo "Executing statement...\n";
    $result = $stmt->execute();
    
    if ($result) {
        $user_id = $pdo->lastInsertId();
        echo "User inserted successfully with ID: " . $user_id . "\n";
        
        // Commit the transaction
        $pdo->commit();
        echo "Transaction committed\n";
        
        // Verify insertion by retrieving the user
        $stmt = $pdo->prepare("SELECT * FROM wp_charterhub_users WHERE id = ?");
        $stmt->execute([$user_id]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            echo "User verification successful:\n";
            echo "ID: " . $user['id'] . "\n";
            echo "Email: " . $user['email'] . "\n";
            echo "Username: " . $user['username'] . "\n";
            echo "First Name: " . $user['first_name'] . "\n";
            echo "Last Name: " . $user['last_name'] . "\n";
            echo "Role: " . $user['role'] . "\n";
            echo "Created At: " . $user['created_at'] . "\n";
        } else {
            echo "Failed to verify user insertion\n";
        }
    } else {
        echo "Failed to insert user\n";
        $pdo->rollBack();
        echo "Transaction rolled back\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
        echo "Transaction rolled back due to error\n";
    }
} 