<?php
// Super basic test - no dependencies, no db connections
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Output buffer start - we'll capture all output
ob_start();

// Simple test output
echo "=== SUPER BASIC TEST ===\n";
echo "PHP is working if you can see this\n";
echo "Time: " . date('Y-m-d H:i:s') . "\n";
echo "PHP Version: " . phpversion() . "\n";

// Dump the output buffer to a log file in case display doesn't work
$output = ob_get_contents();
file_put_contents('debug-output.log', $output);

// End output buffer and send to browser
ob_end_flush();
?>