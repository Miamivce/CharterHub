# Authentication System Redesign: Unified JWT Approach

## 1. Analysis of Current Setup

### Current Admin Dashboard (WordPress Cookies)
- **Authentication Flow**: Uses WordPress's native cookie-based authentication
- **Issues**: 
  - Tied to WordPress user management
  - Session handling requires WordPress hooks
  - Non-standard API interactions with REST endpoints
  - Potential security vulnerabilities with cookie storage

### Current Client Dashboard (JWT System)
- **Authentication Flow**: Custom JWT implementation
- **Token Storage**: Using `sessionStorage` (updated from `localStorage`)
- **Issues**:
  - Inconsistencies in token handling and validation
  - Error handling needs improvement
  - Profile updates failing

### Database Structure
- WordPress database with `wp_charterhub_clients` for client users
- WordPress native `wp_users` table for admin users
- Separation causes complexity in user management and authentication logic

## 2. Backend API Enhancement Plan

### Create a Unified JWT Authentication Service
1. **Develop JWT Auth Endpoints**:
   - `/auth/login` - Accept credentials, verify against `wp_charterhub_users`, return JWT with role
   - `/auth/refresh` - Handle token refresh
   - `/auth/validate` - Validate existing tokens

2. **Role-Based Middleware**:
   ```javascript
   // Role-based middleware example
   const requireRole = (roles) => (req, res, next) => {
     const token = req.headers.authorization?.split(' ')[1];
     if (!token) return res.status(401).json({ error: 'No token provided' });
     
     try {
       const decoded = jwt.verify(token, process.env.JWT_SECRET);
       if (!roles.includes(decoded.role)) {
         return res.status(403).json({ error: 'Insufficient permissions' });
       }
       req.user = decoded;
       next();
     } catch (error) {
       return res.status(401).json({ error: 'Invalid token' });
     }
   };
   ```

3. **User Management API**:
   - `/users/profile` - Get/update current user (for both roles)
   - `/users` - Admin-only endpoint to manage all users
   - `/users/:id` - Get specific user (admin can access all, clients only themselves)

## 3. Frontend Authentication Updates

### Admin Dashboard Changes
1. **Remove WordPress Cookie Logic**:
   - Replace WP authentication hooks with JWT pattern
   - Update API calls to include Authorization header

2. **Implement JWT Login Flow**:
   ```javascript
   const login = async (email, password) => {
     try {
       const response = await api.post('/auth/login', { email, password });
       const { token, user } = response.data;
       
       sessionStorage.setItem('auth_token', token);
       setUser(user);
       
       // Redirect based on role
       if (user.role === 'admin') {
         navigate('/admin/dashboard');
       }
     } catch (error) {
       setError('Authentication failed');
     }
   };
   ```

3. **Add Authorization Interceptor**:
   ```javascript
   api.interceptors.request.use(config => {
     const token = sessionStorage.getItem('auth_token');
     if (token) {
       config.headers.Authorization = `Bearer ${token}`;
     }
     return config;
   });
   ```

### Client Dashboard Updates
1. **Minor Refinements**:
   - Ensure consistent token handling
   - Update endpoints if necessary
   - Enhance error handling

## 4. Database Structure Changes

### Create/Update User Table
1. **New Schema for `wp_charterhub_users`**:
   ```sql
   CREATE TABLE wp_charterhub_users (
     id INT AUTO_INCREMENT PRIMARY KEY,
     email VARCHAR(255) UNIQUE NOT NULL,
     password VARCHAR(255) NOT NULL,
     first_name VARCHAR(100) NOT NULL,
     last_name VARCHAR(100) NOT NULL,
     phone_number VARCHAR(50),
     company VARCHAR(255),
     role ENUM('admin', 'client') NOT NULL DEFAULT 'client',
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
   );
   ```

2. **Migration Strategy**:
   - Create new table
   - Migrate client data from `wp_charterhub_clients`
   - Create admin users from `wp_users` (or manually)
   - Validate data integrity
   - Switch to new table in the API
   - Eventually remove old table

## 5. WordPress Coexistence Strategy

1. **Database Isolation**:
   - Keep WordPress tables intact
   - Use table prefixes for disambiguation

2. **Admin Sync Option** (if needed):
   - Implement a sync service for admins that need WordPress access
   - Trigger WordPress user creation when admin user is created

3. **Avoid WordPress Functions**:
   - Don't use WordPress auth functions in the API
   - Use direct database connections instead

## 6. Future Feature Integration Plan

1. **Documents System**:
   ```sql
   CREATE TABLE wp_charterhub_documents (
     id INT AUTO_INCREMENT PRIMARY KEY,
     user_id INT NOT NULL,
     name VARCHAR(255) NOT NULL,
     file_path VARCHAR(512) NOT NULL,
     file_type VARCHAR(100) NOT NULL,
     uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (user_id) REFERENCES wp_charterhub_users(id)
   );
   ```

2. **Bookings System**:
   ```sql
   CREATE TABLE wp_charterhub_bookings (
     id INT AUTO_INCREMENT PRIMARY KEY,
     user_id INT NOT NULL,
     title VARCHAR(255) NOT NULL,
     start_date DATETIME NOT NULL,
     end_date DATETIME NOT NULL,
     status ENUM('pending', 'confirmed', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
     details TEXT,
     FOREIGN KEY (user_id) REFERENCES wp_charterhub_users(id)
   );
   ```

## 7. Implementation Roadmap & Cleanup

### Phase 1: Preparation
1. Backup the database
2. Create the new user table structure
3. Set up API endpoints for the new authentication system

### Phase 2: Backend Implementation
1. Implement JWT authentication
2. Create role-based middleware
3. Build user management endpoints
4. Implement data migration scripts

### Phase 3: Frontend Updates
1. Update Admin dashboard with JWT authentication
2. Refine Client dashboard as needed
3. Test both dashboards against the new API

### Phase 4: Testing & Cleanup
1. Comprehensive testing across both platforms
2. Remove deprecated code and endpoints
3. Document the new authentication flow

## Additional Security Considerations

1. **Token Security**:
   - Short expiration times (e.g., 15-30 minutes)
   - Refresh token rotation
   - HTTPS for all communications

2. **Password Security**:
   - Bcrypt for password hashing
   - Password strength requirements
   - Account lockout after failed attempts

3. **CORS and Request Validation**:
   - Strict CORS policies
   - Input validation on all endpoints
   - Rate limiting for authentication endpoints 