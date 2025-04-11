<?php
header('Content-Type: text/plain');
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "=== LOGIN CODE PATCH ===\n\n";

echo "This script will modify the login handler to check both table naming conventions\n\n";

// Find client-login.php file
$login_file = dirname(__FILE__) . '/auth/client-login.php';
if (!file_exists($login_file)) {
    echo "❌ Login file not found at: $login_file\n";
    exit;
}

echo "Found login file: $login_file\n";
$backup_file = $login_file . '.bak_' . date('YmdHis');
copy($login_file, $backup_file);
echo "Created backup at: $backup_file\n\n";

// Read file content
$content = file_get_contents($login_file);
if (empty($content)) {
    echo "❌ Failed to read login file content\n";
    exit;
}

// Check if the file already contains a table name check
if (strpos($content, 'tableExists') !== false || strpos($content, 'wp_charterhub_users') !== false) {
    echo "⚠️ Login file appears to already have table name handling\n";
}

// Modify the SQL query to check both table naming conventions
echo "Modifying login query to handle both table naming conventions...\n";

// Target the user lookup query
$original_query_pattern = '/SELECT\s+id,\s*email,\s*password\s*(?:,\s*\w+\s*)*\s*FROM\s+(\w+)/i';
if (preg_match($original_query_pattern, $content, $matches)) {
    $table_name = $matches[1];
    echo "Found user query with table: $table_name\n";
    
    // Define the replacement - first try with wp_ prefix, then without
    $replacement = "-- Modified to try both table naming conventions
    SELECT id, email, password, first_name, last_name, phone_number, company, role, verified, token_version
    FROM wp_charterhub_users 
    WHERE email = ?
    UNION
    SELECT id, email, password, first_name, last_name, phone_number, company, role, verified, token_version
    FROM charterhub_users
    WHERE email = ?";
    
    // Update the code - adjust parameters to handle duplicate bindings
    $modified_content = preg_replace($original_query_pattern, $replacement, $content);
    
    // We also need to duplicate parameters since we now have 2 placeholders
    $param_pattern = '/(\$stmt\s*=\s*executeQuery\s*\(\s*\$sql\s*,\s*\[\s*\$email\s*\]\s*\)\s*;)/i';
    $param_replacement = '$stmt = executeQuery($sql, [$email, $email]);';
    $modified_content = preg_replace($param_pattern, $param_replacement, $modified_content);
    
    // Make the changes
    if (file_put_contents($login_file, $modified_content)) {
        echo "✅ Successfully updated login code with dual table checks\n";
    } else {
        echo "❌ Failed to write changes to login file\n";
    }
} else {
    echo "❌ Could not find the user query in the login file\n";
}

echo "\n=== LOGIN PATCH COMPLETE ===\n";
echo "Please try logging in again. The code now checks both table naming conventions.\n";
?> 