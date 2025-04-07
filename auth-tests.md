# Authentication System Testing Plan

This document outlines the testing strategy for the CharterHub authentication system, including unit tests, integration tests, and manual test cases.

## 1. Unit Tests

### Auth Context Tests

- **Test initialization:**
  - AuthContext should initialize with null user state
  - Loading state should be false initially

- **Test login function:**
  - Should set loading state to true during login
  - Should update user state on successful login
  - Should store tokens in localStorage when rememberMe is true
  - Should store tokens in sessionStorage when rememberMe is false
  - Should handle and properly format API errors

- **Test logout function:**
  - Should clear user state
  - Should remove tokens from both localStorage and sessionStorage
  - Should redirect to login page

- **Test register function:**
  - Should set loading state during registration
  - Should handle validation errors correctly
  - Should handle API errors correctly

- **Test token refresh:**
  - Should refresh token before expiry
  - Should use the correct storage based on rememberMe setting
  - Should handle refresh token errors

### API Service Tests

- **Test wpApi.login:**
  - Should make correct API call with provided credentials
  - Should format response data correctly
  - Should handle various error responses (invalid credentials, rate limited, etc.)

- **Test wpApi.register:**
  - Should validate email and password before API call
  - Should format user data correctly for API
  - Should handle validation and API errors

- **Test wpApi.getCurrentUser:**
  - Should return user data if token exists
  - Should return null if no token exists
  - Should attempt token refresh on 401 errors

- **Test wpApi.refreshToken:**
  - Should use correct refresh token from storage
  - Should update tokens in storage on success
  - Should clear tokens on refresh failure

## 2. Integration Tests

- **Login flow integration:**
  - Test complete login flow from UI through context to API
  - Verify token storage and user state updates
  - Test navigation after successful login

- **Registration flow integration:**
  - Test complete registration flow
  - Verify verification email notification
  - Test navigation after registration

- **Auth persistence:**
  - Test app reload with active session
  - Test session expiry and automatic logout
  - Test "remember me" functionality across browser restarts

- **Protected routes:**
  - Test access to protected routes with valid session
  - Test redirect to login for protected routes without session
  - Test role-based access restrictions

## 3. Manual Test Cases

### Basic Authentication

- **TC1: Standard Login**
  - Steps:
    1. Navigate to login page
    2. Enter valid credentials
    3. Click login button
  - Expected: User is logged in and redirected to dashboard

- **TC2: Invalid Credentials**
  - Steps:
    1. Navigate to login page
    2. Enter invalid credentials
    3. Click login button
  - Expected: Error message displayed, user remains on login page

- **TC3: New User Registration**
  - Steps:
    1. Navigate to registration page
    2. Fill all required fields with valid data
    3. Submit form
  - Expected: Success message, verification email notification shown

### Edge Cases

- **TC4: Rate Limiting**
  - Steps:
    1. Attempt login with invalid credentials multiple times (>5)
  - Expected: Rate limiting message displayed after 5 attempts
  - Recovery: Wait 30 minutes before trying again

- **TC5: Session Timeouts**
  - Steps:
    1. Log in successfully
    2. Leave session inactive for >24 hours
    3. Attempt to access a protected page
  - Expected: User is redirected to login page

- **TC6: Concurrent Sessions**
  - Steps:
    1. Log in on Device A
    2. Log in on Device B with same account
    3. Perform actions on both devices
  - Expected: Both sessions remain active and functional

### Security Tests

- **TC7: XSS Prevention**
  - Steps:
    1. Attempt to submit form data with script tags
  - Expected: Input is sanitized, no scripts execute

- **TC8: CSRF Protection**
  - Steps:
    1. Analyze requests for proper CSRF tokens
  - Expected: All state-changing requests include CSRF protection

- **TC9: Password Reset**
  - Steps:
    1. Request password reset
    2. Follow link in email
    3. Set new password
  - Expected: Password is changed, user can log in with new password

## 4. Test Environment Setup

### Development Environment

- Setup mock API responses for consistent testing
- Create test user accounts with various states:
  - Standard user
  - Admin user
  - Unverified user
  - Locked user (exceeding login attempts)

### Testing Tools

- Jest for unit tests
- React Testing Library for component tests
- Cypress for E2E tests
- Manual testing checklist for QA team

## 5. Implementation Progress

### Completed Setup

- ✅ Jest configuration files (`jest.config.js`, `jest.setup.js`)
- ✅ Babel configuration for React/TypeScript testing
- ✅ Mock file handling for Jest
- ✅ Storage mocks (localStorage, sessionStorage)
- ✅ Added test dependencies to `package.json`
- ✅ Created test scripts (`npm test`, `npm run test:watch`, `npm run test:coverage`)

### Implemented Tests

- ✅ Basic AuthContext unit tests
  - ✅ Initialization tests
  - ✅ Login functionality tests (success and error cases)
  - ✅ Logout functionality tests
  - ✅ Registration functionality tests (success and error cases)

### Pending Tests

- API Service unit tests
- Integration tests
- Protected routes tests
- Token refresh tests

## 6. Reporting

For each test phase, create a report documenting:
- Test coverage percentage
- Passed/failed test cases
- Identified bugs with severity ratings
- Performance metrics (login time, token refresh time)

## Implementation Timeline

1. ✅ Setup test environment (1 day) - COMPLETED
2. ▶️ Implement unit tests (2-3 days) - IN PROGRESS
3. ⬜ Implement integration tests (2-3 days)
4. ⬜ Run manual test cases (1-2 days)
5. ⬜ Create test reports and fix identified issues (2-3 days)

Total estimated time: 8-12 days 