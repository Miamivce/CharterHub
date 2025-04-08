// Redirect script for CharterHub
(function() {
  // Only redirect from root path to /admin
  if (window.location.pathname === '/') {
    console.log('Redirecting to admin dashboard');
    window.location.href = '/admin';
  }
})(); 