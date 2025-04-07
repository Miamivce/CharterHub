#!/bin/bash

# check-environment.sh
# Script to verify that the CharterHub development environment is set up correctly

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

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
check_port() {
  local port=$1
  if lsof -i :"$port" > /dev/null 2>&1; then
    echo "Port $port is in use."
    return 0
  else
    echo "Port $port is available."
    return 1
  fi
}

# Find the project root
PROJECT_ROOT=$(find_project_root)
if [[ $? -ne 0 ]]; then
  echo "❌ Project root marker (.project-root) not found."
  echo "   This might not be a CharterHub project directory."
else
  echo "✅ Project root found at: $PROJECT_ROOT"
fi

# Check directory structure
echo -e "\n📁 Checking directory structure..."
if [[ -d "$PROJECT_ROOT/backend" ]]; then
  echo "✅ Backend directory exists."
else
  echo "❌ Backend directory not found at $PROJECT_ROOT/backend"
fi

if [[ -d "$PROJECT_ROOT/frontend" ]]; then
  echo "✅ Frontend directory exists."
else
  echo "❌ Frontend directory not found at $PROJECT_ROOT/frontend"
fi

# Check for required files
echo -e "\n📄 Checking for required files..."
REQUIRED_BACKEND_FILES=("auth/csrf-token.php" "customers/list.php" "bootstrap.php" "db-config.php")
for file in "${REQUIRED_BACKEND_FILES[@]}"; do
  if [[ -f "$PROJECT_ROOT/backend/$file" ]]; then
    echo "✅ Backend file exists: $file"
  else
    echo "❌ Backend file missing: $file"
  fi
done

if [[ -f "$PROJECT_ROOT/frontend/package.json" ]]; then
  echo "✅ Frontend package.json exists."
else
  echo "❌ Frontend package.json missing."
fi

# Check for required scripts
echo -e "\n📜 Checking for required scripts..."
if [[ -f "$PROJECT_ROOT/server-start.sh" ]]; then
  echo "✅ server-start.sh exists."
else
  echo "❌ server-start.sh missing."
fi

if [[ -f "$PROJECT_ROOT/setup-dev-environment.sh" ]]; then
  echo "✅ setup-dev-environment.sh exists."
else
  echo "❌ setup-dev-environment.sh missing."
fi

# Check script permissions
echo -e "\n🔒 Checking script permissions..."
if [[ -x "$PROJECT_ROOT/server-start.sh" ]]; then
  echo "✅ server-start.sh is executable."
else
  echo "❌ server-start.sh is not executable. Run: chmod +x server-start.sh"
fi

if [[ -x "$PROJECT_ROOT/setup-dev-environment.sh" ]]; then
  echo "✅ setup-dev-environment.sh is executable."
else
  echo "❌ setup-dev-environment.sh is not executable. Run: chmod +x setup-dev-environment.sh"
fi

# Check for required dependencies
echo -e "\n🔧 Checking for required dependencies..."
if command_exists php; then
  PHP_VERSION=$(php -v | head -n 1)
  echo "✅ PHP is installed: $PHP_VERSION"
else
  echo "❌ PHP is not installed."
fi

if command_exists node; then
  NODE_VERSION=$(node -v)
  echo "✅ Node.js is installed: $NODE_VERSION"
else
  echo "❌ Node.js is not installed."
fi

if command_exists npm; then
  NPM_VERSION=$(npm -v)
  echo "✅ npm is installed: $NPM_VERSION"
else
  echo "❌ npm is not installed."
fi

# Check if servers are running
echo -e "\n🖥️ Checking if servers are running..."
if check_port 8000; then
  echo "✅ Backend server is running on port 8000."
else
  echo "❌ Backend server is not running on port 8000."
fi

if check_port 3000; then
  echo "✅ Frontend server is running on port 3000."
elif check_port 3001; then
  echo "✅ Frontend server is running on port 3001 (fallback port)."
else
  echo "❌ Frontend server is not running on port 3000 or 3001."
fi

# Check environment files
echo -e "\n🔐 Checking environment files..."
if [[ -f "$PROJECT_ROOT/backend/.env" ]]; then
  echo "✅ Backend .env file exists."
else
  echo "❌ Backend .env file missing. Copy from .env.template if available."
fi

if [[ -f "$PROJECT_ROOT/frontend/.env" ]]; then
  echo "✅ Frontend .env file exists."
else
  echo "❌ Frontend .env file missing. Copy from .env.template if available."
fi

echo -e "\n✨ Environment check complete!"
echo "If you found any issues, please refer to the troubleshooting-guide.md for solutions." 