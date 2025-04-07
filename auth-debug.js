/**
 * CharterHub Authentication Debug Helper
 * 
 * This script provides helper functions to diagnose authentication issues
 * in the development environment. It can be used in the browser console.
 */

// Debug information display
function showAuthDebugInfo() {
  console.group('🔒 CharterHub Auth Debug Info');
  
  // CSRF token
  const csrfToken = localStorage.getItem('csrf_token') || sessionStorage.getItem('csrf_token');
  console.log('CSRF Token:', csrfToken ? csrfToken : 'None found');
  
  // Auth tokens
  const authToken = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  console.log('Auth Token:', authToken ? '✓ Present' : '✗ Not found');
  
  const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
  console.log('Refresh Token:', refreshToken ? '✓ Present' : '✗ Not found');
  
  // User data
  const userDataStr = localStorage.getItem('user_data') || sessionStorage.getItem('user_data');
  if (userDataStr) {
    try {
      const userData = JSON.parse(userDataStr);
      console.log('User Data:', userData);
      console.log('User Verified Status:', userData.verified ? '✓ Verified' : '✗ Not Verified');
    } catch (e) {
      console.log('User Data: Error parsing JSON');
    }
  } else {
    console.log('User Data: Not found');
  }
  
  // Rate limiting info
  const rateLimitInfoStr = localStorage.getItem('rate_limit_info');
  if (rateLimitInfoStr) {
    try {
      const rateLimitInfo = JSON.parse(rateLimitInfoStr);
      console.log('Rate Limit Info:', rateLimitInfo);
    } catch (e) {
      console.log('Rate Limit Info: Error parsing JSON');
    }
  } else {
    console.log('Rate Limit Info: None');
  }
  
  console.groupEnd();
  
  return 'Auth debug info displayed in console';
}

// Helper to clear all auth data
async function clearAuthData() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_data');
  localStorage.removeItem('csrf_token');
  sessionStorage.removeItem('auth_token');
  sessionStorage.removeItem('refresh_token');
  sessionStorage.removeItem('user_data');
  sessionStorage.removeItem('csrf_token');
  
  console.log('✓ All authentication data cleared from storage');
  return 'Auth data cleared';
}

// Fetch a fresh CSRF token
async function fetchFreshCsrfToken() {
  try {
    const apiUrl = new URL('/auth/csrf-token.php', window.location.origin);
    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch CSRF token: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.csrf_token) {
      localStorage.setItem('csrf_token', data.csrf_token);
      console.log('✓ New CSRF token fetched and stored:', data.csrf_token);
      return data.csrf_token;
    } else {
      throw new Error('Invalid response format for CSRF token');
    }
  } catch (error) {
    console.error('❌ Error fetching CSRF token:', error);
    throw error;
  }
}

// Reset login attempts
async function resetLoginAttempts() {
  try {
    const apiUrl = new URL('/auth/reset-login-attempts.php', window.location.origin);
    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to reset login attempts: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✓ Login attempts reset successfully');
      return true;
    } else {
      throw new Error(data.message || 'Failed to reset login attempts');
    }
  } catch (error) {
    console.error('❌ Error resetting login attempts:', error);
    throw error;
  }
}

// Test login credentials
async function testLogin(email, password, rememberMe = false) {
  try {
    // Get a fresh CSRF token first
    await fetchFreshCsrfToken();
    const csrfToken = localStorage.getItem('csrf_token');
    
    if (!csrfToken) {
      throw new Error('No CSRF token available');
    }
    
    const apiUrl = new URL('/auth/login.php', window.location.origin);
    const response = await fetch(apiUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      credentials: 'include',
      body: JSON.stringify({ email, password, remember_me: rememberMe })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✓ Login successful:', data);
      return { success: true, data };
    } else {
      console.error('❌ Login failed:', data);
      return { success: false, error: data };
    }
  } catch (error) {
    console.error('❌ Error during login test:', error);
    return { success: false, error: error.message };
  }
}

// Check account verification status
async function checkVerificationStatus(email) {
  try {
    // Get a fresh CSRF token first
    await fetchFreshCsrfToken();
    const csrfToken = localStorage.getItem('csrf_token');
    
    if (!csrfToken) {
      throw new Error('No CSRF token available');
    }
    
    const apiUrl = new URL('/auth/check-verification.php', window.location.origin);
    apiUrl.searchParams.append('email', email);
    
    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'X-CSRF-Token': csrfToken
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to check verification status: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Account verification status:', data);
    return data;
  } catch (error) {
    console.error('❌ Error checking verification status:', error);
    return { 
      success: false, 
      message: error.message,
      tip: 'You can use the dev-verify-account.php endpoint to verify your account'
    };
  }
}

// Verify an account (development only)
async function verifyAccount(email) {
  try {
    const apiUrl = new URL('/auth/dev-verify-account.php', window.location.origin);
    const formData = new FormData();
    formData.append('email', email);
    
    const response = await fetch(apiUrl.toString(), {
      method: 'POST',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: formData
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✓ Account verified successfully:', data);
      return { success: true, message: data.message };
    } else {
      console.error('❌ Account verification failed:', data);
      return { success: false, error: data.message };
    }
  } catch (error) {
    console.error('❌ Error during account verification:', error);
    return { success: false, error: error.message };
  }
}

// Check API connection
async function checkApiConnection() {
  try {
    const apiUrl = new URL('/auth/status.php', window.location.origin);
    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error(`API connection failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('API connection status:', data);
    return data;
  } catch (error) {
    console.error('❌ API connection error:', error);
    return { success: false, message: error.message };
  }
}

// Export all functions to the global scope for console use
window.authDebug = {
  showAuthDebugInfo,
  clearAuthData,
  fetchFreshCsrfToken,
  resetLoginAttempts,
  testLogin,
  checkVerificationStatus,
  verifyAccount,
  checkApiConnection
};

// Auto-run the debug info display when the script is loaded
showAuthDebugInfo();

console.log(`
🔧 CharterHub Auth Debug Helper loaded!

Available commands:
  - authDebug.showAuthDebugInfo() - Show current auth state
  - authDebug.clearAuthData() - Clear all auth tokens/data
  - authDebug.fetchFreshCsrfToken() - Get a new CSRF token
  - authDebug.resetLoginAttempts() - Reset rate limiting
  - authDebug.testLogin(email, password) - Test login credentials
  - authDebug.checkVerificationStatus(email) - Check if account is verified
  - authDebug.verifyAccount(email) - Mark account as verified (dev only)
  - authDebug.checkApiConnection() - Test API connectivity
`);
