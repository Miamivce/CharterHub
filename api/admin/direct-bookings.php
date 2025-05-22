<?php
/**
 * Direct Bookings API Endpoint
 * 
 * This endpoint handles admin access to booking data without relying on
 * external JWT libraries or middleware.
 * 
 * Supports:
 * - GET: List all bookings or bookings for specific customer
 * - POST: Create new booking
 * - PUT: Update an existing booking
 * - DELETE: Delete a booking
 */

// Define the CHARTERHUB_LOADED constant to grant access to included files
define('CHARTERHUB_LOADED', true);

// Include auth helper with the handle_admin_request function
require_once __DIR__ . '/direct-auth-helper.php';

// Use the admin request handler to properly handle CORS and authentication
handle_admin_request(function($admin_user) {
    // Handle different HTTP methods
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            return handle_get_request();
        case 'POST':
            return handle_post_request();
        case 'PUT':
            return handle_put_request();
        case 'DELETE':
            return handle_delete_request();
        default:
            throw new Exception('Method not allowed');
    }
});

/**
 * Handle GET request - List all bookings or bookings for a specific customer
 * 
 * @return array Booking data
 */
function handle_get_request() {
    // Check if request is for a specific customer
    $customer_id = isset($_GET['customer_id']) ? intval($_GET['customer_id']) : null;
    
    // Temporary success response for testing
    return [
        'message' => 'GET request handled successfully',
        'customer_id' => $customer_id,
        'bookings' => []
    ];
}

/**
 * Handle POST request - Create a new booking
 * 
 * @return array Result of create operation
 */
function handle_post_request() {
    // Temporary success response for testing
    return [
        'message' => 'POST request handled successfully',
        'booking' => []
    ];
}

/**
 * Handle PUT request - Update an existing booking
 * 
 * @return array Result of update operation
 */
function handle_put_request() {
    // Temporary success response for testing
    return [
        'message' => 'PUT request handled successfully',
        'booking' => []
    ];
}

/**
 * Handle DELETE request - Delete a booking
 * 
 * @return array Result of delete operation
 */
function handle_delete_request() {
    // Temporary success response for testing
    return [
        'message' => 'DELETE request handled successfully'
    ];
} 