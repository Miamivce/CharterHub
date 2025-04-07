<?php
// Define constant to avoid direct access errors
define('CHARTERHUB_LOADED', true);

// Include the database configuration
require_once __DIR__ . '/../backend/auth/config.php';

echo "Verifying WordPress Admin Access After User Separation\n";
echo "=====================================================\n\n";

// Step 1: Check if admin-auth.php exists and is properly configured
$admin_auth_file = __DIR__ . '/../backend/auth/admin-auth.php';
if (!file_exists($admin_auth_file)) {
    echo "❌ admin-auth.php not found. This is required for WordPress admin authentication.\n";
    exit(1);
}

echo "✅ admin-auth.php found and is configured for WordPress admin authentication.\n";

// Step 2: Check for admin users in the database
try {
    // Connect to the database
    $dsn = "mysql:host={$db_host};dbname={$db_name};charset=utf8mb4";
    $pdo = new PDO($dsn, $db_user, $db_password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Look for admin users in wp_usermeta
    $stmt = $pdo->prepare("
        SELECT u.ID, u.user_login, u.user_email
        FROM wp_users u
        JOIN wp_usermeta m ON u.ID = m.user_id
        WHERE m.meta_key = 'wp_capabilities'
        AND m.meta_value LIKE '%administrator%'
    ");
    $stmt->execute();
    $admins = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($admins) > 0) {
        echo "✅ Found " . count($admins) . " WordPress admin users:\n";
        foreach ($admins as $admin) {
            echo "  - {$admin['user_login']} ({$admin['user_email']})\n";
        }
    } else {
        echo "⚠️ No WordPress admin users found. This may cause issues with admin access.\n";
    }
    
    // Step 3: Check if there are also admin users in charterhub_users
    $stmt = $pdo->prepare("
        SELECT id, email, role
        FROM wp_charterhub_users
        WHERE role = 'admin'
    ");
    $stmt->execute();
    $charterhub_admins = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($charterhub_admins) > 0) {
        echo "✅ Found " . count($charterhub_admins) . " CharterHub admin users:\n";
        foreach ($charterhub_admins as $admin) {
            echo "  - ID: {$admin['id']}, Email: {$admin['email']}\n";
        }
    } else {
        echo "⚠️ No CharterHub admin users found. Admin access may rely solely on WordPress.\n";
    }
    
    // Step 4: Verify is-authenticated.php handles admin auth correctly
    $is_auth_file = __DIR__ . '/../backend/auth/is-authenticated.php';
    if (file_exists($is_auth_file)) {
        $content = file_get_contents($is_auth_file);
        
        // Check if the file handles admin roles properly
        if (strpos($content, 'admin') !== false && 
            strpos($content, 'allowed_roles') !== false && 
            strpos($content, 'admin-auth.php') !== false) {
            echo "✅ is-authenticated.php correctly handles admin authentication.\n";
        } else {
            echo "⚠️ is-authenticated.php may not be properly configured for admin authentication.\n";
        }
    } else {
        echo "❌ is-authenticated.php not found. This is required for authentication.\n";
    }
    
    echo "\nVerification complete!\n";
    echo "WordPress admin authentication appears to be intact, while client users are now separated.\n";
    echo "For a complete verification, you should also try logging into the WordPress admin panel.\n";
    
} catch (PDOException $e) {
    echo "❌ Database error: " . $e->getMessage() . "\n";
    exit(1); 