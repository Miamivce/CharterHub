/**
 * End-to-end tests for the authentication flow
 * These tests cover the core authentication functionality including:
 * - Login
 * - Logout
 * - Protected routes
 * - Role-based access
 */

describe('Authentication Flow', () => {
  // Test users
  const adminUser = {
    email: 'admin@example.com',
    password: 'password123',
    role: 'admin'
  };
  
  const clientUser = {
    email: 'client@example.com',
    password: 'password123',
    role: 'client'
  };
  
  beforeEach(() => {
    // Clear localStorage to ensure clean state
    cy.clearLocalStorage();
    
    // Intercept auth-related API calls
    cy.intercept('POST', '/api/auth/login').as('loginRequest');
    cy.intercept('POST', '/api/auth/logout').as('logoutRequest');
    cy.intercept('GET', '/api/auth/me').as('getUserRequest');
  });
  
  describe('Login Page', () => {
    beforeEach(() => {
      cy.visit('/login');
    });
    
    it('should display login form', () => {
      cy.get('form').should('be.visible');
      cy.get('input[type="email"]').should('be.visible');
      cy.get('input[type="password"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
    });
    
    it('should show validation errors for empty fields', () => {
      cy.get('button[type="submit"]').click();
      cy.get('form').contains('Email is required').should('be.visible');
      cy.get('form').contains('Password is required').should('be.visible');
    });
    
    it('should show error for invalid credentials', () => {
      // Mock failed login response
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 401,
        body: { message: 'Invalid email or password' }
      }).as('failedLogin');
      
      cy.get('input[type="email"]').type('wrong@example.com');
      cy.get('input[type="password"]').type('wrongpassword');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@failedLogin');
      cy.get('form').contains('Invalid email or password').should('be.visible');
    });
    
    it('should redirect to dashboard after successful login as client', () => {
      // Mock successful login response for client
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: { 
          accessToken: 'fake-jwt-token',
          user: {
            id: '123',
            email: clientUser.email,
            firstName: 'Test',
            lastName: 'Client',
            role: clientUser.role
          }
        }
      }).as('successfulLogin');
      
      cy.get('input[type="email"]').type(clientUser.email);
      cy.get('input[type="password"]').type(clientUser.password);
      cy.get('button[type="submit"]').click();
      
      cy.wait('@successfulLogin');
      cy.url().should('include', '/dashboard');
    });
    
    it('should redirect to admin dashboard after successful login as admin', () => {
      // Mock successful login response for admin
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: { 
          accessToken: 'fake-jwt-token',
          user: {
            id: '456',
            email: adminUser.email,
            firstName: 'Test',
            lastName: 'Admin',
            role: adminUser.role
          }
        }
      }).as('successfulLogin');
      
      cy.get('input[type="email"]').type(adminUser.email);
      cy.get('input[type="password"]').type(adminUser.password);
      cy.get('button[type="submit"]').click();
      
      cy.wait('@successfulLogin');
      cy.url().should('include', '/admin/dashboard');
    });
  });
  
  describe('Protected Routes', () => {
    it('should redirect to login when accessing protected route as unauthenticated user', () => {
      cy.visit('/dashboard');
      cy.url().should('include', '/login');
    });
    
    it('should allow access to dashboard for authenticated client', () => {
      // Login as client
      cy.login(clientUser);
      
      // Visit dashboard
      cy.visit('/dashboard');
      cy.url().should('include', '/dashboard');
    });
    
    it('should allow access to admin dashboard for authenticated admin', () => {
      // Login as admin
      cy.login(adminUser);
      
      // Visit admin dashboard
      cy.visit('/admin/dashboard');
      cy.url().should('include', '/admin/dashboard');
    });
    
    it('should redirect client from admin routes to client dashboard', () => {
      // Login as client
      cy.login(clientUser);
      
      // Try to visit admin dashboard
      cy.visit('/admin/dashboard');
      
      // Should be redirected to client dashboard
      cy.url().should('include', '/dashboard');
      cy.url().should('not.include', '/admin');
    });
  });
  
  describe('Logout', () => {
    beforeEach(() => {
      // Login before each test
      cy.login(clientUser);
      
      // Verify we're logged in
      cy.visit('/dashboard');
    });
    
    it('should log out user and redirect to login page', () => {
      // Find and click logout button
      cy.get('button').contains('Logout').click();
      
      // Wait for logout request
      cy.wait('@logoutRequest');
      
      // Should be redirected to login
      cy.url().should('include', '/login');
      
      // LocalStorage should be cleared
      cy.window().then((win) => {
        expect(win.localStorage.getItem('jwt_access_token')).to.be.null;
        expect(win.localStorage.getItem('jwt_user_data')).to.be.null;
      });
      
      // Protected route should redirect to login
      cy.visit('/dashboard');
      cy.url().should('include', '/login');
    });
  });
  
  describe('Token Refresh', () => {
    it('should automatically refresh token when expired', () => {
      // Login
      cy.login(clientUser);
      
      // Mock expired token response followed by successful refresh
      cy.intercept('GET', '/api/users/profile', (req) => {
        req.reply({ statusCode: 401, body: { message: 'Token expired' } });
      }).as('expiredToken');
      
      cy.intercept('POST', '/api/auth/refresh-token', {
        statusCode: 200,
        body: { 
          accessToken: 'new-fake-jwt-token'
        }
      }).as('tokenRefresh');
      
      // After refresh, subsequent requests should succeed
      cy.intercept('GET', '/api/users/profile', {
        statusCode: 200,
        body: { 
          id: '123',
          email: clientUser.email,
          firstName: 'Test',
          lastName: 'Client',
          role: clientUser.role
        }
      }).as('profileRequest');
      
      // Visit profile page
      cy.visit('/profile');
      
      // Wait for token refresh and successful profile request
      cy.wait('@expiredToken');
      cy.wait('@tokenRefresh');
      cy.wait('@profileRequest');
      
      // User should still be on profile page (not redirected to login)
      cy.url().should('include', '/profile');
      
      // LocalStorage should have new token
      cy.window().then((win) => {
        expect(win.localStorage.getItem('jwt_access_token')).to.equal('new-fake-jwt-token');
      });
    });
  });
});

// Add custom commands for testing auth
Cypress.Commands.add('login', (user) => {
  // Mock successful login
  cy.intercept('POST', '/api/auth/login', {
    statusCode: 200,
    body: { 
      accessToken: 'fake-jwt-token',
      user: {
        id: user.role === 'admin' ? '456' : '123',
        email: user.email,
        firstName: 'Test',
        lastName: user.role === 'admin' ? 'Admin' : 'Client',
        role: user.role
      }
    }
  }).as('loginRequest');
  
  // Directly set local storage instead of UI interaction
  cy.window().then((win) => {
    win.localStorage.setItem('jwt_access_token', 'fake-jwt-token');
    win.localStorage.setItem('jwt_user_data', JSON.stringify({
      id: user.role === 'admin' ? '456' : '123',
      email: user.email,
      firstName: 'Test',
      lastName: user.role === 'admin' ? 'Admin' : 'Client',
      role: user.role
    }));
  });
  
  // Verify login worked by visiting home page
  cy.visit('/');
});

Cypress.Commands.add('logout', () => {
  // Clear tokens
  cy.window().then((win) => {
    win.localStorage.removeItem('jwt_access_token');
    win.localStorage.removeItem('jwt_user_data');
  });
  
  // Redirect to login
  cy.visit('/login');
}); 