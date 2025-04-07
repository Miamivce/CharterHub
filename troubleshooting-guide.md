# CharterHub Troubleshooting Guide

This guide addresses common issues you might encounter when setting up and running the CharterHub development environment.

## Server Startup Issues

### 404 Errors for API Endpoints

**Problem**: You're getting 404 errors when trying to access endpoints like `/auth/csrf-token.php` or `/customers/list.php`.

**Solution**: This is almost always because the PHP server was started from the wrong directory. The PHP server must use the `backend` directory as its document root.

1. Stop any running PHP servers:
   ```bash
   pkill -f "php -S localhost:8000"
   ```

2. Start the server correctly using one of these methods:
   ```bash
   # Method 1: Change to backend directory first
   cd backend && php -S localhost:8000
   
   # Method 2: Use the -t flag to specify document root
   php -S localhost:8000 -t backend
   
   # Method 3 (recommended): Use the provided script
   ./server-start.sh
   ```

### Port Already in Use

**Problem**: You see an error like "Failed to listen on localhost:8000 (reason: Address already in use)".

**Solution**: Another process is already using the port. You need to stop that process first.

1. Find the process using the port:
   ```bash
   lsof -i :8000
   ```

2. Kill the process:
   ```bash
   pkill -f "php -S localhost:8000"
   ```

3. If that doesn't work, find the process ID (PID) and kill it directly:
   ```bash
   lsof -i :8000
   kill -9 <PID>
   ```

### Frontend Server Issues

**Problem**: You see "Missing script: start" when trying to start the frontend.

**Solution**: The frontend uses the "dev" script, not "start".

```bash
cd frontend && npm run dev
```

If that doesn't work, check your `package.json` to ensure it has the correct scripts defined:

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview"
}
```

## Database Issues

### Table Not Found Errors

**Problem**: You see errors like "Table 'charterhub_local.wp_charterhub_users' doesn't exist".

**Solution**: The database tables haven't been properly initialized.

1. Run the database initialization script:
   ```bash
   cd backend && php init-database.php
   ```

2. Verify the database structure:
   ```bash
   cd backend && php verify-database.php
   ```

### Authentication Failures

**Problem**: You're getting authentication errors or 401 Unauthorized responses.

**Solution**: This could be due to missing or invalid refresh tokens.

1. Run the migration script to ensure user data is properly set up:
   ```bash
   cd backend && php migrate-refresh-tokens.php
   ```

2. Check that your `.env` files have the correct authentication settings.

## Environment Configuration Issues

### Missing Environment Variables

**Problem**: The application can't find required environment variables.

**Solution**: Ensure your `.env` files are properly set up.

1. Check if `.env` files exist in both backend and frontend directories:
   ```bash
   ls -la backend/.env
   ls -la frontend/.env
   ```

2. If they don't exist, copy from the templates:
   ```bash
   cp backend/.env.template backend/.env
   cp frontend/.env.template frontend/.env
   ```

3. Edit the `.env` files to include the correct values for your environment.

## Script Execution Issues

### Permission Denied

**Problem**: You see "Permission denied" when trying to run scripts.

**Solution**: Make the scripts executable.

```bash
chmod +x server-start.sh setup-dev-environment.sh
```

### Script Not Found

**Problem**: You see "No such file or directory" when trying to run scripts.

**Solution**: Make sure you're in the project root directory.

```bash
cd /path/to/CharterHub
```

## General Troubleshooting Steps

If you encounter issues not covered above, try these general troubleshooting steps:

1. **Restart Everything**: Kill all server processes and start fresh.
   ```bash
   pkill -f "php -S localhost:8000"
   pkill -f "node.*vite"
   ./setup-dev-environment.sh
   ```

2. **Check Logs**: Look for error messages in the terminal output or log files.

3. **Verify Directory Structure**: Make sure your project follows the expected directory structure as documented in `directory-structure.md`.

4. **Update Dependencies**: Make sure your dependencies are up to date.
   ```bash
   cd frontend && npm install
   ```

5. **Clear Browser Cache**: Sometimes browser caching can cause issues. Try clearing your browser cache or using incognito mode.

If you've tried all these steps and are still having issues, please contact the development team for assistance. 