<?php
/**
 * Extract CharterHub Tables for Aiven MySQL Import
 * 
 * This script extracts only the CharterHub-specific tables from the SQL dump
 * and adds PRIMARY KEY constraints to them for Aiven MySQL compatibility.
 */

// Configuration
$inputFile = 'charterhub_local.sql';
$outputFile = 'charterhub_tables_only.sql';
$tablePrefix = 'wp_charterhub_';

echo "=== Extracting CharterHub Tables for Aiven MySQL Import ===\n";
echo "Input file: $inputFile\n";
echo "Output file: $outputFile\n";
echo "Table prefix: $tablePrefix\n\n";

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

// Start with SQL header
$outputSql = "-- CharterHub Tables Export for Aiven MySQL\n";
$outputSql .= "-- Generated on " . date('Y-m-d H:i:s') . "\n\n";
$outputSql .= "SET SQL_MODE = \"NO_AUTO_VALUE_ON_ZERO\";\n";
$outputSql .= "START TRANSACTION;\n";
$outputSql .= "SET time_zone = \"+00:00\";\n\n";

// Extract CREATE TABLE statements for CharterHub tables
$charterhubTables = [];
preg_match_all('/CREATE TABLE `(' . preg_quote($tablePrefix) . '[^`]+)`\s*\((.*?)\)\s*ENGINE.*?;/s', $sqlContent, $createTableMatches, PREG_SET_ORDER);

// Extract all PRIMARY KEY constraints
preg_match_all('/ALTER TABLE `(' . preg_quote($tablePrefix) . '[^`]+)`.*?ADD PRIMARY KEY \(`([^`]+)`\)/s', $sqlContent, $primaryKeyMatches, PREG_SET_ORDER);

// Build a mapping of table name to primary key column
$primaryKeys = [];
foreach ($primaryKeyMatches as $match) {
    $tableName = $match[1];
    $primaryKeyColumn = $match[2];
    $primaryKeys[$tableName] = $primaryKeyColumn;
}

echo "Found " . count($createTableMatches) . " CharterHub tables\n";
echo "Found " . count($primaryKeys) . " PRIMARY KEY constraints for CharterHub tables\n\n";

// Process each CREATE TABLE statement
foreach ($createTableMatches as $tableMatch) {
    $tableName = $tableMatch[1];
    $tableDefinition = $tableMatch[2];
    $originalCreateTable = $tableMatch[0];
    
    echo "Processing table: $tableName\n";
    $charterhubTables[] = $tableName;
    
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
                // Still add the original CREATE TABLE statement to output
                $outputSql .= $originalCreateTable . "\n\n";
                continue;
            }
            
            // Create a new column definition with PRIMARY KEY
            $newColumnDefinition = $columnDefinition . " PRIMARY KEY";
            
            // Replace the column definition in the table definition
            $newTableDefinition = str_replace($columnDefinition, $newColumnDefinition, $tableDefinition);
            
            // Create the complete new CREATE TABLE statement
            $enginePos = strpos($originalCreateTable, ') ENGINE');
            if ($enginePos !== false) {
                $beforeEngine = substr($originalCreateTable, 0, $enginePos);
                $afterEngine = substr($originalCreateTable, $enginePos);
                $newCreateTable = $beforeEngine . $newTableDefinition . $afterEngine;
                $outputSql .= $newCreateTable . "\n\n";
            } else {
                // Fallback if ENGINE keyword not found
                $newCreateTable = "CREATE TABLE `$tableName` (\n$newTableDefinition\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n";
                $outputSql .= $newCreateTable;
            }
            
            echo "  Added PRIMARY KEY to column definition\n";
        } else {
            echo "  Warning: PRIMARY KEY column not found in CREATE TABLE statement\n";
            
            // Still add the original CREATE TABLE statement with modification
            // Add id column as first column with PRIMARY KEY
            $newTableDefinition = "  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,\n" . $tableDefinition;
            $newCreateTable = "CREATE TABLE `$tableName` (\n$newTableDefinition\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n";
            $outputSql .= $newCreateTable;
        }
    } else {
        // If no primary key is defined, add an ID column as primary key
        echo "  No PRIMARY KEY found, adding id column\n";
        
        // Add id column as first column with PRIMARY KEY
        $newTableDefinition = "  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,\n" . $tableDefinition;
        $newCreateTable = "CREATE TABLE `$tableName` (\n$newTableDefinition\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n";
        $outputSql .= $newCreateTable;
    }
}

// Extract INSERT statements for CharterHub tables
echo "\nExtracting INSERT statements for CharterHub tables...\n";
foreach ($charterhubTables as $tableName) {
    echo "  Extracting data for table: $tableName\n";
    preg_match_all('/INSERT INTO `' . preg_quote($tableName) . '`.*?;/s', $sqlContent, $insertMatches);
    
    if (!empty($insertMatches[0])) {
        $outputSql .= "-- Data for table `$tableName`\n";
        foreach ($insertMatches[0] as $insertStatement) {
            $outputSql .= $insertStatement . "\n";
        }
        $outputSql .= "\n";
    }
}

// Complete the SQL file
$outputSql .= "COMMIT;\n";

// Write the output SQL to file
echo "\nWriting output SQL to file...\n";
if (file_put_contents($outputFile, $outputSql) === false) {
    die("Error: Failed to write to output file!\n");
}

echo "Done! CharterHub tables extracted to $outputFile\n";
echo "\nNext step: Import the CharterHub tables to Aiven MySQL\n";
echo "mysql --host=mysql-charterhub-charterhub.c.aivencloud.com --port=19174 --user=avnadmin --password=AVNS_HCZbm5bZJE1L9C8Pz8C --ssl-mode=REQUIRED defaultdb < $outputFile\n"; 