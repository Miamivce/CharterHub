# Environment and Database Structure Standardization Plan

## 1. Environment Standardization

### 1.1 Server Configuration

#### Current Issues:
- Multiple PHP server instances running simultaneously
- Server started from inconsistent directories
- 404 errors for files that should exist

#### Standardization Steps:
1. **Create a standardized server startup script**
   ```bash
   #!/bin/bash
   # server-start.sh
   
   # Kill any existing PHP servers
   pkill -f "php -S localhost:8000" || true
   
   # Change to the correct directory
   cd "$(dirname "$0")/backend"
   
   # Start the server
   php -S localhost:8000
   ```

2. **Create a standardized development environment setup script**
   ```bash
   #!/bin/bash
   # setup-dev-environment.sh
   
   # Start backend server
   ./server-start.sh &
   
   # Start frontend development server
   cd frontend
   npm run dev
   ```

3. **Document the correct directory structure**
   ```
   CharterHub/
   ├── backend/
   │   ├── auth/
   │   │   ├── csrf-token.php
   │   │   ├── login.php
   │   │   ├── refresh-token.php
   │   │   └── ...
   │   ├── customers/
   │   │   └── list.php
   │   └── ...
   ├── frontend/
   │   ├── src/
   │   │   ├── contexts/
   │   │   │   └── auth/
   │   │   │       └── AuthContext.tsx
   │   │   ├── services/
   │   │   │   └── wpApi.ts
   │   │   └── ...
   │   └── ...
   └── ...
   ```

### 1.2 Frontend Configuration

#### Current Issues:
- Missing npm scripts
- Inconsistent port usage

#### Standardization Steps:
1. **Standardize package.json scripts**
   ```json
   {
     "scripts": {
       "dev": "vite",
       "start": "vite",
       "build": "vite build",
       "preview": "vite preview"
     }
   }
   ```

2. **Create a .env file template**
   ```
   # Frontend environment variables
   VITE_API_URL=http://localhost:8000
   VITE_DEVELOPMENT_MODE=true
   ```

## 2. Database Structure Standardization

### 2.1 Database Schema

#### Current Issues:
- Missing `wp_charterhub_users` table in some environments
- Inconsistent column references

#### Standardization Steps:
1. **Create a database initialization script**
   ```php
   <?php
   // init-database.php
   
   require_once __DIR__ . '/auth/config.php';
   
   function initialize_database() {
       $pdo = get_db_connection();
       
       // Create wp_charterhub_users table if it doesn't exist
       $pdo->exec("
           CREATE TABLE IF NOT EXISTS {$GLOBALS['db_config']['table_prefix']}charterhub_users (
               id INT AUTO_INCREMENT PRIMARY KEY,
               wp_user_id INT NOT NULL,
               role VARCHAR(50) NOT NULL,
               refresh_token VARCHAR(255),
               token_expires DATETIME,
               created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
               updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
               FOREIGN KEY (wp_user_id) REFERENCES {$GLOBALS['db_config']['table_prefix']}users(ID) ON DELETE CASCADE
           )
       ");
       
       echo "Database initialized successfully.\n";
   }
   
   initialize_database();
   ```

2. **Create a database verification script**
   ```php
   <?php
   // verify-database.php
   
   require_once __DIR__ . '/auth/config.php';
   
   function verify_database_structure() {
       $pdo = get_db_connection();
       $issues = [];
       
       // Check if wp_charterhub_users table exists
       $stmt = $pdo->query("SHOW TABLES LIKE '{$GLOBALS['db_config']['table_prefix']}charterhub_users'");
       if ($stmt->rowCount() === 0) {
           $issues[] = "Table {$GLOBALS['db_config']['table_prefix']}charterhub_users does not exist";
       }
       
       // Check if wp_charterhub_users has the correct columns
       if (empty($issues)) {
           $stmt = $pdo->query("DESCRIBE {$GLOBALS['db_config']['table_prefix']}charterhub_users");
           $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
           
           $required_columns = ['id', 'wp_user_id', 'role', 'refresh_token', 'token_expires', 'created_at', 'updated_at'];
           foreach ($required_columns as $column) {
               if (!in_array($column, $columns)) {
                   $issues[] = "Column {$column} is missing from {$GLOBALS['db_config']['table_prefix']}charterhub_users";
               }
           }
       }
       
       if (empty($issues)) {
           echo "Database structure is valid.\n";
           return true;
       } else {
           echo "Database structure issues found:\n";
           foreach ($issues as $issue) {
               echo "- {$issue}\n";
           }
           return false;
       }
   }
   
   verify_database_structure();
   ```

3. **Create a data migration script for refresh tokens**
   ```php
   <?php
   // migrate-refresh-tokens.php
   
   require_once __DIR__ . '/auth/config.php';
   
   function migrate_refresh_tokens() {
       $pdo = get_db_connection();
       
       // Check if both tables exist
       $stmt = $pdo->query("SHOW TABLES LIKE '{$GLOBALS['db_config']['table_prefix']}users'");
       $users_exists = $stmt->rowCount() > 0;
       
       $stmt = $pdo->query("SHOW TABLES LIKE '{$GLOBALS['db_config']['table_prefix']}charterhub_users'");
       $charterhub_users_exists = $stmt->rowCount() > 0;
       
       if (!$users_exists || !$charterhub_users_exists) {
           echo "Required tables do not exist.\n";
           return false;
       }
       
       // Find users with refresh tokens in wp_users but not in wp_charterhub_users
       $stmt = $pdo->query("
           SELECT u.ID, u.user_login, u.user_email, m.meta_value as capabilities
           FROM {$GLOBALS['db_config']['table_prefix']}users u
           LEFT JOIN {$GLOBALS['db_config']['table_prefix']}usermeta m ON u.ID = m.user_id AND m.meta_key = '{$GLOBALS['db_config']['table_prefix']}capabilities'
           LEFT JOIN {$GLOBALS['db_config']['table_prefix']}charterhub_users chu ON u.ID = chu.wp_user_id
           WHERE chu.id IS NULL
       ");
       
       $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
       
       if (empty($users)) {
           echo "No users need migration.\n";
           return true;
       }
       
       echo "Found " . count($users) . " users that need to be migrated.\n";
       
       foreach ($users as $user) {
           $capabilities = unserialize($user['capabilities']);
           $role = 'subscriber'; // Default role
           
           if (is_array($capabilities)) {
               if (isset($capabilities['charter_client']) && $capabilities['charter_client']) {
                   $role = 'charter_client';
               } elseif (isset($capabilities['administrator']) && $capabilities['administrator']) {
                   $role = 'administrator';
               }
           }
           
           $stmt = $pdo->prepare("
               INSERT INTO {$GLOBALS['db_config']['table_prefix']}charterhub_users
               (wp_user_id, role, created_at, updated_at)
               VALUES (?, ?, NOW(), NOW())
           ");
           
           $stmt->execute([$user['ID'], $role]);
           
           echo "Migrated user {$user['user_login']} (ID: {$user['ID']}) with role {$role}.\n";
       }
       
       echo "Migration completed successfully.\n";
       return true;
   }
   
   migrate_refresh_tokens();
   ```

### 2.2 Application Configuration

#### Current Issues:
- Inconsistent database references in code
- Missing error handling for database structure issues

#### Standardization Steps:
1. **Create a centralized database configuration file**
   ```php
   <?php
   // db-config.php
   
   // Database configuration
   $db_config = [
       'host' => 'localhost',
       'dbname' => 'charterhub_local',
       'username' => 'root',
       'password' => '',
       'table_prefix' => 'wp_'
   ];
   
   // Override with environment-specific configuration if needed
   if (file_exists(__DIR__ . '/db-config.local.php')) {
       include_once __DIR__ . '/db-config.local.php';
   }
   ```

2. **Add database structure verification to application bootstrap**
   ```php
   <?php
   // bootstrap.php
   
   require_once __DIR__ . '/auth/config.php';
   
   function verify_application_requirements() {
       $pdo = get_db_connection();
       
       // Check if required tables exist
       $required_tables = [
           "{$GLOBALS['db_config']['table_prefix']}users",
           "{$GLOBALS['db_config']['table_prefix']}usermeta",
           "{$GLOBALS['db_config']['table_prefix']}charterhub_users"
       ];
       
       $missing_tables = [];
       
       foreach ($required_tables as $table) {
           $stmt = $pdo->query("SHOW TABLES LIKE '{$table}'");
           if ($stmt->rowCount() === 0) {
               $missing_tables[] = $table;
           }
       }
       
       if (!empty($missing_tables)) {
           error_log("Missing required tables: " . implode(", ", $missing_tables));
           return false;
       }
       
       return true;
   }
   
   // Verify application requirements on bootstrap
   if (!verify_application_requirements()) {
       header('Content-Type: application/json');
       echo json_encode([
           'success' => false,
           'error' => 'Application database structure is incomplete. Please run the initialization script.'
       ]);
       exit;
   }
   ```

## 3. Implementation Plan

### 3.1 Preparation Phase
1. Back up the current database
2. Document the current environment configuration
3. Create a test environment to validate the standardization scripts

### 3.2 Implementation Phase
1. Stop all running services
2. Run the database initialization script
3. Run the database verification script
4. Run the data migration script
5. Update application configuration files
6. Start services using the standardized scripts

### 3.3 Validation Phase
1. Verify all endpoints are accessible
2. Test authentication flow
3. Verify refresh token functionality
4. Test client dashboard page refresh

### 3.4 Documentation Phase
1. Update README with environment setup instructions
2. Document database schema
3. Create troubleshooting guide for common issues

## 4. Maintenance Plan

### 4.1 Regular Verification
1. Schedule weekly database structure verification
2. Implement automated tests for critical functionality

### 4.2 Change Management
1. Require database migration scripts for any schema changes
2. Implement version control for database schema
3. Document all changes to environment configuration

## 5. Conclusion

This standardization plan addresses the root causes of the environment and database structure inconsistencies. By implementing these steps, we can ensure that:

1. The PHP server is always started from the correct directory
2. The database structure is consistent across all environments
3. The application code correctly references the database tables
4. Error handling is improved to detect and report structure issues

Following this plan will prevent the issues that are currently causing clients to be logged out when refreshing the dashboard. 