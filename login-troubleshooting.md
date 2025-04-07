# Login Troubleshooting Guide

## "Invalid credentials" After Registration

If you're encountering an "Invalid credentials" error after registering a new account, **this is likely because your account needs to be verified before you can log in.**

### Quick Fix for Development Environment

During development, you have two ways to verify your account:

1. **Use the Verification Popup**
   - After registration, you should see a popup with a verification success message
   - Click the button in the popup to navigate to the dashboard
   - This simulates email verification in the development environment

2. **Use the Development Verification Tool**
   - Visit: `http://localhost:8000/auth/dev-verify-account.php`
   - Enter your email address and click "Verify Account"
   - Once verified, you'll be able to log in with your credentials

## Understanding Account Verification

The CharterHub system requires email verification for all new accounts. This is a security feature that helps ensure:

1. The email address belongs to the person registering
2. There's a valid way to contact users about their account
3. Protection against automated bot registrations

### Verification Process

1. When you register, your account is created with `verified = 0` in the database
2. The system sends a verification email with a unique link (except in development mode)
3. Clicking the link changes your account status to `verified = 1`
4. Only after verification can you successfully log in

## Detailed Troubleshooting Steps

If you're still experiencing login issues after verification:

### 1. Check Your Login Credentials

- Ensure you're using the exact email and password from registration
- Passwords are case-sensitive
- Check that you don't have caps lock enabled

### 2. Clear Browser Storage

Browser storage may have outdated tokens:

```javascript
// Run this in your browser console
localStorage.clear();
sessionStorage.clear();
```

### 3. Reset Login Attempts

If you've attempted to log in multiple times, you may be rate-limited:

```javascript
// Run this in your browser console (dev environment only)
fetch('/auth/reset-login-attempts.php');
```

### 4. Use the Auth Debug Tool

For more advanced troubleshooting, use our debug helper:

```javascript
// Run this in your browser console
const script = document.createElement('script');
script.src = '/auth-debug.js';
document.head.appendChild(script);

// Then use the available commands:
authDebug.showAuthDebugInfo();     // Display current auth state
authDebug.verifyAccount('your.email@example.com');  // Verify your account
```

## When to Contact Support

If you've tried all the above steps and still can't log in:

1. Make note of any error messages you receive
2. Check the browser console for additional error details
3. Contact support with your email address and describe the issue

## For Developers

### Common Development Issues

- **Email Verification**: In production, users can't log in until they verify their email. To simulate verification in development, use the `dev-verify-account.php` endpoint.

- **Rate Limiting**: After several failed login attempts, accounts get temporarily locked. Use `reset-login-attempts.php` during testing.

- **CSRF Tokens**: All authentication endpoints require valid CSRF tokens. If authentication fails with 400 errors, check that CSRF tokens are being properly handled.

### API Configuration Notes

- Ensure all API instances have `withCredentials: true` for proper cookie handling
- Backend should have appropriate CORS headers with `Access-Control-Allow-Credentials: true`
- Always fetch a fresh CSRF token before login attempts 