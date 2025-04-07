# Authentication Test Scripts Documentation

This document outlines the test scripts created to verify authentication functionality, particularly focusing on the token validation and profile update processes.

## Available Test Scripts

### 1. `backend/test-me-endpoint.php`

**Purpose**: Tests the `/auth/me.php` endpoint to ensure JWT tokens are correctly validated and user data is properly returned.

**Functionality**:
- Retrieves user ID 43 from the database
- Finds or generates a valid JWT token for this user
- Makes a request to the `/auth/me.php` endpoint
- Verifies that user data is correctly returned, including `phoneNumber` and `company` fields

**Usage**:
```bash
php backend/test-me-endpoint.php
```

**Expected Output**:
- Successful connection to the database
- Creation or retrieval of a valid token
- HTTP 200 status response from the `/auth/me.php` endpoint
- Complete user profile data in the response

### 2. `backend/token-debug.php`

**Purpose**: Comprehensive token validation test script that tests both `/auth/me.php` and `/auth/update-profile.php` endpoints.

**Functionality**:
- Generates fresh JWT tokens for user ID 43
- Verifies token validation with the `/auth/me.php` endpoint
- Tests profile updates with the `/auth/update-profile.php` endpoint
- Provides detailed output about token validity and endpoint responses

**Usage**:
```bash
php backend/token-debug.php
```

**Expected Output**:
- Token generation details including expiration date
- Successful validation with the `/auth/me.php` endpoint
- Successful profile update with the `/auth/update-profile.php` endpoint
- User data in the response from both endpoints

### 3. `backend/test-update-profile-simplified.php`

**Purpose**: Tests the simplified profile update endpoint to verify the direct token validation approach.

**Functionality**:
- Generates a fresh JWT token for user ID 43
- Creates a profile update payload with test data
- Sends a request to the `/auth/update-profile-simplified.php` endpoint
- Verifies successful profile update and response format

**Usage**:
```bash
php backend/test-update-profile-simplified.php
```

**Expected Output**:
- Token generation and storage confirmation
- HTTP 200 status response from the endpoint
- Confirmation of successful profile update
- Updated user data in the response

## Test Data

All test scripts use user ID 43 by default, which corresponds to a test account with the following details:
- Email: `test24@me.com`
- First Name: Jan
- Last Name: Mawxs

Test profile updates typically modify:
- Last name: "Mawxs" (can be varied in tests)
- Company name: "DFGGSFGSDF" (can be varied in tests)

## Recent Test Results

### March 13, 2025

1. **Token Validation Tests**:
   - `/auth/me.php`: ✅ SUCCESS
   - `/auth/update-profile.php`: ✅ SUCCESS

2. **Profile Update Tests**:
   - Standard profile updates: ✅ SUCCESS
   - Email change (same domain): ✅ SUCCESS
   - Company name update: ✅ SUCCESS

3. **Error Handling Tests**:
   - Missing token: ✅ Returns 401 with appropriate error message
   - Malformed token: ✅ Returns 401 with appropriate error message
   - Invalid user ID: ✅ Returns 401 with "User not found" message

## Adding New Tests

When adding new authentication tests, follow these guidelines:

1. Include thorough error logging
2. Test with known user accounts (preferably ID 43)
3. Generate fresh tokens for each test
4. Verify both happy path and error scenarios
5. Document expected output and actual results

## Troubleshooting Common Issues

1. **401 Unauthorized Errors**:
   - Check database connection method
   - Verify token format and payload structure
   - Ensure user exists in the database
   - Check error logs for specific failure points

2. **Token Validation Failures**:
   - Verify token structure (header.payload.signature)
   - Check that user ID in token matches a user in the database
   - Ensure token has not expired
   - Check token storage in the database

3. **Profile Update Failures**:
   - Verify transaction handling
   - Check input sanitization
   - Validate email format for email changes
   - Ensure proper error responses are returned 