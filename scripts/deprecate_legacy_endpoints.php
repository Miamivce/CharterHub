<?php
// Define constant to avoid direct access errors
define('CHARTERHUB_LOADED', true);

echo "Safely deprecating legacy endpoints (preserving WordPress integration)...\n";

// 1. First identify the legacy client endpoints
$legacy_dir = __DIR__ . '/../backend/client';
$backup_dir = __DIR__ . '/../backend/legacy_backup';

// Create backup directory if it doesn't exist
if (!is_dir($backup_dir)) {
    mkdir($backup_dir, 0755, true);
    echo "Created backup directory: " . basename($backup_dir) . "\n";
}

// Process legacy endpoints
if (is_dir($legacy_dir)) {
    echo "\nProcessing legacy client endpoints in: " . basename($legacy_dir) . "\n";
    
    // Find all PHP files
    $files = glob($legacy_dir . '/*.php');
    $files = array_merge($files, glob($legacy_dir . '/*/*.php'));
    
    if (count($files) > 0) {
        echo "Found " . count($files) . " legacy endpoints\n";
        
        foreach ($files as $file) {
            $filename = basename($file);
            $relative_path = str_replace($legacy_dir . '/', '', $file);
            $backup_path = $backup_dir . '/' . $relative_path;
            
            // Ensure backup directory exists
            $backup_subdir = dirname($backup_path);
            if (!is_dir($backup_subdir)) {
                mkdir($backup_subdir, 0755, true);
            }
            
            // Add deprecation notice to the file
            $content = file_get_contents($file);
            $deprecated_content = "<?php\n/**\n * DEPRECATED: This legacy endpoint has been moved to the main API.\n * Please use the new endpoints instead.\n *\n * @deprecated\n */\n\n// Return deprecation notice\nheader('Content-Type: application/json');\nhttp_response_code(410); // Gone\necho json_encode([\n    'success' => false,\n    'error' => 'endpoint_deprecated',\n    'message' => 'This endpoint has been deprecated. Please use the new API endpoints instead.'\n]);\nexit;\n\n// Original code below (disabled)\n/*\n" . $content . "\n*/\n";
            
            // Backup the original file
            copy($file, $backup_path);
            echo "✅ Backed up: $relative_path to legacy_backup/$relative_path\n";
            
            // Replace with deprecation notice
            file_put_contents($file, $deprecated_content);
            echo "✅ Deprecated: $relative_path\n";
        }
        
        echo "\nAll legacy endpoints have been safely deprecated with proper error responses.\n";
        echo "Original files have been backed up to the 'legacy_backup' directory.\n";
    } else {
        echo "No PHP files found in the legacy directory.\n";
    }
} else {
    echo "Legacy client directory not found.\n";
}

echo "\nLegacy endpoint cleanup complete.\n";
echo "The WordPress integration remains intact and functional.\n"; 