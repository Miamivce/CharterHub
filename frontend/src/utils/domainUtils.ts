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
 * Log important domain information to console
 * This helps with debugging domain issues in production
 */
export const logDomainInfo = () => {
  if (typeof window === 'undefined') return;
  
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;
  const isProduction = process.env.NODE_ENV === 'production';
  
  console.log('[domainUtils] Environment Info:', {
    hostname,
    pathname,
    isProduction,
    adminDomain: ADMIN_DOMAIN,
    clientDomain: CLIENT_DOMAIN,
    isAdminDomainMatch: hostname === ADMIN_DOMAIN,
    isClientDomainMatch: hostname === CLIENT_DOMAIN,
    userAgent: window.navigator.userAgent
  });
};

/**
 * Check if current hostname is the admin domain
 */
export const isAdminDomain = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname;
  const isProd = process.env.NODE_ENV === 'production';
  const isDevPathBased = process.env.NODE_ENV === 'development' && window.location.pathname.startsWith('/admin');
  const isDomainMatch = hostname === ADMIN_DOMAIN;
  
  // Log detailed info
  console.log('[domainUtils] isAdminDomain check:', {
    hostname,
    ADMIN_DOMAIN,
    isProd,
    isDevPathBased,
    isDomainMatch,
    result: isDomainMatch || isDevPathBased
  });
  
  return (
    isDomainMatch || 
    // For development environment, use path-based detection
    isDevPathBased
  );
};

/**
 * Check if current hostname is the client domain
 */
export const isClientDomain = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;
  const isProd = process.env.NODE_ENV === 'production';
  const isDevPathBased = process.env.NODE_ENV === 'development' && 
    (pathname.startsWith('/client') || pathname === '/' || pathname === '/login');
  const isDomainMatch = hostname === CLIENT_DOMAIN;
  
  // For Vercel deployments on preview URLs
  const isVercelPreview = hostname.includes('vercel.app');
  
  // Log detailed info
  console.log('[domainUtils] isClientDomain check:', {
    hostname,
    CLIENT_DOMAIN,
    isProd,
    isDevPathBased,
    isDomainMatch,
    isVercelPreview,
    pathname,
    result: isDomainMatch || isDevPathBased || (isProd && !hostname.includes('admin') && isVercelPreview)
  });
  
  return (
    isDomainMatch || 
    // For development environment, use path-based detection
    isDevPathBased ||
    // For Vercel preview deployments, assume client domain if not explicitly admin
    (isProd && isVercelPreview && !hostname.includes('admin'))
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
  
  console.log('[domainUtils] redirectToCorrectDomain:', {
    userRole,
    isAdmin,
    onAdminDomain,
    onClientDomain,
    hostname: window.location.hostname,
    shouldRedirect: (onClientDomain && isAdmin) || (onAdminDomain && !isAdmin)
  });
  
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