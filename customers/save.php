<?php
/**
 * Customer Save API Redirect
 * 
 * This file redirects customer save requests to the direct-customers.php API endpoint
 * This fixes the issue where the older customer save endpoint path is still being used
 */

// Log the redirection for debugging
error_log("Redirecting customer save request from /customers/save.php to /api/admin/direct-customers.php");

// Set method to POST to ensure it goes to the create/update handler
$_SERVER['REQUEST_METHOD'] = 'POST';

// Include the direct-customers.php file with all its functionality
require_once __DIR__ . '/../api/admin/direct-customers.php';

// The script will terminate after direct-customers.php completes
exit; 