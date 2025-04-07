#!/bin/bash

# start-unified-server.sh
# Script to start both backend and frontend servers for CharterHub

# Project directories
PROJECT_ROOT="$(pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# Display banner
echo "======================="
echo "CharterHub Server Suite"
echo "======================="
echo

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -i :"$port" &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# Stop any existing servers
stop_servers() {
    echo "Stopping any existing servers..."
    pkill -f "php -S localhost:8000" &> /dev/null
    pkill -f "node.*3000" &> /dev/null
    kill -9 $(lsof -ti:3000,8000 2>/dev/null) &> /dev/null
    sleep 1
    if ! check_port 8000 && ! check_port 3000; then
        echo "All previous servers stopped successfully."
    else
        echo "Warning: Could not stop all servers. Attempting to continue anyway."
    fi
    echo
}

# Start the backend server
start_backend() {
    echo "Starting backend server on port 8000..."
    cd "$BACKEND_DIR" || { echo "Error: Backend directory not found!"; exit 1; }
    php -S localhost:8000 > /dev/null 2>&1 &
    BACKEND_PID=$!
    sleep 2
    
    if check_port 8000; then
        echo "✅ Backend server started successfully!"
        echo "Backend server running on http://localhost:8000"
    else
        echo "❌ Failed to start backend server!"
        exit 1
    fi
    cd "$PROJECT_ROOT" || exit
    echo
}

# Start the frontend server
start_frontend() {
    echo "Starting frontend server on port 3000..."
    cd "$FRONTEND_DIR" || { echo "Error: Frontend directory not found!"; exit 1; }
    
    # Set higher memory limit for Node.js (4GB)
    export NODE_OPTIONS="--max-old-space-size=4096"
    
    npm start > /dev/null 2>&1 &
    FRONTEND_PID=$!
    sleep 5
    
    if check_port 3000; then
        echo "✅ Frontend server started successfully!"
        echo "Frontend server running on http://localhost:3000"
    else
        echo "❌ Failed to start frontend server!"
        exit 1
    fi
    cd "$PROJECT_ROOT" || exit
    echo
}

# Handle cleanup on script termination
cleanup() {
    echo
    echo "Shutting down servers..."
    pkill -f "php -S localhost:8000" &> /dev/null
    pkill -f "node.*3000" &> /dev/null
    kill -9 $(lsof -ti:3000,8000 2>/dev/null) &> /dev/null
    echo "Servers stopped."
    exit 0
}

# Register the cleanup function to be called on script termination
trap cleanup SIGINT SIGTERM EXIT

# Main script execution
stop_servers
start_backend
start_frontend

echo "Both servers are now running!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo
echo "Press Ctrl+C to stop all servers"

# Keep the script running until user interrupts
while true; do
    sleep 1
done 