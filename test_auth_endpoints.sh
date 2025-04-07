#!/bin/bash

##############################################
# Test Registration Endpoint for New Clients #
##############################################
echo "\n--- Testing Registration Endpoint ---"
reg_response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" \
    -d "{\"username\": \"newuser\", \"password\": \"Newpass123\", \"email\": \"newuser_$(date +%s)@example.com\", \"firstName\": \"New\", \"lastName\": \"User\"}" \
    http://localhost:8000/auth/register.php)

echo "$reg_response"

# Extract the token from registration response using python3
new_token=$(echo "$reg_response" | head -n1 | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")
if [ -z "$new_token" ] || [ "$new_token" = "null" ]; then
    echo "Failed to retrieve token from registration endpoint. Exiting tests."
    exit 1
fi

echo "\nNew client token retrieved: $new_token"

###############################################
# Test Refresh Endpoint using new client token #
###############################################
echo "\n--- Testing Refresh Endpoint (New Client) ---"
new_refresh_response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" \
    -d "{\"token\": \"$new_token\"}" \
    http://localhost:8000/auth/refresh.php)

echo "$new_refresh_response"

#########################################################
# Test the Customers List Endpoint with new client token  #
#########################################################
echo "\n--- Testing Customers List Endpoint (with new client JWT) ---"
new_customers_response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $new_token" \
    http://localhost:8000/customers/list.php)

echo "$new_customers_response"

##############################################
# Test Login Endpoint for admin             #
##############################################
echo "\n--- Testing Login Endpoint (Admin) ---"
login_response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"secret"}' \
    http://localhost:8000/auth/login.php)

echo "$login_response"

# Extract the token from the login response using python3
token=$(echo "$login_response" | head -n1 | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")
if [ -z "$token" ] || [ "$token" = "null" ]; then
    echo "Failed to retrieve token from login endpoint. Exiting tests."
    exit 1
fi

echo "\nAdmin token retrieved: $token"

###############################################
# Test the Refresh Endpoint using admin token #
###############################################
echo "\n--- Testing Refresh Endpoint (Admin) ---"
refresh_response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" \
    -d "{\"token\": \"$token\"}" \
    http://localhost:8000/auth/refresh.php)

echo "$refresh_response"

###################################################
# Test the Customers List Endpoint using admin token #
###################################################
echo "\n--- Testing Customers List Endpoint (with admin JWT) ---"
customers_response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $token" \
    http://localhost:8000/customers/list.php)

echo "$customers_response"

# End of tests
echo "\n--- Testing Completed ---" 