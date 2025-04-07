#!/bin/bash

# Import script for CharterHub database to Aiven MySQL
# This script handles the import in steps to deal with the PRIMARY KEY requirement

# Database credentials
DB_HOST="mysql-charterhub-charterhub.c.aivencloud.com"
DB_PORT="19174"
DB_USER="avnadmin"
DB_PASS="AVNS_HCZbm5bZJE1L9C8Pz8C"
DB_NAME="defaultdb"

# Make the script more robust
set -e  # Exit on error
set -u  # Error on undefined variables

# File paths
SQL_FILE="charterhub_local.sql"
TEMP_DIR="temp_sql"

echo "=== CharterHub Database Import Tool ==="
echo "This script will import your database to Aiven MySQL."
echo "Host: $DB_HOST"
echo "Database: $DB_NAME"
echo ""

# Ensure MySQL client is installed
if ! command -v mysql &> /dev/null; then
    echo "MySQL client is not installed. Please install it first."
    echo "On macOS: brew install mysql-client"
    echo "On Ubuntu: sudo apt install mysql-client"
    exit 1
fi

# Create temporary directory
mkdir -p "$TEMP_DIR"

echo "Step 1: Creating database schema (structure only)"
# Extract CREATE TABLE statements and PRIMARY KEY constraints
grep -n "CREATE TABLE\|PRIMARY KEY\|ADD KEY\|ADD UNIQUE KEY\|CONSTRAINT" "$SQL_FILE" > "$TEMP_DIR/schema_lines.txt"

# Extract database creation commands
head -n 100 "$SQL_FILE" > "$TEMP_DIR/header.sql"

# First create the structure
echo "- Creating structure..."
mysql --host="$DB_HOST" --port="$DB_PORT" --user="$DB_USER" --password="$DB_PASS" --ssl-mode=REQUIRED "$DB_NAME" < "$TEMP_DIR/header.sql"

# Extract and run each CREATE TABLE statement with its PRIMARY KEY
echo "- Creating tables..."

# Common MySQL connection string for commands
MYSQL_CONN="mysql --host=$DB_HOST --port=$DB_PORT --user=$DB_USER --password=$DB_PASS --ssl-mode=REQUIRED $DB_NAME"

# Drop all tables if they exist
echo "- Dropping any existing tables..."
$MYSQL_CONN -e "SET FOREIGN_KEY_CHECKS=0;"
TABLES=$($MYSQL_CONN -e "SHOW TABLES;" | grep -v "Tables_in")
for table in $TABLES; do
    $MYSQL_CONN -e "DROP TABLE IF EXISTS \`$table\`;"
done
$MYSQL_CONN -e "SET FOREIGN_KEY_CHECKS=1;"

# Create the tables with PRIMARY KEY inline
echo "- Creating tables with proper PRIMARY KEYs..."

# Since this is a more complex operation than can be done in a simple script,
# let's get creative and just create the tables directly with SQL statements

# Create each table individually
for table in $(grep "CREATE TABLE" "$SQL_FILE" | sed -E "s/CREATE TABLE \`([^`]+)\`.*/\1/g"); do
    echo "  Creating table: $table"
    
    # Extract the CREATE TABLE statement
    sed -n "/CREATE TABLE \`$table\`/,/;/p" "$SQL_FILE" > "$TEMP_DIR/table_$table.sql"
    
    # Find if there's a primary key for this table later in the file
    primary_key=$(grep -A 5 "ALTER TABLE \`$table\`" "$SQL_FILE" | grep "PRIMARY KEY" | head -n 1)
    
    if [ -n "$primary_key" ]; then
        # Extract the column name from the PRIMARY KEY statement
        pk_column=$(echo "$primary_key" | sed -E "s/.*PRIMARY KEY \(\`([^`]+)\`\).*/\1/g")
        
        if [ -n "$pk_column" ]; then
            echo "  Found PRIMARY KEY column: $pk_column"
            # Add PRIMARY KEY inline to the CREATE TABLE statement
            sed -i '' "s/\`$pk_column\`[^,]*/\`$pk_column\` \0 PRIMARY KEY/g" "$TEMP_DIR/table_$table.sql"
        fi
    fi
    
    # Run the CREATE TABLE statement
    $MYSQL_CONN < "$TEMP_DIR/table_$table.sql"
done

echo "Step 2: Importing data"
# Now insert the data - extract INSERT statements
echo "- Extracting INSERT statements..."
grep -n "INSERT INTO" "$SQL_FILE" > "$TEMP_DIR/insert_lines.txt"

# Split the file into chunks for easier processing
echo "- Splitting file into chunks..."
split -l 1000 "$SQL_FILE" "$TEMP_DIR/split_"

# Import each chunk
echo "- Importing data chunks..."
for chunk in "$TEMP_DIR"/split_*; do
    echo "  Importing chunk: $chunk"
    # Only process INSERT statements
    grep "INSERT INTO" "$chunk" > "$TEMP_DIR/inserts_only.sql" || true
    if [ -s "$TEMP_DIR/inserts_only.sql" ]; then
        $MYSQL_CONN < "$TEMP_DIR/inserts_only.sql" || echo "  Warning: Some inserts may have failed due to constraints"
    fi
done

echo "Step 3: Verifying import"
# Check if key tables exist
echo "- Checking for critical tables..."
$MYSQL_CONN -e "SHOW TABLES LIKE 'wp_charterhub_users';"
$MYSQL_CONN -e "SELECT COUNT(*) FROM wp_charterhub_users;"

echo "Step 4: Cleanup"
echo "- Removing temporary files..."
rm -rf "$TEMP_DIR"

echo ""
echo "Import completed! Check the output above for any errors."
echo "You should now have your CharterHub database imported into Aiven MySQL."
echo ""
echo "To connect to your database and verify:"
echo "mysql --host=$DB_HOST --port=$DB_PORT --user=$DB_USER --password=*** --ssl-mode=REQUIRED $DB_NAME" 