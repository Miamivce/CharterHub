<?php
/**
 * WordPress API Import Script
 * 
 * This is a one-time script to fetch a limited number of yachts and destinations 
 * from the WordPress API and populate our local database.
 * 
 * READ-ONLY: This script only reads from the API and will not modify the WordPress site.
 */

// Load database configuration
require_once __DIR__ . '/backend/auth/config.php';

// Constants
define('YACHT_API_URL', 'https://yachtstory.com/wp-json/wp/v2/yacht');
define('LOCATION_API_URL', 'https://yachtstory.com/wp-json/wp/v2/location');
define('MAX_ITEMS', 10);

// Set up error handling
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "=== WordPress Data Import Tool ===\n";
echo "WARNING: This tool is for ONE-TIME USE ONLY\n";
echo "This will pull data from yachtstory.com and add to local database\n";
echo "LIMITATIONS: Maximum " . MAX_ITEMS . " items per type (yacht, destination)\n";
echo "READ-ONLY: This script will NOT modify the WordPress site\n\n";

// Function to safely get database connection
function get_database_connection() {
    global $db_config;
    
    // Try to use the recommended function if it exists
    if (function_exists('get_db_connection_from_config')) {
        return get_db_connection_from_config($db_config);
    }
    
    // Fallback to the get_db_connection function if it exists
    if (function_exists('get_db_connection')) {
        return get_db_connection();
    }
    
    // Manual connection as last resort
    $conn = new mysqli($db_config['host'], $db_config['user'], $db_config['pass'], $db_config['name']);
    
    if ($conn->connect_error) {
        die("Database connection failed: " . $conn->connect_error);
    }
    
    return $conn;
}

// Function to fetch data from API
function fetch_api_data($url, $limit = MAX_ITEMS) {
    echo "Fetching data from: $url (limit: $limit)...\n";
    
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => [
                'User-Agent: CharterHub Import Script (READ-ONLY)',
                'Accept: application/json'
            ]
        ]
    ]);
    
    $response = file_get_contents($url . '?per_page=' . $limit, false, $context);
    
    if ($response === false) {
        die("Error fetching data from API: $url\n");
    }
    
    return json_decode($response, true);
}

// Function to process yacht data
function process_yacht_data($yacht) {
    // Extract basic info
    $id = $yacht['id'];
    $name = isset($yacht['title']['rendered']) ? $yacht['title']['rendered'] : 'Unknown Yacht';
    $description = isset($yacht['content']['rendered']) ? $yacht['content']['rendered'] : '';
    
    // Extract specifications
    $length = '';
    $capacity = 0;
    $crew = 0;
    $base_price = '0.00';
    $featured_image = '';
    
    // Get specifications from ACF fields
    if (isset($yacht['acf']['charter_detail__specs'])) {
        $specs = $yacht['acf']['charter_detail__specs'];
        $length = isset($specs['specs__length_m']) ? $specs['specs__length_m'] . 'm' : 
                 (isset($specs['specs__lenght_ft']) ? $specs['specs__lenght_ft'] . 'ft' : '');
        $capacity = isset($specs['specs__guests']) ? intval($specs['specs__guests']) : 0;
        $crew = isset($specs['specs__crew']) ? intval($specs['specs__crew']) : 0;
    }
    
    // Get featured image
    if (isset($yacht['acf']['charter_detail__banner_image']['url'])) {
        $featured_image = $yacht['acf']['charter_detail__banner_image']['url'];
    }
    
    // Base price - assume default as we don't see this in the sample data
    $base_price = '10000.00';
    
    return [
        'id' => $id,
        'name' => $name,
        'description' => $description,
        'length' => $length,
        'capacity' => $capacity,
        'crew' => $crew,
        'base_price' => $base_price,
        'featured_image' => $featured_image
    ];
}

// Function to process destination data
function process_destination_data($location) {
    // Extract basic info
    $id = $location['id'];
    $name = isset($location['title']['rendered']) ? $location['title']['rendered'] : 'Unknown Location';
    $description = isset($location['content']['rendered']) ? $location['content']['rendered'] : '';
    
    // Extract ACF fields
    $regions = [];
    $highlights = [];
    $best_time_to_visit = '';
    $climate = '';
    $featured_image = '';
    
    // Get data from ACF fields
    if (isset($location['acf'])) {
        $acf = $location['acf'];
        
        if (isset($acf['destination_detail__highlights'])) {
            $highlights = is_array($acf['destination_detail__highlights']) ? 
                          $acf['destination_detail__highlights'] : [];
        }
        
        if (isset($acf['destination_detail__best_time'])) {
            $best_time_to_visit = $acf['destination_detail__best_time'];
        }
        
        if (isset($acf['destination_detail__climate'])) {
            $climate = $acf['destination_detail__climate'];
        }
        
        if (isset($acf['destination_detail__banner_image']['url'])) {
            $featured_image = $acf['destination_detail__banner_image']['url'];
        }
    }
    
    // Regions - this might need adjustment based on the actual data structure
    if (isset($location['regions'])) {
        $regions = $location['regions'];
    }
    
    return [
        'id' => $id,
        'name' => $name,
        'description' => $description,
        'regions' => json_encode($regions),
        'highlights' => json_encode($highlights),
        'best_time_to_visit' => $best_time_to_visit,
        'climate' => $climate,
        'featured_image' => $featured_image
    ];
}

// Function to insert yacht into database
function insert_yacht($conn, $yacht) {
    $sql = "INSERT INTO wp_charterhub_yachts 
           (id, name, description, length, capacity, crew, base_price, featured_image, created_at, updated_at) 
           VALUES (:id, :name, :description, :length, :capacity, :crew, :base_price, :featured_image, NOW(), NOW())
           ON DUPLICATE KEY UPDATE 
           name = VALUES(name),
           description = VALUES(description),
           length = VALUES(length),
           capacity = VALUES(capacity),
           crew = VALUES(crew),
           base_price = VALUES(base_price),
           featured_image = VALUES(featured_image),
           updated_at = NOW()";
    
    try {
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            echo "Error preparing statement\n";
            return false;
        }
        
        $stmt->bindParam(':id', $yacht['id'], PDO::PARAM_INT);
        $stmt->bindParam(':name', $yacht['name'], PDO::PARAM_STR);
        $stmt->bindParam(':description', $yacht['description'], PDO::PARAM_STR);
        $stmt->bindParam(':length', $yacht['length'], PDO::PARAM_STR);
        $stmt->bindParam(':capacity', $yacht['capacity'], PDO::PARAM_INT);
        $stmt->bindParam(':crew', $yacht['crew'], PDO::PARAM_INT);
        $stmt->bindParam(':base_price', $yacht['base_price'], PDO::PARAM_STR);
        $stmt->bindParam(':featured_image', $yacht['featured_image'], PDO::PARAM_STR);
        
        $result = $stmt->execute();
        
        if (!$result) {
            echo "Error inserting yacht: " . implode(' ', $stmt->errorInfo()) . "\n";
        } else {
            echo "Inserted/updated yacht: {$yacht['name']} (ID: {$yacht['id']})\n";
        }
        
        return $result;
    } catch (PDOException $e) {
        echo "PDO Error inserting yacht: " . $e->getMessage() . "\n";
        return false;
    }
}

// Function to insert destination into database
function insert_destination($conn, $destination) {
    $sql = "INSERT INTO wp_charterhub_destinations 
           (id, name, description, regions, highlights, best_time_to_visit, climate, featured_image, created_at, updated_at) 
           VALUES (:id, :name, :description, :regions, :highlights, :best_time, :climate, :featured_image, NOW(), NOW())
           ON DUPLICATE KEY UPDATE 
           name = VALUES(name),
           description = VALUES(description),
           regions = VALUES(regions),
           highlights = VALUES(highlights),
           best_time_to_visit = VALUES(best_time_to_visit),
           climate = VALUES(climate),
           featured_image = VALUES(featured_image),
           updated_at = NOW()";
    
    try {
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            echo "Error preparing statement\n";
            return false;
        }
        
        $stmt->bindParam(':id', $destination['id'], PDO::PARAM_INT);
        $stmt->bindParam(':name', $destination['name'], PDO::PARAM_STR);
        $stmt->bindParam(':description', $destination['description'], PDO::PARAM_STR);
        $stmt->bindParam(':regions', $destination['regions'], PDO::PARAM_STR);
        $stmt->bindParam(':highlights', $destination['highlights'], PDO::PARAM_STR);
        $stmt->bindParam(':best_time', $destination['best_time_to_visit'], PDO::PARAM_STR);
        $stmt->bindParam(':climate', $destination['climate'], PDO::PARAM_STR);
        $stmt->bindParam(':featured_image', $destination['featured_image'], PDO::PARAM_STR);
        
        $result = $stmt->execute();
        
        if (!$result) {
            echo "Error inserting destination: " . implode(' ', $stmt->errorInfo()) . "\n";
        } else {
            echo "Inserted/updated destination: {$destination['name']} (ID: {$destination['id']})\n";
        }
        
        return $result;
    } catch (PDOException $e) {
        echo "PDO Error inserting destination: " . $e->getMessage() . "\n";
        return false;
    }
}

// Main process
try {
    echo "Starting import process...\n";
    
    // Get database connection
    $conn = get_database_connection();
    
    // Fetch yacht data
    echo "\n=== IMPORTING YACHTS ===\n";
    $yachts = fetch_api_data(YACHT_API_URL);
    $yacht_count = 0;
    
    foreach ($yachts as $yacht_data) {
        if ($yacht_count >= MAX_ITEMS) break;
        
        $yacht = process_yacht_data($yacht_data);
        if (insert_yacht($conn, $yacht)) {
            $yacht_count++;
        }
    }
    
    echo "Imported $yacht_count yachts successfully.\n";
    
    // Fetch destination data
    echo "\n=== IMPORTING DESTINATIONS ===\n";
    $destinations = fetch_api_data(LOCATION_API_URL);
    $destination_count = 0;
    
    foreach ($destinations as $location_data) {
        if ($destination_count >= MAX_ITEMS) break;
        
        $destination = process_destination_data($location_data);
        if (insert_destination($conn, $destination)) {
            $destination_count++;
        }
    }
    
    echo "Imported $destination_count destinations successfully.\n";
    
    // Close connection (PDO doesn't need an explicit close)
    $conn = null;
    
    echo "\n=== IMPORT COMPLETE ===\n";
    echo "Successfully imported data from WordPress API\n";
    echo "IMPORTANT: Please remove this script after use!\n";
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
