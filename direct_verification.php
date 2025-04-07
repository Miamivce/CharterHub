<?php
/**
 * Direct Verification Script
 * 
 * This script directly verifies a user in the database without going through the HTTP endpoint.
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
    
    // Start transaction
    $pdo->beginTransaction();
    echo "Started transaction\n";
    
    try {
        // Update user verification status
        echo "Updating user verification status\n";
        $stmt = $pdo->prepare("
            UPDATE wp_charterhub_users 
            SET verified = 1, 
                verification_token = NULL,
                updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$user['id']]);
        echo "User verification status updated\n";
        
        // Log verification success
        echo "Logging verification success\n";
        $stmt = $pdo->prepare("
            INSERT INTO wp_charterhub_auth_logs 
            (user_id, action, status, ip_address, user_agent, details) 
            VALUES (?, 'email_verification', 'success', ?, ?, ?)
        ");
        $stmt->execute([
            $user['id'],
            '127.0.0.1',
            'Direct Verification Script',
            json_encode([
                'email' => $user['email'],
                'verification_time' => date('Y-m-d H:i:s')
            ])
        ]);
        echo "Verification success logged\n";
        
        // Commit the transaction
        $pdo->commit();
        echo "Transaction committed\n";
        
        // Verify the update
        $stmt = $pdo->prepare("SELECT verified FROM wp_charterhub_users WHERE id = ?");
        $stmt->execute([$user['id']]);
        $updated_user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($updated_user) {
            echo "\nUser verification status: " . ($updated_user['verified'] ? "Verified" : "Not Verified") . "\n";
        }
        
    } catch (Exception $e) {
        $pdo->rollBack();
        echo "Transaction rolled back due to error\n";
        throw $e;
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
} 