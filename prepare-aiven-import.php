<?php
/**
 * Prepare SQL file for Aiven MySQL import
 * 
 * This script processes a SQL dump file from phpMyAdmin and modifies it to add
 * PRIMARY KEY constraints directly in the CREATE TABLE statements to meet
 * Aiven MySQL's requirement that all tables must have a primary key.
 */

// Configuration
$inputFile = 'charterhub_local.sql';
$outputFile = 'charterhub_aiven.sql';

echo "=== Preparing SQL file for Aiven MySQL import ===\n";
echo "Input file: $inputFile\n";
echo "Output file: $outputFile\n\n";

// Check if input file exists
if (!file_exists($inputFile)) {
    die("Error: Input file $inputFile not found!\n");
}

// Read the input file
echo "Reading input file...\n";
$sqlContent = file_get_contents($inputFile);
if ($sqlContent === false) {
    die("Error: Could not read input file!\n");
}

echo "Parsing SQL file...\n";

// Extract all CREATE TABLE statements
preg_match_all('/CREATE TABLE `([^`]+)`\s*\((.*?)\)\s*ENGINE/s', $sqlContent, $createTableMatches, PREG_SET_ORDER);

// Extract all ALTER TABLE statements that add PRIMARY KEY constraints
preg_match_all('/ALTER TABLE `([^`]+)`.*?ADD PRIMARY KEY \(`([^`]+)`\)/s', $sqlContent, $primaryKeyMatches, PREG_SET_ORDER);

// Build a mapping of table name to primary key column
$primaryKeys = [];
foreach ($primaryKeyMatches as $match) {
    $tableName = $match[1];
    $primaryKeyColumn = $match[2];
    $primaryKeys[$tableName] = $primaryKeyColumn;
}

echo "Found " . count($createTableMatches) . " CREATE TABLE statements\n";
echo "Found " . count($primaryKeys) . " PRIMARY KEY constraints\n\n";

// Process each CREATE TABLE statement
$modifiedSql = $sqlContent;
foreach ($createTableMatches as $tableMatch) {
    $tableName = $tableMatch[1];
    $tableDefinition = $tableMatch[2];
    $originalCreateTable = $tableMatch[0];
    
    echo "Processing table: $tableName\n";
    
    // Check if table has a primary key defined
    if (isset($primaryKeys[$tableName])) {
        $primaryKeyColumn = $primaryKeys[$tableName];
        echo "  Found PRIMARY KEY for column: $primaryKeyColumn\n";
        
        // Check if this column is defined in the CREATE TABLE statement
        if (preg_match("/`$primaryKeyColumn`[^,]*/", $tableDefinition, $columnMatch)) {
            $columnDefinition = $columnMatch[0];
            
            // Skip if it already has PRIMARY KEY
            if (strpos($columnDefinition, 'PRIMARY KEY') !== false) {
                echo "  Table already has PRIMARY KEY defined\n";
                continue;
            }
            
            // Add PRIMARY KEY to the column definition
            $newColumnDefinition = $columnDefinition . " PRIMARY KEY";
            $newTableDefinition = str_replace($columnDefinition, $newColumnDefinition, $tableDefinition);
            $newCreateTable = "CREATE TABLE `$tableName` ($newTableDefinition) ENGINE";
            
            // Replace in the SQL content
            $modifiedSql = str_replace($originalCreateTable, $newCreateTable, $modifiedSql);
            
            echo "  Added PRIMARY KEY to column definition\n";
        } else {
            echo "  Warning: PRIMARY KEY column not found in CREATE TABLE statement\n";
        }
    } else {
        // If no primary key is defined, add an ID column as primary key
        echo "  No PRIMARY KEY found, adding id column\n";
        
        // Add id column as first column
        $newTableDefinition = "  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,\n" . $tableDefinition;
        $newCreateTable = "CREATE TABLE `$tableName` ($newTableDefinition) ENGINE";
        
        // Replace in the SQL content
        $modifiedSql = str_replace($originalCreateTable, $newCreateTable, $modifiedSql);
    }
}

// Write the modified SQL to the output file
echo "\nWriting modified SQL to output file...\n";
if (file_put_contents($outputFile, $modifiedSql) === false) {
    die("Error: Could not write to output file!\n");
}

echo "Done! Modified SQL file saved as $outputFile\n";
echo "\nNext step: Import the modified SQL file to Aiven MySQL\n";
echo "mysql --host=mysql-charterhub-charterhub.c.aivencloud.com --port=19174 --user=avnadmin --password=AVNS_HCZbm5bZJE1L9C8Pz8C --ssl-mode=REQUIRED defaultdb < $outputFile\n"; 