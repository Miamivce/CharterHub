<?php
// Define constant to avoid direct access errors
define('CHARTERHUB_LOADED', true);

// Include the database configuration
require_once __DIR__ . '/../backend/auth/config.php';

echo "Updating authentication code to remove WordPress dependencies for clients...\n\n";

// Files that need to be updated
$auth_files = [
    'is-authenticated.php' => [
        'path' => __DIR__ . '/../backend/auth/is-authenticated.php',
        'changes' => [
            // Only check WordPress admin auth for admin role, not client
            'pattern' => '/(\$check_admin\s+&&\s+in_array\(\'admin\'\s*,\s*\$allowed_roles\))/i',
            'replacement' => '$1 && !in_array(\'client\', $allowed_roles)'
        ]
    ],
    'admin-auth.php' => [
        'path' => __DIR__ . '/../backend/auth/admin-auth.php',
        'backup' => true
    ],
    'login.php' => [
        'path' => __DIR__ . '/../backend/auth/login.php',
        'changes' => [
            // Remove any joins with wp_users
            'pattern' => '/JOIN\s+.*wp_users.*ON/i',
            'replacement' => '-- Removed WordPress JOIN: '
        ]
    ]
];

// Process each file
foreach ($auth_files as $filename => $config) {
    $filepath = $config['path'];
    
    if (!file_exists($filepath)) {
        echo "File not found: $filename - skipping\n";
        continue;
    }
    
    echo "Processing file: $filename\n";
    $content = file_get_contents($filepath);
    $original_content = $content;
    
    // Create a backup if needed
    if (!empty($config['backup'])) {
        $backup_path = $filepath . '.bak.' . date('YmdHis');
        file_put_contents($backup_path, $content);
        echo "- Created backup: " . basename($backup_path) . "\n";
    }
    
    // Apply the changes
    if (!empty($config['changes'])) {
        // Can be a single pattern/replacement or an array of them
        if (isset($config['changes']['pattern'])) {
            // Single change
            $content = preg_replace(
                $config['changes']['pattern'],
                $config['changes']['replacement'],
                $content,
                -1,
                $count
            );
            echo "- Applied " . $count . " replacements\n";
        } else {
            // Multiple changes
            foreach ($config['changes'] as $change) {
                $content = preg_replace(
                    $change['pattern'],
                    $change['replacement'],
                    $content,
                    -1,
                    $count
                );
                echo "- Applied " . $count . " replacements for pattern: " . $change['pattern'] . "\n";
            }
        }
    }
    
    // Special case for admin-auth.php - we want to modify how it works but not remove it completely
    if ($filename === 'admin-auth.php') {
        // Add a comment to clarify this is only for WordPress admin, not clients
        $comment = <<<EOT
/**
 * IMPORTANT: This file is now ONLY used for WordPress admin authentication.
 * It should NOT be used for client authentication which uses the JWT system.
 * The wp_user_id field has been removed from wp_charterhub_users table.
 */

EOT;
        $content = $comment . $content;
        echo "- Added clarification comment to admin-auth.php\n";
    }
    
    // Only write file if changes were made
    if ($content !== $original_content) {
        file_put_contents($filepath, $content);
        echo "- Updated file: $filename\n";
    } else {
        echo "- No changes made to: $filename\n";
    }
}

echo "\nCode update complete!\n";
echo "Authentication code has been updated to separate client users from WordPress.\n";
echo "WordPress admin authentication is still preserved for admin users only.\n"; 