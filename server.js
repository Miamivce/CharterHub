// Ultra-simple Express server for SPA
const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

// Find the dist directory
const distPath = fs.existsSync(path.join(__dirname, 'frontend', 'dist')) 
  ? path.join(__dirname, 'frontend', 'dist')
  : path.join(__dirname, 'dist');

console.log(`Serving from: ${distPath}`);

// Basic CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Handle critical JS files
app.get('/env-config.js', (req, res) => {
  res.type('application/javascript');
  res.send(`
    window.ENV = {
      VITE_API_URL: "https://charterhub-api.onrender.com",
      VITE_PHP_API_URL: "https://charterhub-api.onrender.com",
      VITE_FRONTEND_URL: "https://charter-hub.vercel.app",
      VITE_ADMIN_URL: "https://admin.yachtstory.be",
      VITE_ALLOWED_ORIGINS: "https://charter-hub.vercel.app,https://admin.yachtstory.be,https://app.yachtstory.be"
    };
    console.log('Environment config loaded');
  `);
});

app.get('/redirect.js', (req, res) => {
  res.type('application/javascript');
  res.send(`
    // Redirect script for admin domain
    (function() {
      const hostname = window.location.hostname;
      if (hostname === 'admin.yachtstory.be' && location.pathname === '/') {
        window.location.href = '/admin';
      }
    })();
  `);
});

// Serve static files
app.use(express.static(distPath));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 