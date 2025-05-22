<?php
/**
 * Customer API Redirect
 * 
 * This file redirects all customer-related requests to the direct-customers.php API endpoint
 * This fixes the issue where the older customer endpoint path is still being used
 */

// Log the redirection for debugging
error_log("Redirecting customer request from /customers/index.php to /api/admin/direct-customers.php");

// Include the direct-customers.php file with all its functionality
require_once __DIR__ . '/../api/admin/direct-customers.php';

// The script will terminate after direct-customers.php completes
exit; 