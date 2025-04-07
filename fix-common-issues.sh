#!/bin/bash

# fix-common-issues.sh
# Script to automatically fix common development environment issues

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

# Function to check and create environment files
check_and_create_env_files() {
  echo "Checking environment files..."
  
  # Backend .env
  if [[ ! -f "$PROJECT_ROOT/backend/.env" ]]; then
    if [[ -f "$PROJECT_ROOT/backend/.env.template" ]]; then
      echo "Creating backend/.env from template..."
      cp "$PROJECT_ROOT/backend/.env.template" "$PROJECT_ROOT/backend/.env"
      echo "✅ Created backend/.env"
    else
      echo "❌ backend/.env.template not found. Cannot create backend/.env"
    fi
  else
    echo "✅ backend/.env already exists"
  fi
  
  # Frontend .env
  if [[ ! -f "$PROJECT_ROOT/frontend/.env" ]]; then
    if [[ -f "$PROJECT_ROOT/frontend/.env.template" ]]; then
      echo "Creating frontend/.env from template..."
      cp "$PROJECT_ROOT/frontend/.env.template" "$PROJECT_ROOT/frontend/.env"
      echo "✅ Created frontend/.env"
    else
      echo "❌ frontend/.env.template not found. Cannot create frontend/.env"
    fi
  else
    echo "✅ frontend/.env already exists"
  fi
}

# Function to ensure scripts are executable
make_scripts_executable() {
  echo "Making scripts executable..."
  
  chmod +x "$PROJECT_ROOT/server-start.sh" "$PROJECT_ROOT/setup-dev-environment.sh" "$PROJECT_ROOT/check-environment.sh" "$PROJECT_ROOT/fix-common-issues.sh"
  echo "✅ Made scripts executable"
}

# Function to check and create project root marker
check_project_root_marker() {
  if [[ ! -f "$PROJECT_ROOT/.project-root" ]]; then
    echo "Creating .project-root marker file..."
    echo "CharterHub Project Root" > "$PROJECT_ROOT/.project-root"
    echo "This file marks the root directory of the CharterHub project." >> "$PROJECT_ROOT/.project-root"
    echo "It is used by scripts to determine the correct paths for starting servers and other operations." >> "$PROJECT_ROOT/.project-root"
    echo "DO NOT DELETE THIS FILE." >> "$PROJECT_ROOT/.project-root"
    echo "✅ Created .project-root marker file"
  else
    echo "✅ .project-root marker file already exists"
  fi
}

# Function to check and fix npm scripts
check_and_fix_npm_scripts() {
  echo "Checking npm scripts in frontend/package.json..."
  
  if [[ -f "$PROJECT_ROOT/frontend/package.json" ]]; then
    # Check if dev script exists
    if ! grep -q '"dev"' "$PROJECT_ROOT/frontend/package.json"; then
      echo "Adding 'dev' script to package.json..."
      # Use sed to add the dev script after the "scripts": { line
      sed -i.bak 's/"scripts": {/"scripts": {\n    "dev": "vite",/' "$PROJECT_ROOT/frontend/package.json"
      rm -f "$PROJECT_ROOT/frontend/package.json.bak"
      echo "✅ Added 'dev' script to package.json"
    else
      echo "✅ 'dev' script already exists in package.json"
    fi
    
    # Check if start script exists
    if ! grep -q '"start"' "$PROJECT_ROOT/frontend/package.json"; then
      echo "Adding 'start' script to package.json..."
      # Use sed to add the start script after the "scripts": { line
      sed -i.bak 's/"scripts": {/"scripts": {\n    "start": "vite",/' "$PROJECT_ROOT/frontend/package.json"
      rm -f "$PROJECT_ROOT/frontend/package.json.bak"
      echo "✅ Added 'start' script to package.json"
    else
      echo "✅ 'start' script already exists in package.json"
    fi
  else
    echo "❌ frontend/package.json not found"
  fi
}

# Function to initialize the database
initialize_database() {
  echo "Initializing database..."
  
  # Change to the backend directory
  cd "$PROJECT_ROOT/backend" || exit 1
  
  # Run database initialization script if it exists
  if [[ -f "init-database.php" ]]; then
    echo "Running init-database.php..."
    php init-database.php
  else
    echo "❌ init-database.php not found"
  fi
  
  # Run database verification script if it exists
  if [[ -f "verify-database.php" ]]; then
    echo "Running verify-database.php..."
    php verify-database.php
  else
    echo "❌ verify-database.php not found"
  fi
  
  # Run user migration script if it exists
  if [[ -f "migrate-refresh-tokens.php" ]]; then
    echo "Running migrate-refresh-tokens.php..."
    php migrate-refresh-tokens.php
  else
    echo "❌ migrate-refresh-tokens.php not found"
  fi
}

# Main script execution

echo "🔧 CharterHub Fix Common Issues Script 🔧"
echo "----------------------------------------"

# Find the project root
PROJECT_ROOT=$(find_project_root)
if [[ $? -ne 0 ]]; then
  echo "Warning: Could not find project root marker (.project-root)."
  echo "Using current directory as project root: $PWD"
  PROJECT_ROOT="$PWD"
fi

echo "Project root: $PROJECT_ROOT"
echo ""

# Kill any existing server processes
kill_existing_servers

# Check and create project root marker
check_project_root_marker

# Check and create environment files
check_and_create_env_files

# Make scripts executable
make_scripts_executable

# Check and fix npm scripts
check_and_fix_npm_scripts

# Initialize the database
initialize_database

echo ""
echo "✨ Fixes completed! ✨"
echo "Run ./check-environment.sh to verify your environment."
echo "Run ./server-start.sh to start the backend server."
echo "Run ./setup-dev-environment.sh to start both backend and frontend servers." 