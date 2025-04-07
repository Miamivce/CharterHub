# CharterHub Troubleshooting Guide

This guide provides solutions for common issues encountered when working with the CharterHub application.

## Server Issues

### PHP Server Won't Start

**Symptom**: When running `php -S localhost:8000`, you see an error like "Failed to listen on localhost:8000 (reason: Address already in use)".

**Solution**:
1. Kill the existing PHP server process:
   ```bash
   pkill -f "php -S localhost:8000"
   ```
2. If that doesn't work, find the process using the port and kill it:
   ```bash
   lsof -i :8000
   kill -9 <PID>
   ```
3. Use the standardized server startup script:
   ```bash
   ./server-start.sh
   ```

### 404 Errors for Backend Files

**Symptom**: You see 404 errors for files like `/auth/csrf-token.php` or `/customers/list.php`.

**Solution**:
1. Ensure you're starting the PHP server from the correct directory:
   ```bash
   cd backend
   php -S localhost:8000
   ```
2. Check if the files exist in the correct location:
   ```bash
   ls -la auth/csrf-token.php
   ls -la customers/list.php
   ```
3. Use the standardized server startup script:
   ```bash
   ./server-start.sh
   ```

## Database Issues

### Missing Tables

**Symptom**: You see errors like "Table 'charterhub_local.wp_charterhub_users' doesn't exist".

**Solution**:
1. Run the database initialization script:
   ```bash
   cd backend
   php init-database.php
   ```
2. Verify the database structure:
   ```bash
   php verify-database.php
   ```
3. Check your database connection settings in `backend/.env`.

### Database Connection Errors

**Symptom**: You see errors like "SQLSTATE[HY000] [1045] Access denied for user".

**Solution**:
1. Check your database credentials in `backend/.env`.
2. Ensure the MySQL server is running.
3. Verify that the database exists:
   ```bash
   mysql -u root -p -e "SHOW DATABASES LIKE 'charterhub_local'"
   ```
4. Create the database if it doesn't exist:
   ```bash
   mysql -u root -p -e "CREATE DATABASE charterhub_local"
   ```

## Authentication Issues

### Users Being Logged Out on Page Refresh

**Symptom**: Users are logged out when refreshing the client dashboard.

**Solution**:
1. Check if the `wp_charterhub_users` table exists and has the correct structure:
   ```bash
   cd backend
   php verify-database.php
   ```
2. Ensure refresh tokens are being stored correctly:
   ```bash
   mysql -u root -p -e "SELECT id, wp_user_id, role, refresh_token IS NOT NULL AS has_token FROM charterhub_local.wp_charterhub_users"
   ```
3. Check for CORS issues in the browser console.
4. Verify that the refresh token endpoint is working correctly:
   ```bash
   curl -i -X OPTIONS -H "Origin: http://localhost:3000" http://localhost:8000/auth/refresh-token.php
   ```

### CSRF Token Issues

**Symptom**: You see errors related to CSRF tokens or 401 Unauthorized responses.

**Solution**:
1. Ensure the CSRF token endpoint is accessible:
   ```bash
   curl -i http://localhost:8000/auth/csrf-token.php
   ```
2. Check that the frontend is correctly sending the CSRF token in requests.
3. Verify that the CSRF token is being stored in the browser's session storage.

## Frontend Issues

### Missing npm Scripts

**Symptom**: When running `npm start`, you see an error like "Missing script: start".

**Solution**:
1. Check the `package.json` file in the frontend directory:
   ```bash
   cat frontend/package.json
   ```
2. Add the missing script:
   ```bash
   cd frontend
   npm pkg set scripts.start="vite"
   ```
3. Use the correct script:
   ```bash
   npm run dev
   ```

### Port Already in Use

**Symptom**: When starting the frontend server, you see an error like "Port 3000 is in use".

**Solution**:
1. Let Vite choose another port automatically (it will try 3001, 3002, etc.).
2. Find and kill the process using port 3000:
   ```bash
   lsof -i :3000
   kill -9 <PID>
   ```
3. Specify a different port:
   ```bash
   npm run dev -- --port 3005
   ```

## Environment Issues

### Inconsistent Environment

**Symptom**: The application works differently on different machines or after restarting.

**Solution**:
1. Ensure all developers are using the same environment variables:
   ```bash
   cp backend/.env.template backend/.env
   cp frontend/.env.template frontend/.env
   ```
2. Use the standardized scripts to start the development environment:
   ```bash
   ./setup-dev-environment.sh
   ```
3. Verify the database structure:
   ```bash
   cd backend
   php verify-database.php
   ```

## Getting Additional Help

If you're still experiencing issues after trying these solutions, please:

1. Check the application logs:
   - PHP error log
   - Browser console
   - MySQL error log
2. Run the verification scripts to check for issues:
   ```bash
   cd backend
   php verify-database.php
   ```
3. Contact the development team with detailed information about the issue, including:
   - Error messages
   - Steps to reproduce
   - Environment details (OS, PHP version, MySQL version, etc.) 