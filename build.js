// Simple build script to be run by Vercel
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting build process...');

// Create frontend/dist if it doesn't exist
const distDir = path.join(__dirname, 'frontend', 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Create essential JavaScript files in dist directory
console.log('Creating essential files...');

// Create env-config.js
const envConfig = `
window.ENV = {
  VITE_API_URL: "https://charterhub-api.onrender.com",
  VITE_PHP_API_URL: "https://charterhub-api.onrender.com",
  VITE_FRONTEND_URL: "https://charter-hub.vercel.app",
  VITE_ADMIN_URL: "https://admin.yachtstory.be",
  VITE_ALLOWED_ORIGINS: "https://charter-hub.vercel.app,https://admin.yachtstory.be,https://app.yachtstory.be"
};
console.log('Environment config loaded');
`;
fs.writeFileSync(path.join(distDir, 'env-config.js'), envConfig);

// Create redirect.js
const redirectJs = `
// Redirect script for admin domain
(function() {
  const hostname = window.location.hostname;
  if (hostname === 'admin.yachtstory.be' && location.pathname === '/') {
    window.location.href = '/admin';
  }
})();
`;
fs.writeFileSync(path.join(distDir, 'redirect.js'), redirectJs);

// Create a simple index.html if it doesn't exist
const indexPath = path.join(distDir, 'index.html');
if (!fs.existsSync(indexPath)) {
  const indexHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CharterHub</title>
  <script src="/env-config.js"></script>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
    .container { max-width: 800px; margin: 0 auto; }
    h1 { color: #0066cc; }
  </style>
</head>
<body>
  <div class="container">
    <h1>CharterHub</h1>
    <p>CharterHub is available at <a href="https://charter-hub.vercel.app">https://charter-hub.vercel.app</a></p>
  </div>
  <script src="/redirect.js"></script>
</body>
</html>
  `;
  fs.writeFileSync(indexPath, indexHtml);
}

console.log('Build completed successfully!'); 