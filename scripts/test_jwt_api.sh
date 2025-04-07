#!/bin/bash

# Test script for JWT authentication API
# This script tests the login, profile, and token refresh endpoints

# Configuration
API_URL="http://localhost:8000/api"
TEST_EMAIL="test@example.com"
TEST_PASSWORD="Test1234"
AUTH_TOKEN=""
REFRESH_TOKEN=""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to make API requests
function api_request() {
  local method=$1
  local endpoint=$2
  local data=$3
  local auth_header=""
  
  if [ -n "$AUTH_TOKEN" ] && [ "$endpoint" != "auth/login" ] && [ "$endpoint" != "auth/refresh" ]; then
    auth_header="-H \"Authorization: Bearer $AUTH_TOKEN\""
  fi
  
  local cmd="curl -s -X $method \"$API_URL/$endpoint\" \
    -H \"Content-Type: application/json\" \
    $auth_header \
    -d '$data'"
  
  echo -e "${YELLOW}Request:${NC} $method $API_URL/$endpoint"
  [ -n "$data" ] && echo -e "${YELLOW}Data:${NC} $data"
  
  local response=$(eval $cmd)
  echo -e "${YELLOW}Response:${NC} $response"
  echo ""
  
  echo "$response"
}

# Test login
echo -e "\n${GREEN}Testing login...${NC}"
login_response=$(api_request "POST" "auth/login" "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

if echo "$login_response" | grep -q "\"success\":true"; then
  echo -e "${GREEN}Login successful!${NC}"
  
  # Extract tokens
  AUTH_TOKEN=$(echo "$login_response" | grep -o '\"access_token\":\"[^\"]*\"' | cut -d':' -f2 | tr -d '\"')
  REFRESH_TOKEN=$(echo "$login_response" | grep -o '\"refresh_token\":\"[^\"]*\"' | cut -d':' -f2 | tr -d '\"')
  
  echo -e "${GREEN}Auth Token:${NC} ${AUTH_TOKEN:0:20}..."
  echo -e "${GREEN}Refresh Token:${NC} ${REFRESH_TOKEN:0:20}..."
else
  echo -e "${RED}Login failed!${NC}"
  exit 1
fi

# Test profile
echo -e "\n${GREEN}Testing profile...${NC}"
profile_response=$(api_request "GET" "users/profile" "")

if echo "$profile_response" | grep -q "\"success\":true"; then
  echo -e "${GREEN}Profile fetch successful!${NC}"
  
  # Extract user ID
  USER_ID=$(echo "$profile_response" | grep -o '\"id\":[0-9]*' | cut -d':' -f2)
  echo -e "${GREEN}User ID:${NC} $USER_ID"
else
  echo -e "${RED}Profile fetch failed!${NC}"
fi

# Test profile update
echo -e "\n${GREEN}Testing profile update...${NC}"
update_response=$(api_request "POST" "users/profile" "{\"first_name\":\"JWT\",\"last_name\":\"Test\"}")

if echo "$update_response" | grep -q "\"success\":true"; then
  echo -e "${GREEN}Profile update successful!${NC}"
else
  echo -e "${RED}Profile update failed!${NC}"
fi

# Test token refresh
echo -e "\n${GREEN}Testing token refresh...${NC}"
refresh_response=$(api_request "POST" "auth/refresh" "{\"refresh_token\":\"$REFRESH_TOKEN\"}")

if echo "$refresh_response" | grep -q "\"success\":true"; then
  echo -e "${GREEN}Token refresh successful!${NC}"
  
  # Extract new tokens
  NEW_AUTH_TOKEN=$(echo "$refresh_response" | grep -o '\"access_token\":\"[^\"]*\"' | cut -d':' -f2 | tr -d '\"')
  NEW_REFRESH_TOKEN=$(echo "$refresh_response" | grep -o '\"refresh_token\":\"[^\"]*\"' | cut -d':' -f2 | tr -d '\"')
  
  echo -e "${GREEN}New Auth Token:${NC} ${NEW_AUTH_TOKEN:0:20}..."
  echo -e "${GREEN}New Refresh Token:${NC} ${NEW_REFRESH_TOKEN:0:20}..."
  
  # Update tokens
  AUTH_TOKEN=$NEW_AUTH_TOKEN
  REFRESH_TOKEN=$NEW_REFRESH_TOKEN
else
  echo -e "${RED}Token refresh failed!${NC}"
fi

# Test admin endpoints (if user is admin)
echo -e "\n${GREEN}Testing admin endpoints...${NC}"
users_response=$(api_request "GET" "admin/users" "")

if echo "$users_response" | grep -q "\"success\":true"; then
  echo -e "${GREEN}Admin users list successful!${NC}"
  
  # Extract user count
  USER_COUNT=$(echo "$users_response" | grep -o '\"total_users\":[0-9]*' | cut -d':' -f2)
  echo -e "${GREEN}Total Users:${NC} $USER_COUNT"
else
  echo -e "${YELLOW}Admin users list failed - user might not be an admin${NC}"
fi

echo -e "\n${GREEN}All tests completed!${NC}" 