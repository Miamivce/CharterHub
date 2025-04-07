/* authentication-refactoring.md */
# Authentication Refactoring Plan

This document outlines the step-by-step plan to refactor the authentication system so that both JWT-based and WordPress-based (admin) authentication work seamlessly, while supporting shared services.

---
## 1. Architecture Overview

- **Unified Authentication Adapter:** 
  - Create a centralized adapter (e.g., `auth/adapter.php`) to check both JWT tokens (via Authorization header) and WordPress cookies.
  - The adapter returns a unified user object with properties such as `id`, `role`, `auth_method` (`jwt` vs. `wordpress`), and `permissions`.

- **Shared Services:**
  - All endpoints accessing shared functionality (like customer data or documents) use this unified user object for role-based access control.

---

## 2. Backend Setup

### 2.1 Unified Authentication Adapter

- Create a new component `auth/adapter.php` that:
  - Checks if a JWT is provided (inspect the `Authorization` header for a `Bearer` token) and verifies it using functions in `jwt-fix.php` (e.g., `improved_verify_jwt_token`).
  - Falls back to WordPress authentication by checking relevant cookies (e.g., `wordpress_logged_in_*`).
  - Returns a unified user object with standard properties (ID, role, auth_method, etc.).

### 2.2 Separate Authentication Services

- Implement two services (e.g., as classes or sets of functions):
  - **JWTAuthService:** Handles JWT token generation, validation, token refresh (and proper error handling/logging).
  - **AdminAuthService:** Handles WordPress cookie-based authentication.

Both should return consistent user objects.

### 2.3 Centralized Middleware

- Create middleware to protect endpoints. This middleware should:
  - Call the unified authentication adapter and attach the user object to the request/context.
  - Handle CORS and CSRF (by delegating CSRF token management to a central function, not scattering it across endpoints).

### 2.4 Endpoints Revision

- Update endpoints (e.g., `/auth/me.php`, `/customers/list.php`, etc.) to:
  - Obtain user data from the adapter instead of directly implementing auth logic.
  - Use role-permission checks based on the unified user object.

### 2.5 Testing & Logging Enhancements

- Update logging in authentication functions to indicate which method (JWT or WordPress) was used.
- Add detailed diagnostic logs in the adapter to aid in troubleshooting auth failures.

---

## 3. Frontend Setup

### 3.1 Separate Login Flows

- **Client Login:**
  - Use JWT-based login. Store JWT tokens in local storage and handle token refresh.

- **Admin Login:**
  - Use the existing WordPress login mechanism (cookies should be handled automatically).

### 3.2 Shared Service Integration

- Configure frontend authentication context (e.g., `AuthContext.tsx`) to capture and store the unified user data.
- Update shared services (documents, customer data, etc.) to consume the unified user information for proper role-based access.

---

## 4. Deployment & Environment Configuration

- **Environment Variables:**
  - Ensure JWT secret, allowed origins (CORS), and other auth-related settings are correctly configured in the environment (e.g., `.env` file).
  - For production, set `VITE_USE_JWT=true`, `VITE_WP_API_URL`, and other required variables as per the JWT-SETUP documentation.

- **Server Setup:**
  - Verify that the PHP server is started from the correct directory (especially for endpoints like `/auth/csrf-token.php`).
  - Review and update CORS and CSP headers as needed.

---

## 5. Testing & Iteration

- Integration tests are ongoing. JWT token generation, verification, and refresh mechanisms have been tested via endpoints such as /auth/me.php.
- The unified authentication adapter in backend/auth/adapter.php is implemented and returning a unified user object for both JWT and WordPress cookie-based authentication.
- AdminAuthService has been implemented and is working with WordPress cookies to authenticate admin users.
- Logging and diagnostic outputs have been enhanced in jwt-fix.php and adapter.php for improved troubleshooting.

## Progress

- [x] Unified Authentication Adapter created and integrated.
- [x] AdminAuthService implemented and verified with sample requests.
- [x] JWT improvements (improved_verify_jwt_token) are in place and showing expected diagnostic logs.
- [ ] Frontend integration with the new authentication flow is being tested.
- [ ] Additional endpoint revisions to use the unified adapter are scheduled.

## 6. Documentation & Future Maintenance

- Update all documentation (e.g., README files, setup guides) to reflect the new unified authentication system.
- Clearly document the responsibilities of the unified adapter, separate auth services, and middleware.
- Ensure that future refactorings are simplified by maintaining all authentication logic in centralized modules.

---

*This document is a living plan. Progress will be saved step-by-step as each phase of the implementation is completed.* 