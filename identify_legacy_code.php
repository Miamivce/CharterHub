<?php
// Set the directory to search
$rootDir = __DIR__ . '/..';
$output = [];

// Search patterns
$patterns = [
    'charterhub_clients' => 'Old clients table references',
    'wp_users' => 'WordPress users table references',
    'usermeta' => 'WordPress usermeta table references',
    'wp_user_id' => 'Links to WordPress user IDs'
];

// Skip directories
$skipDirs = ['node_modules', 'vendor', '.git'];

// Function to recursively scan directories
function scanDirectory($dir, $patterns, &$output, $skipDirs) {
    $files = scandir($dir);
    
    foreach ($files as $file) {
        if ($file === '.' || $file === '..') {
            continue;
        }
        
        $path = $dir . '/' . $file;
        
        // Skip specified directories
        foreach ($skipDirs as $skipDir) {
            if (strpos($path, "/$skipDir/") !== false) {
                continue 2;
            }
        }
        
        if (is_dir($path)) {
            scanDirectory($path, $patterns, $output, $skipDirs);
        } else if (pathinfo($path, PATHINFO_EXTENSION) === 'php') {
            // Only check PHP files
            $content = file_get_contents($path);
            
            foreach ($patterns as $pattern => $description) {
                if (stripos($content, $pattern) !== false) {
                    // Count occurrences
                    $count = substr_count(strtolower($content), strtolower($pattern));
                    
                    if (!isset($output[$pattern])) {
                        $output[$pattern] = [];
                    }
                    
                    $relativePath = str_replace($rootDir . '/', '', $path);
                    $output[$pattern][] = [
                        'file' => $relativePath,
                        'count' => $count
                    ];
                }
            }
        }
    }
}

// Start scanning
echo "Scanning for legacy code references...\n";
scanDirectory($rootDir, $patterns, $output, $skipDirs);

// Output results
foreach ($patterns as $pattern => $description) {
    if (isset($output[$pattern]) && count($output[$pattern]) > 0) {
        echo "\n--- $description ($pattern) ---\n";
        echo "Found in " . count($output[$pattern]) . " files:\n";
        
        // Sort by count
        usort($output[$pattern], function($a, $b) {
            return $b['count'] - $a['count'];
        });
        
        foreach ($output[$pattern] as $item) {
            echo "  {$item['file']} ({$item['count']} occurrences)\n";
        }
    } else {
        echo "\n--- $description ($pattern) ---\n";
        echo "No references found.\n";
    }
}

echo "\nScan complete.\n"; 