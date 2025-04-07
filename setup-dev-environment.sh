#!/bin/bash
# setup-dev-environment.sh
# Comprehensive script to set up the entire CharterHub development environment
# This script starts both the backend and frontend servers

# Function to find the project root directory
find_project_root() {
  local current_dir="$PWD"
  while [[ "$current_dir" != "/" ]]; do
    if [[ -f "$current_dir/.project-root" ]]; then
      echo "$current_dir"
      return 0
    fi
    current_dir="$(dirname "$current_dir")"
  done
  
  # If we get here, we couldn't find the project root
  echo "$PWD"
  return 1
}

# Function to kill existing server processes
kill_existing_servers() {
  echo "Checking for existing server processes..."
  
  # Kill PHP servers
  if pgrep -f "php -S localhost:8000" > /dev/null; then
    echo "Killing existing PHP server processes..."
    pkill -f "php -S localhost:8000" || true
    sleep 1
  else
    echo "No existing PHP server processes found."
  fi
  
  # Kill Node.js servers (frontend)
  if pgrep -f "node.*vite" > /dev/null; then
    echo "Killing existing Node.js/Vite server processes..."
    pkill -f "node.*vite" || true
    sleep 1
  else
    echo "No existing Node.js/Vite server processes found."
  fi
}

# Function to check if a port is in use
check_port() {
  local port=$1
  if lsof -i :"$port" > /dev/null; then
    echo "Warning: Port $port is already in use."
    return 1
  fi
  return 0
}

# Function to initialize the database
initialize_database() {
  echo "Initializing database..."
  cd "$PROJECT_ROOT/backend" || exit 1
  
  # Run database initialization script if it exists
  if [[ -f "init-database.php" ]]; then
    php init-database.php
  else
    echo "Warning: Database initialization script not found."
  fi
  
  # Run database verification script if it exists
  if [[ -f "verify-database.php" ]]; then
    echo "Verifying database structure..."
    php verify-database.php
  fi
  
  # Run user migration script if it exists
  if [[ -f "migrate-refresh-tokens.php" ]]; then
    echo "Migrating user data..."
    php migrate-refresh-tokens.php
  fi
}

# Find the project root
PROJECT_ROOT=$(find_project_root)
if [[ $? -ne 0 ]]; then
  echo "Warning: Could not find project root marker (.project-root)."
  echo "Creating .project-root file in current directory."
  echo "CharterHub Project Root" > "$PWD/.project-root"
  PROJECT_ROOT="$PWD"
fi

# Ensure the required directories exist
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

if [[ ! -d "$BACKEND_DIR" ]]; then
  echo "Error: Backend directory not found at $BACKEND_DIR"
  exit 1
fi

if [[ ! -d "$FRONTEND_DIR" ]]; then
  echo "Error: Frontend directory not found at $FRONTEND_DIR"
  exit 1
fi

# Kill any existing server processes
kill_existing_servers

# Check if required ports are available
check_port 8000 || echo "You may need to manually free port 8000 before the backend server can start."
check_port 3000 || echo "Frontend may use an alternative port (like 3001) if port 3000 is in use."

# Initialize the database
initialize_database

# Start the backend server in the background
echo "Starting backend server at http://localhost:8000"
cd "$BACKEND_DIR" || exit 1
php -S localhost:8000 > /tmp/charterhub-backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend server started with PID: $BACKEND_PID"

# Give the backend server a moment to start
sleep 2

# Check if backend server started successfully
if ! ps -p $BACKEND_PID > /dev/null; then
  echo "Error: Backend server failed to start. Check /tmp/charterhub-backend.log for details."
  exit 1
fi

# Start the frontend server
echo "Starting frontend server..."
cd "$FRONTEND_DIR" || exit 1

# Check if package.json exists
if [[ ! -f "package.json" ]]; then
  echo "Error: package.json not found in frontend directory."
  exit 1
fi

# Check which npm script to use (dev or start)
if grep -q '"dev"' package.json; then
  echo "Running 'npm run dev'..."
  npm run dev
elif grep -q '"start"' package.json; then
  echo "Running 'npm start'..."
  npm start
else
  echo "Error: Neither 'dev' nor 'start' script found in package.json."
  exit 1
fi

# Note: The script will stay here until the frontend server is stopped with Ctrl+C
# When the user stops the frontend server, we should also stop the backend server
echo "Stopping backend server (PID: $BACKEND_PID)..."
kill $BACKEND_PID 