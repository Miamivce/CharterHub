# Client Authentication Implementation Plan

## Understanding the Dual Authentication Architecture

The project uses a dual authentication approach:
- **WordPress Admin Authentication**: For administrators, leveraging WordPress credentials
- **Custom JWT Authentication**: For clients, using our custom JWT system

## Current Issues Analysis

### Client Authentication Flow Issues

1. **Inconsistent Token Storage**:
   - Runtime determination in `TokenStorage.getStorageType()` doesn't persist across page refreshes
   - May look in wrong storage location after page refresh
   - No consistent strategy for localStorage vs sessionStorage selection

2. **Token Refresh Mechanism**:
   - Inadequate token validation and rotation
   - Backend refresh endpoint validation issues
   - Improper handling of refresh token failures

3. **User Role Management**:
   - Inconsistent mapping between backend roles ('charter_client') and frontend roles ('customer')
   - Insufficient role validation during authentication flow

4. **CSRF Token Handling**:
   - Poor coordination of CSRF token requests
   - Insufficient error handling and recovery

## Implementation Plan

### Phase 1: Client Authentication Storage Improvements (Day 1-2)

1. **Consistent Token Storage Strategy**:
   - Add explicit storage preference tracking
   - Implement fallback mechanism between storage types
   - Add proper storage preference persistence

2. **Enhanced User Data Parsing**:
   - Fix field naming conventions
   - Implement proper role mapping
   - Handle missing fields gracefully

3. **Database Cleanup Script**:
   - Ensure consistent user metadata
   - Fix duplicate entries
   - Standardize role assignments

### Phase 2: Improve Client Login and Token Refresh (Day 3-4)

1. **Enhanced Client Login Function**:
   - Add robust CSRF token handling
   - Implement proper error handling
   - Add rate limiting detection and messaging

2. **Improved Token Refresh Mechanism**:
   - Add proper token expiration detection
   - Implement consistent storage handling
   - Add comprehensive error handling and recovery

### Phase 3: Backend Token Validation and Refresh (Day 5-6)

1. **Improved Refresh Token Endpoint**:
   - Add proper token validation
   - Implement token rotation for security
   - Add comprehensive error handling
   - Ensure consistent CSRF handling

2. **CSRF Token Management**:
   - Improve token generation and validation
   - Add proper expiration handling
   - Fix CORS headers for preflight requests

### Phase 4: Integration and Testing (Day 7)

1. **Session Persistence Testing**:
   - Add diagnostic utilities
   - Test across various scenarios
   - Verify refresh token flows

2. **Documentation and Cleanup**:
   - Update implementation documentation
   - Add inline code comments
   - Document API endpoints and expected behaviors

## Detailed Technical Implementation

### Token Storage Improvements

```typescript
// TokenStorage class update
private static STORAGE_PREFERENCE_KEY = 'auth_storage_preference';

static getStorageType(): 'local' | 'session' {
  // Check if we have a saved preference
  const savedPreference = localStorage.getItem(this.STORAGE_PREFERENCE_KEY);
  
  if (savedPreference === 'local' || savedPreference === 'session') {
    return savedPreference;
  }
  
  // Fall back to checking token existence
  const hasLocalToken = !!localStorage.getItem(this.TOKEN_KEY);
  const hasSessionToken = !!sessionStorage.getItem(this.TOKEN_KEY);
  
  // If token exists in either storage, use that one
  if (hasLocalToken) {
    this.setStoragePreference('local');
    return 'local';
  }
  
  if (hasSessionToken) {
    this.setStoragePreference('session');
    return 'session';
  }
  
  // Default to session if no tokens found
  this.setStoragePreference('session');
  return 'session';
}

static setStoragePreference(type: 'local' | 'session'): void {
  this.storageType = type;
  localStorage.setItem(this.STORAGE_PREFERENCE_KEY, type);
}

static getItemWithFallback(key: string): string | null {
  // Try primary storage first
  const primaryStorage = this.getStorage();
  const value = primaryStorage.getItem(key);
  
  if (value) {
    return value;
  }
  
  // If not found, try the other storage
  const fallbackStorage = this.storageType === 'local' ? sessionStorage : localStorage;
  const fallbackValue = fallbackStorage.getItem(key);
  
  if (fallbackValue) {
    // If found in fallback, migrate it to the preferred storage
    primaryStorage.setItem(key, fallbackValue);
    fallbackStorage.removeItem(key);
    
    return fallbackValue;
  }
  
  return null;
}
```

### User Data Parsing Improvements

```typescript
const parseUserData = (userData: any): User => {
  if (!userData) {
    throw new Error('Invalid user data provided');
  }
  
  // Log for debugging
  console.log('Parsing user data:', userData);
  
  // Handle backend role format conversion
  let role = 'customer';
  if (userData.role) {
    if (['admin', 'administrator'].includes(userData.role.toLowerCase())) {
      role = 'admin';
    } else if (['charter_client', 'customer'].includes(userData.role.toLowerCase())) {
      role = 'customer';
    }
  }
  
  // Build display name with fallbacks
  let displayName = userData.display_name || userData.displayName;
  
  if (!displayName) {
    const firstName = userData.first_name || userData.firstName || '';
    const lastName = userData.last_name || userData.lastName || '';
    displayName = [firstName, lastName].filter(Boolean).join(' ').trim() || userData.email;
  }
  
  // Format names consistently
  const firstName = userData.first_name || userData.firstName || '';
  const lastName = userData.last_name || userData.lastName || '';
  
  // Format user object with proper types and defaults
  return {
    id: Number(userData.id) || 0,
    email: userData.email || '',
    firstName: firstName,
    lastName: lastName,
    displayName: displayName,
    role: role as 'admin' | 'customer',
    verified: Boolean(userData.verified),
    phoneNumber: userData.phone_number || userData.phoneNumber || undefined,
    company: userData.company || undefined,
    registeredDate: userData.registeredDate || userData.created_at || new Date().toISOString()
  };
};
```

### Backend Refresh Token Endpoint Improvements

```php
<?php
// Improved refresh token endpoint

// Set CORS headers
set_cors_headers(['POST', 'OPTIONS']);

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Verify method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Get CSRF token and verify
$headers = getallheaders();
$csrf_token = isset($headers['X-CSRF-Token']) ? $headers['X-CSRF-Token'] : null;

if (!verify_csrf_token($csrf_token)) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Invalid CSRF token']);
    exit;
}

// Get request data
$data = json_decode(file_get_contents('php://input'), true);
$refresh_token = isset($data['refresh_token']) ? $data['refresh_token'] : '';

if (empty($refresh_token)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Refresh token is required']);
    exit;
}

try {
    $pdo = get_db_connection();
    
    // Find token and validate
    $stmt = $pdo->prepare("
        SELECT t.user_id, t.expires_at, u.email, u.role
        FROM tokens t
        JOIN users u ON t.user_id = u.id
        WHERE t.refresh_token = :refresh_token
        AND t.revoked = 0
    ");
    
    $stmt->execute([':refresh_token' => $refresh_token]);
    $token_data = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Various validation checks...
    
    // Generate new tokens with rotation
    $expires_in = 3600; // 1 hour for JWT
    $jwt_token = generate_jwt_token($user_data, time() + $expires_in);
    $new_refresh_token = generate_token(64);
    
    // Update database and return tokens
    // ...
}
catch (Exception $e) {
    // Error handling
}
```

## Conclusion

This implementation plan maintains the separation between client and admin authentication flows while fixing the critical issues in the client authentication system. The focus is on:

1. **Storage Consistency**: Ensuring consistent storage selection across page refreshes
2. **Token Recovery**: Implementing fallback mechanisms for token retrieval
3. **User Data Standardization**: Fixing field naming and role mapping
4. **Token Security**: Implementing proper validation and rotation
5. **Error Handling**: Adding comprehensive error handling throughout the system

Following this plan will create a robust client authentication system that maintains session persistence while preserving the separate WordPress admin authentication path. 