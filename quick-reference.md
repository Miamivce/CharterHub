# CharterHub Quick Reference Guide

This document provides a quick reference for the most common commands and operations in the CharterHub development environment.

## Server Management

### Starting Servers

```bash
# Start both backend and frontend servers
./setup-dev-environment.sh

# Start only the backend server
./server-start.sh

# Start only the frontend server
cd frontend && npm run dev
```

### Stopping Servers

```bash
# Stop the backend server
pkill -f "php -S localhost:8000"

# Stop the frontend server
pkill -f "node.*vite"

# Stop all servers
pkill -f "php -S localhost:8000" && pkill -f "node.*vite"
```

### Testing Servers

```bash
# Test if the backend server is running correctly
./test-server.sh

# Check the server status in a browser
http://localhost:8000/server-status.php

# Check the CSRF token endpoint
curl http://localhost:8000/auth/csrf-token.php
```

## Environment Management

```bash
# Check if your environment is set up correctly
./check-environment.sh

# Fix common issues automatically
./fix-common-issues.sh

# Create environment files from templates
cp backend/.env.template backend/.env
cp frontend/.env.template frontend/.env
```

## Database Management

```bash
# Initialize the database
cd backend && php init-database.php

# Verify the database structure
cd backend && php verify-database.php

# Migrate user data
cd backend && php migrate-refresh-tokens.php
```

## Common Issues and Solutions

### 404 Errors for API Endpoints

This usually means the PHP server was started from the wrong directory. Always start the server using one of these methods:

```bash
# Method 1: Use the provided script
./server-start.sh

# Method 2: Start from the backend directory
cd backend && php -S localhost:8000

# Method 3: Use the -t flag to specify document root
php -S localhost:8000 -t backend
```

### Port Already in Use

```bash
# Check what's using port 8000
lsof -i :8000

# Kill the process using port 8000
pkill -f "php -S localhost:8000"
```

### Missing npm Scripts

If you encounter "Missing script" errors, run the fix-common-issues script:

```bash
./fix-common-issues.sh
```

## URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Server Status: http://localhost:8000/server-status.php
- CSRF Token: http://localhost:8000/auth/csrf-token.php
- Customers List: http://localhost:8000/customers/list.php

## Documentation

- [README.md](README.md): Main documentation
- [directory-structure.md](directory-structure.md): Directory structure overview
- [troubleshooting-guide.md](troubleshooting-guide.md): Detailed troubleshooting guide 