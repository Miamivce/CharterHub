// Ultra-simple Express server for SPA
const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

// Check all possible dist locations
const possibleDistPaths = [
  path.join(__dirname, 'dist'),
  path.join(__dirname, 'frontend', 'dist'),
  path.join(__dirname, 'build'),
  path.join(__dirname, 'frontend', 'build'),
  path.join(__dirname, 'public')
];

// Find the first dist directory that exists
const distPath = possibleDistPaths.find(path => fs.existsSync(path)) || path.join(__dirname, 'dist');

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

// List all files in the dist directory for debugging
console.log('Files in dist directory:');
try {
  const distFiles = fs.readdirSync(distPath);
  distFiles.forEach(file => {
    console.log(` - ${file}`);
  });
} catch (err) {
  console.error(`Error reading dist directory: ${err.message}`);
}

// Serve static files
app.use(express.static(distPath));

// Serve from alternative paths if they exist
possibleDistPaths.forEach(path => {
  if (path !== distPath && fs.existsSync(path)) {
    console.log(`Also serving from alternative path: ${path}`);
    app.use(express.static(path));
  }
});

// SPA fallback
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // Try to find index.html in any of the possible locations
    for (const dir of possibleDistPaths) {
      const altIndexPath = path.join(dir, 'index.html');
      if (fs.existsSync(altIndexPath)) {
        console.log(`Found index.html in alternative location: ${dir}`);
        return res.sendFile(altIndexPath);
      }
    }
    
    // Last resort - generate a simple HTML page
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>CharterHub</title>
          <script src="/env-config.js"></script>
        </head>
        <body>
          <h1>CharterHub</h1>
          <p>Application is running but could not find index.html.</p>
          <script src="/redirect.js"></script>
        </body>
      </html>
    `);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 