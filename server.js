// Simple Express server to handle serving the SPA
const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

// Paths to build directories
const frontendDistPath = path.join(__dirname, 'frontend', 'dist');
const fallbackDistPath = path.join(__dirname, 'dist');

// Determine which path exists
const distPath = fs.existsSync(frontendDistPath) ? frontendDistPath : fallbackDistPath;

console.log(`Serving from: ${distPath}`);

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

// Special handling for env-config.js
app.get('/env-config.js', (req, res) => {
  res.set('Content-Type', 'application/javascript; charset=utf-8');
  
  const filePath = path.join(distPath, 'env-config.js');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    // Generate the file on the fly if it doesn't exist
    const content = `
      window.ENV = {
        VITE_API_URL: "https://charterhub-api.onrender.com",
        VITE_PHP_API_URL: "https://charterhub-api.onrender.com",
        VITE_FRONTEND_URL: "https://charter-hub.vercel.app",
        VITE_ADMIN_URL: "https://admin.yachtstory.be",
        VITE_ALLOWED_ORIGINS: "https://charter-hub.vercel.app,https://admin.yachtstory.be,https://app.yachtstory.be"
      };
      console.log('Environment config loaded');
    `;
    res.send(content);
  }
});

// Special handling for redirect.js
app.get('/redirect.js', (req, res) => {
  res.set('Content-Type', 'application/javascript; charset=utf-8');
  
  const filePath = path.join(distPath, 'redirect.js');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    // Generate the file on the fly if it doesn't exist
    const content = `
      // Redirect script for admin domain
      (function() {
        const hostname = window.location.hostname;
        const pathname = window.location.pathname;
        
        if (hostname === 'admin.yachtstory.be' && pathname === '/') {
          window.location.href = '/admin';
        }
      })();
    `;
    res.send(content);
  }
});

// Static file serving
app.use(express.static(distPath, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
    }
  }
}));

// Fallback for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 