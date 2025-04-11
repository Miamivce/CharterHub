# CharterHub Table Prefix Fix

## Problem Summary

The CharterHub application has a table naming inconsistency that causes database errors:

1. **Code Inconsistency**: Parts of the application code reference tables without the `wp_` prefix (e.g., `charterhub_users`), while other parts use the prefixed version (`wp_charterhub_users`).

2. **Database Schema**: The production database only contains tables with the `wp_` prefix, following WordPress conventions.

3. **Error Impact**: This causes login/registration failures with `Table 'defaultdb.charterhub_users' doesn't exist` errors.

## Solution: Database Views

The most efficient solution is to create database views that make both naming conventions work:

```sql
CREATE VIEW charterhub_users AS SELECT * FROM wp_charterhub_users;
```

This way, whether code references `charterhub_users` or `wp_charterhub_users`, it accesses the same data.

## Fix Scripts

Two scripts have been provided:

### 1. `table-prefix-fix.php` (Main Script)

This script integrates with the CharterHub codebase and:
- Uses the application's existing database connection
- Automatically detects all tables with the `wp_charterhub_` prefix
- Creates corresponding views without the prefix
- Records actions in a new `charterhub_config` table
- Provides detailed JSON output

### 2. `direct-prefix-fix.php` (Standalone Script)

A self-contained version that:
- Doesn't rely on any application code or dependencies
- Connects directly to the database using environment variables
- Can be run directly on the server without deploying through git
- Has minimal error handling
- Provides plain text output

## Deployment Instructions

### Option 1: Full Integration (Recommended)

1. Deploy both scripts through your normal git workflow
2. Run the main script by visiting: `https://charterhub-api.onrender.com/table-prefix-fix.php`
3. Check the JSON output to verify all views were created

### Option 2: Direct Fix (Emergency)

If you need to fix the issue immediately without a full deployment:

1. Copy the contents of `direct-prefix-fix.php`
2. Log into your Render dashboard
3. Create a temporary file on the server with this content
4. Run the file directly

## Long-term Solution

Beyond this immediate fix, the proper solution is to standardize how database tables are referenced:

1. **Code Standardization**: Update all SQL queries to consistently use `{$db_config['table_prefix']}charterhub_users` to make them database-agnostic.

2. **Add Tooling**: Implement a linting tool that detects direct table references without the prefix variable.

3. **Document Convention**: Clearly document the table naming convention in your development guidelines.

## Verification

After applying the fix, you can verify it's working by:

1. Checking login functionality
2. Running the diagnostic tool
3. Attempting registration
4. Querying the database to list all views:
   ```sql
   SELECT * FROM information_schema.views WHERE table_schema = DATABASE();
   ```

## Security Note

The database views provide a transparent route to the same data without modifying application code. They have no security implications as they don't change access controls - they simply provide an alternate name to access the same tables.

## Maintenance

The table prefix fix should be reapplied when:
- New tables are added to the schema
- After major database migrations
- When deploying to new environments

To automate this, consider adding the script to your deployment pipeline. 