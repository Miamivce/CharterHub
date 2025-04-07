Database Backups - 2025-03-05_08-17-41

This directory contains database backups created before the migration process.

WordPress Database:
- Backup file: wordpress_backup.sql
- Schema documentation: wordpress_schema.json

Auth Database:
- Backup file: auth_backup.sql
- Schema documentation: auth_schema.json

To restore these backups:
1. Create a new database (if needed)
2. Import the SQL file using:
   mysql -h hostname -u username -p database_name < backup_file.sql

Note: These backups were created as a safety measure before consolidating
the databases into a single WordPress database.