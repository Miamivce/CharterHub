// Express server for serving the app with proper content types
const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// JavaScript files with explicit content type
app.get('/env-config.js', (req, res) => {
  res.set('Content-Type', 'application/javascript; charset=utf-8');
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('X-Content-Type-Options', 'nosniff');
  
  const filePath = path.join(__dirname, 'dist', 'env-config.js');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    // Generate on the fly if file doesn't exist
    const envConfig = `// Environment variables for CharterHub frontend
window.ENV = {
  VITE_API_URL: "https://charterhub-api.onrender.com",
  VITE_PHP_API_URL: "https://charterhub-api.onrender.com",
  VITE_FRONTEND_URL: "https://charter-hub.vercel.app",
  VITE_ADMIN_URL: "https://admin.yachtstory.be",
  VITE_ALLOWED_ORIGINS: "https://charter-hub.vercel.app,https://admin.yachtstory.be,https://app.yachtstory.be"
};

// Make environment variables available through import.meta.env
window.import = window.import || {};
window.import.meta = window.import.meta || {};
window.import.meta.env = {
  VITE_API_URL: "https://charterhub-api.onrender.com",
  VITE_PHP_API_URL: "https://charterhub-api.onrender.com",
  VITE_FRONTEND_URL: "https://charter-hub.vercel.app",
  VITE_ADMIN_URL: "https://admin.yachtstory.be", 
  VITE_ALLOWED_ORIGINS: "https://charter-hub.vercel.app,https://admin.yachtstory.be,https://app.yachtstory.be",
  MODE: 'production',
  PROD: true,
  DEV: false
};

console.log('Environment config loaded successfully');`;
    res.send(envConfig);
  }
});

app.get('/redirect.js', (req, res) => {
  res.set('Content-Type', 'application/javascript; charset=utf-8');
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('X-Content-Type-Options', 'nosniff');
  
  const filePath = path.join(__dirname, 'dist', 'redirect.js');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    // Generate on the fly if file doesn't exist
    const redirectJs = `// Redirect script for CharterHub
(function() {
  // Only redirect from root path to /admin for admin domain
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;
  
  if (hostname === 'admin.yachtstory.be' && pathname === '/') {
    console.log('Redirecting to admin dashboard');
    window.location.href = '/admin';
  }
})();`;
    res.send(redirectJs);
  }
});

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
    }
  }
}));

// All other routes should serve index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 