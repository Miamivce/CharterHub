/**
 * Domain utilities for CharterHub
 * 
 * This file contains utilities for detecting and handling domain-based routing
 * between admin.yachtstory.be and app.yachtstory.be
 */

// Domain constants
export const ADMIN_DOMAIN = 'admin.yachtstory.be';
export const CLIENT_DOMAIN = 'app.yachtstory.be';

// Role groups for consistent evaluation
export const ADMIN_ROLES = ['admin', 'administrator'];
export const CLIENT_ROLES = ['client', 'user', 'customer'];

/**
 * Check if current hostname is the admin domain
 */
export const isAdminDomain = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return (
    window.location.hostname === ADMIN_DOMAIN || 
    // For development environment, use path-based detection
    (process.env.NODE_ENV === 'development' && window.location.pathname.startsWith('/admin'))
  );
};

/**
 * Check if current hostname is the client domain
 */
export const isClientDomain = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return (
    window.location.hostname === CLIENT_DOMAIN || 
    // For development environment, use path-based detection
    (process.env.NODE_ENV === 'development' && 
      (window.location.pathname.startsWith('/client') || 
       window.location.pathname === '/' || 
       window.location.pathname === '/login'))
  );
};

/**
 * Get the correct base URL for the given role
 */
export const getBaseUrlForRole = (role: string): string => {
  if (process.env.NODE_ENV === 'development') {
    // In development, return path prefixes
    return ADMIN_ROLES.includes(role) ? '/admin' : '/client';
  }
  
  // In production, return full domain URLs
  return ADMIN_ROLES.includes(role) 
    ? `https://${ADMIN_DOMAIN}` 
    : `https://${CLIENT_DOMAIN}`;
};

/**
 * Get the appropriate dashboard URL for a user based on their role
 */
export const getDashboardUrlForRole = (role: string): string => {
  const baseUrl = getBaseUrlForRole(role);
  return `${baseUrl}${baseUrl.includes('://') ? '' : '/'}dashboard`;
};

/**
 * Redirect user to the correct domain based on their role
 */
export const redirectToCorrectDomain = (userRole: string): void => {
  // Skip in development mode
  if (process.env.NODE_ENV === 'development') {
    console.log('[domainUtils] Development mode - skipping domain redirect');
    return;
  }
  
  const isAdmin = ADMIN_ROLES.includes(userRole);
  const onAdminDomain = isAdminDomain();
  const onClientDomain = isClientDomain();
  
  // Admin on client domain - redirect to admin domain
  if (onClientDomain && isAdmin) {
    console.log('[domainUtils] Admin user on client domain - redirecting to admin domain');
    window.location.href = `https://${ADMIN_DOMAIN}`;
    return;
  }
  
  // Client on admin domain - redirect to client domain
  if (onAdminDomain && !isAdmin) {
    console.log('[domainUtils] Client user on admin domain - redirecting to client domain');
    window.location.href = `https://${CLIENT_DOMAIN}`;
    return;
  }
}; 