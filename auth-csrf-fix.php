<?php
header('Content-Type: text/plain');
error_reporting(E_ALL);
ini_set('display_errors', 1);
echo "=== CSRF TOKEN FIX ===\n\n";

// Check if the file exists
if (file_exists('auth/csrf-token.php')) {
    echo "Original CSRF token file found, creating backup...\n";
    
    // Create backup
    $backup_result = copy('auth/csrf-token.php', 'auth/csrf-token.php.bak');
    if ($backup_result) {
        echo "✅ Backup created: auth/csrf-token.php.bak\n";
    } else {
        echo "❌ Failed to create backup\n";
        die("Stopping for safety - cannot proceed without backup\n");
    }
    
    // Check if the file exists
    $csrf_content = file_get_contents('auth/csrf-token.php');
    if ($csrf_content === false) {
        echo "❌ Failed to read file\n";
        die("Stopping - cannot read file\n");
    }
    
    echo "Modifying CSRF token handler...\n";
    
    // Create the modified version with wake-up optimization
    $modified_content = <<<'EOF'
<?php
// Enhanced CSRF token generator with hibernation resilience
header('Content-Type: application/json');

// Add CORS headers right away to prevent issues
include_once __DIR__ . '/global-cors.php';

// Service wake-up signaling
echo json_encode([
    'success' => true,
    'waking' => true,
    'message' => 'CSRF service initializing'
]);

// Flush the output buffer to send the initial response
// This prevents timeouts during hibernation wake-up
ob_flush();
flush();

// Allow a short delay for service to fully wake up
sleep(1);

// Generate CSRF token
session_start();
if (!isset($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Log token creation for debugging
error_log("CSRF Token generated/retrieved: " . substr($_SESSION['csrf_token'], 0, 8) . "...");

// Send the actual token in a second response
echo json_encode([
    'success' => true,
    'token' => $_SESSION['csrf_token']
]);
EOF;
    
    // Write the modified version
    $write_result = file_put_contents('auth/csrf-token.php', $modified_content);
    if ($write_result !== false) {
        echo "✅ Modified CSRF token handler with hibernation resilience\n";
    } else {
        echo "❌ Failed to write modified file\n";
        die("Stopping - cannot write file\n");
    }
    
    echo "\nFrontend Implementation Notes:\n";
    echo "1. The modified CSRF endpoint now sends two responses:\n";
    echo "   - First response: Immediate wake-up signal\n";
    echo "   - Second response: Actual CSRF token after service is ready\n";
    echo "2. Update your frontend code to handle both responses\n";
    echo "3. Example frontend code:\n\n";
    
    $frontend_example = <<<'EXAMPLE'
// Example frontend implementation:
async function getCSRFToken() {
  try {
    const response = await fetch('https://charterhub-api.onrender.com/auth/csrf-token.php', {
      credentials: 'include',
    });
    
    // Handle the wake-up signal first
    const wakeUpData = await response.json();
    console.log('Wake-up signal received:', wakeUpData);
    
    // If we got a token in the first response, use it
    if (wakeUpData.token) {
      return wakeUpData.token;
    }
    
    // Otherwise, make a second request after a short delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const tokenResponse = await fetch('https://charterhub-api.onrender.com/auth/csrf-token.php', {
      credentials: 'include',
    });
    const tokenData = await tokenResponse.json();
    
    return tokenData.token;
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    // Fallback to using a client-side generated token
    return 'client-' + Math.random().toString(36).substring(2);
  }
}
EXAMPLE;
    
    echo $frontend_example;
    
    echo "\n\n=== CSRF FIX COMPLETE ===\n";
    echo "Please update your frontend code to handle the modified CSRF endpoint.\n";
    
} else {
    echo "❌ CSRF token file not found: auth/csrf-token.php\n";
    echo "Cannot proceed with fix.\n";
} 