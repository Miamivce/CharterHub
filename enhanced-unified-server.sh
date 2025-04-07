#!/bin/bash

# enhanced-unified-server.sh
# Enhanced server script for CharterHub with better monitoring and error handling
# This script starts both PHP backend and Vite frontend servers with monitoring

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Store the project root directory
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
LOG_DIR="$PROJECT_ROOT/logs"
BACKEND_LOG="$LOG_DIR/backend-server.log"
FRONTEND_LOG="$LOG_DIR/frontend-server.log"
MONITOR_LOG="$LOG_DIR/server-monitor.log"

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Print header
echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}   CharterHub Enhanced Server Suite    ${NC}"
echo -e "${BLUE}=======================================${NC}\n"

# Log start time
echo "Starting servers at $(date)" | tee -a "$MONITOR_LOG"

# Function to check if port is in use
check_port() {
    local port=$1
    lsof -i :"$port" >/dev/null 2>&1
    return $?
}

# Function to monitor server health
monitor_servers() {
    while true; do
        local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
        local php_running=0
        local vite_running=0
        
        # Check PHP server
        if pgrep -f "php -S localhost:8000" >/dev/null; then
            php_running=1
        fi
        
        # Check Vite server
        if pgrep -f "node.*vite" >/dev/null; then
            vite_running=1
        fi
        
        # Log status
        echo "[$timestamp] PHP: $php_running, Vite: $vite_running" >> "$MONITOR_LOG"
        
        # If either server is down, log warning
        if [ $php_running -eq 0 ] || [ $vite_running -eq 0 ]; then
            echo "[$timestamp] WARNING: One or more servers are down!" >> "$MONITOR_LOG"
            
            # If servers are down but haven't been explicitly stopped, attempt to restart
            if [ "$SERVER_STOPPING" != "true" ]; then
                echo "[$timestamp] Attempting server restart..." >> "$MONITOR_LOG"
                
                if [ $php_running -eq 0 ]; then
                    echo "[$timestamp] Restarting PHP server..." >> "$MONITOR_LOG"
                    cd "$BACKEND_DIR"
                    php -S localhost:8000 > "$BACKEND_LOG" 2>&1 &
                    PHP_PID=$!
                fi
                
                if [ $vite_running -eq 0 ]; then
                    echo "[$timestamp] Restarting Vite server..." >> "$MONITOR_LOG"
                    cd "$FRONTEND_DIR"
                    npm run dev > "$FRONTEND_LOG" 2>&1 &
                    VITE_PID=$!
                fi
                
                cd "$PROJECT_ROOT"
            fi
        fi
        
        # Check for excessive memory usage
        node_mem=$(ps -o rss= -p $(pgrep -f "node.*vite" | tr '\n' ' ') 2>/dev/null | awk '{sum+=$1} END {print sum/1024}')
        # Convert to integer by removing decimal portion before comparison
        if [ ! -z "$node_mem" ]; then
            node_mem_int=$(echo "$node_mem" | awk '{print int($1)}')
            if [ "$node_mem_int" -gt 2000 ]; then
                echo "[$timestamp] WARNING: High memory usage by Node.js: ${node_mem}MB" >> "$MONITOR_LOG"
            fi
        fi
        
        # Check for large log files
        if [ -f "$BACKEND_LOG" ] && [ $(stat -f%z "$BACKEND_LOG") -gt 10485760 ]; then
            mv "$BACKEND_LOG" "${BACKEND_LOG}.$(date +%Y%m%d%H%M%S).old"
            touch "$BACKEND_LOG"
            echo "[$timestamp] Rotated backend log file due to size" >> "$MONITOR_LOG"
        fi
        
        if [ -f "$FRONTEND_LOG" ] && [ $(stat -f%z "$FRONTEND_LOG") -gt 10485760 ]; then
            mv "$FRONTEND_LOG" "${FRONTEND_LOG}.$(date +%Y%m%d%H%M%S).old"
            touch "$FRONTEND_LOG"
            echo "[$timestamp] Rotated frontend log file due to size" >> "$MONITOR_LOG"
        fi
        
        sleep 30
        
        # Break the loop if monitoring should stop
        if [ "$STOP_MONITORING" = "true" ]; then
            echo "[$timestamp] Stopping server monitoring" >> "$MONITOR_LOG"
            break
        fi
    done
}

# Function to cleanup processes on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down servers...${NC}" | tee -a "$MONITOR_LOG"
    
    # Set flags to prevent auto-restart
    SERVER_STOPPING="true"
    STOP_MONITORING="true"
    
    # Kill PHP server
    echo "Stopping PHP server..." | tee -a "$MONITOR_LOG"
    pkill -f "php -S localhost:8000" 2>/dev/null
    
    # Kill Vite server
    echo "Stopping Vite server..." | tee -a "$MONITOR_LOG"
    pkill -f "node.*vite" 2>/dev/null
    
    # Wait for processes to stop
    sleep 2
    
    # Check if any processes are still running
    php_count=$(pgrep -f "php -S localhost:8000" | wc -l | tr -d ' ')
    node_count=$(pgrep -f "node.*vite" | wc -l | tr -d ' ')
    
    if [ "$php_count" -gt 0 ] || [ "$node_count" -gt 0 ]; then
        echo -e "${RED}Some processes are still running. Force stopping...${NC}" | tee -a "$MONITOR_LOG"
        
        # Force kill remaining processes
        pkill -9 -f "php -S localhost:8000" 2>/dev/null
        pkill -9 -f "node.*vite" 2>/dev/null
        
        # Also try killing by port
        lsof -ti:8000,3000 | xargs kill -9 2>/dev/null
    fi
    
    echo -e "${GREEN}All servers stopped${NC}" | tee -a "$MONITOR_LOG"
    echo "Servers stopped at $(date)" | tee -a "$MONITOR_LOG"
    exit 0
}

# Set trap for cleanup on exit
trap cleanup SIGINT SIGTERM

# First cleanup any existing servers
echo -e "${YELLOW}Checking for existing servers...${NC}"
if check_port 8000 || check_port 3000; then
    echo -e "${YELLOW}Stopping any existing servers...${NC}"
    pkill -f "php -S localhost:8000" 2>/dev/null
    pkill -f "node.*vite" 2>/dev/null
    sleep 2
    
    # Force kill if needed
    if check_port 8000 || check_port 3000; then
        echo -e "${RED}Force killing stubborn processes...${NC}"
        lsof -ti:8000,3000 | xargs kill -9 2>/dev/null
        sleep 1
    fi
else
    echo -e "${GREEN}No existing servers found.${NC}"
fi

# Make sure ports are free
if check_port 8000 || check_port 3000; then
    echo -e "${RED}ERROR: Ports 8000 or 3000 are still in use.${NC}"
    echo "Please check running processes and free up these ports before starting servers."
    exit 1
fi

# Start PHP backend server with lower memory footprint
echo -e "${YELLOW}Starting PHP backend server...${NC}"
cd "$BACKEND_DIR" || { echo -e "${RED}ERROR: Backend directory not found!${NC}"; exit 1; }
php -S localhost:8000 > "$BACKEND_LOG" 2>&1 &
PHP_PID=$!

# Check if PHP server started successfully
sleep 2
if ! ps -p $PHP_PID > /dev/null || ! check_port 8000; then
    echo -e "${RED}ERROR: Failed to start PHP server.${NC}"
    echo "Check $BACKEND_LOG for details."
    exit 1
fi

echo -e "${GREEN}PHP backend server started successfully!${NC}"
echo "Backend server running at: http://localhost:8000"
echo "Backend logs: $BACKEND_LOG"

# Start Vite frontend server with memory optimization
echo -e "\n${YELLOW}Starting Vite frontend server...${NC}"
cd "$FRONTEND_DIR" || { echo -e "${RED}ERROR: Frontend directory not found!${NC}"; exit 1; }

# Set Node memory limit
export NODE_OPTIONS="--max-old-space-size=2048"

# Check if dev script exists in package.json
if ! grep -q "\"dev\":" package.json; then
    echo -e "${RED}ERROR: No 'dev' script found in frontend/package.json${NC}"
    echo "Please check your frontend configuration."
    cleanup
    exit 1
fi

# Start frontend server
npm run dev > "$FRONTEND_LOG" 2>&1 &
VITE_PID=$!

# Check if Vite server started successfully
sleep 5
if ! ps -p $VITE_PID > /dev/null || ! check_port 3000; then
    echo -e "${RED}ERROR: Failed to start Vite server.${NC}"
    echo "Check $FRONTEND_LOG for details."
    cleanup
    exit 1
fi

echo -e "${GREEN}Vite frontend server started successfully!${NC}"
echo "Frontend server running at: http://localhost:3000"
echo "Frontend logs: $FRONTEND_LOG"

# Return to project root
cd "$PROJECT_ROOT" || exit 1

# Start server monitoring in background
echo -e "\n${YELLOW}Starting server health monitoring...${NC}"
monitor_servers &
MONITOR_PID=$!

# Display server info
echo -e "\n${GREEN}All servers are now running!${NC}"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo -e "\n${YELLOW}Monitoring active. Check $MONITOR_LOG for status updates.${NC}"
echo -e "Press Ctrl+C to stop all servers.\n"

# Keep script running
while true; do
    sleep 1
    
    # Display short status every 60 seconds
    if (( $(date +%s) % 60 == 0 )); then
        if check_port 8000 && check_port 3000; then
            echo -e "\r${GREEN}Servers running normally $(date +%H:%M:%S)${NC}\r"
        else
            echo -e "\r${RED}WARNING: Server issue detected $(date +%H:%M:%S)${NC}\r"
        fi
    fi
done 