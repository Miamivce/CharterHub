<?php
/**
 * DIRECT TABLE FIX
 * 
 * This code directly fixes the table name issue by creating a view
 */

// Main code - paste this directly
$pdo = new PDO('mysql:host=' . $_ENV['DB_HOST'] . ';dbname=' . $_ENV['DB_NAME'], $_ENV['DB_USER'], $_ENV['DB_PASSWORD']);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "Connected to database successfully\n";

// Create a view to handle both table names
$pdo->exec("CREATE OR REPLACE VIEW charterhub_users AS SELECT * FROM wp_charterhub_users");
echo "Created view 'charterhub_users' pointing to 'wp_charterhub_users'\n";

echo "Success! The view has been created.";
?> 