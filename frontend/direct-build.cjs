// Simplified direct build script
const fs = require('fs');
const path = require('path');

console.log('Running simplified direct build script for Vercel');

// Function to create env-config.js
function createEnvConfigJs() {
  console.log('Creating env-config.js');
  return `// Environment variables for CharterHub frontend
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
}

// Function to create redirect.js
function createRedirectJs() {
  console.log('Creating redirect.js');
  return `// Redirect script for CharterHub
(function() {
  // Only redirect from root path to /admin for admin domain
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;
  
  if (hostname === 'admin.yachtstory.be' && pathname === '/') {
    console.log('Redirecting to admin dashboard');
    window.location.href = '/admin';
  }
})();`;
}

try {
  // Create env-config.js and redirect.js
  const envConfig = createEnvConfigJs();
  const redirectJs = createRedirectJs();

  // Write files to the correct dist directory 
  const distDir = path.join(process.cwd(), 'dist');
  console.log('Using dist directory:', distDir);
  
  if (!fs.existsSync(distDir)) {
    console.log('Creating dist directory');
    fs.mkdirSync(distDir, { recursive: true });
  }

  // Write the files to the dist directory
  fs.writeFileSync(path.join(distDir, 'env-config.js'), envConfig);
  fs.writeFileSync(path.join(distDir, 'redirect.js'), redirectJs);
  console.log('Files written to dist directory');

  // Update index.html to include these scripts
  const indexPath = path.join(distDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    let updated = false;
    
    // Add env-config.js to head if not already there
    if (!indexContent.includes('env-config.js')) {
      indexContent = indexContent.replace(
        '<head>',
        '<head>\n    <script src="/env-config.js"></script>'
      );
      updated = true;
    }
    
    // Add redirect.js before end of body if not already there
    if (!indexContent.includes('redirect.js')) {
      indexContent = indexContent.replace(
        '</body>',
        '    <script src="/redirect.js"></script>\n  </body>'
      );
      updated = true;
    }
    
    if (updated) {
      fs.writeFileSync(indexPath, indexContent);
      console.log('Updated index.html with script tags');
    } else {
      console.log('index.html already has the required scripts');
    }
  } else {
    console.error('Warning: index.html not found at', indexPath);
    // Create a fallback index.html if needed
    const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <script src="/env-config.js"></script>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Charter Hub</title>
  </head>
  <body>
    <div id="root"></div>
    <script src="/redirect.js"></script>
  </body>
</html>`;
    fs.writeFileSync(indexPath, html);
    console.log('Created fallback index.html');
  }

  console.log('Build completed successfully');
} catch (error) {
  console.error('Error during build:', error);
  process.exit(1);
} 