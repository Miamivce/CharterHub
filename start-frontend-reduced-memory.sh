#!/bin/bash

# --------------------------------------------------------------------------
# Frontend Only Server Script with Reduced Memory Settings
# --------------------------------------------------------------------------

echo "=========================================="
echo "Charter Hub Frontend (Optimized Memory)"
echo "=========================================="

# Set NODE_OPTIONS to limit memory usage
export NODE_OPTIONS="--max-old-space-size=512"

# Stop any running servers
echo "Stopping any existing servers..."
pkill -f "react-scripts start" > /dev/null 2>&1
pkill -f "node server.js" > /dev/null 2>&1
sleep 1
echo "All previous servers stopped successfully."

# Change to the frontend directory
cd "$(dirname "$0")/frontend"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing frontend dependencies..."
  npm install
fi

# Start the frontend server
echo "Starting frontend server on port 3000 (with reduced memory)..."
echo "Using memory limit: 512MB (NODE_OPTIONS=$NODE_OPTIONS)"

# Use development mode with reduced memory footprint
BROWSER=none npm start

# If the server was stopped, clean up
echo "Shutting down frontend server..."
pkill -f "react-scripts start" > /dev/null 2>&1
echo "Frontend server stopped." 