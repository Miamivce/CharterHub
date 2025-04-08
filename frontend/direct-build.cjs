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
  // Find the correct dist directory
  // Since we're running the script from frontend directory, dist should be at frontend/dist
  const rootDir = process.cwd();
  console.log('Current working directory:', rootDir);
  
  const distDir = path.join(rootDir, 'dist');
  console.log('Using dist directory:', distDir);
  
  // Ensure dist directory exists
  if (!fs.existsSync(distDir)) {
    console.log('Creating dist directory');
    fs.mkdirSync(distDir, { recursive: true });
  }

  // Create env-config.js and redirect.js
  const envConfig = createEnvConfigJs();
  const redirectJs = createRedirectJs();

  // Write the files to the dist directory
  fs.writeFileSync(path.join(distDir, 'env-config.js'), envConfig);
  fs.writeFileSync(path.join(distDir, 'redirect.js'), redirectJs);
  console.log('Files written to dist directory');

  // Copy critical files from public directory
  const publicDir = path.join(rootDir, 'public');
  if (fs.existsSync(publicDir)) {
    // Copy 404.html if it exists
    const notFoundPath = path.join(publicDir, '404.html');
    if (fs.existsSync(notFoundPath)) {
      console.log('Copying 404.html to dist directory');
      fs.copyFileSync(notFoundPath, path.join(distDir, '404.html'));
    } else {
      console.log('Warning: 404.html not found in public directory');
    }

    // Copy _redirects if it exists
    const redirectsPath = path.join(publicDir, '_redirects');
    if (fs.existsSync(redirectsPath)) {
      console.log('Copying _redirects to dist directory');
      fs.copyFileSync(redirectsPath, path.join(distDir, '_redirects'));
    } else {
      console.log('Warning: _redirects not found in public directory');
    }

    // Copy test.html if it exists
    const testPath = path.join(publicDir, 'test.html');
    if (fs.existsSync(testPath)) {
      console.log('Copying test.html to dist directory');
      fs.copyFileSync(testPath, path.join(distDir, 'test.html'));
    }
  }

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
    
    // Add SPA redirect handling script if not already there
    if (!indexContent.includes('URLSearchParams')) {
      indexContent = indexContent.replace(
        '</script>',
        '</script>\n    <script>\n      // Handle redirects from 404.html\n      (function() {\n        // Parse the URL parameters\n        var params = new URLSearchParams(window.location.search);\n        var redirectPath = params.get(\'redirect\');\n        \n        // If we have a redirect parameter, navigate to that path\n        if (redirectPath) {\n          // Clean the URL by removing the redirect parameter\n          history.replaceState(null, null, redirectPath);\n        }\n      })();\n    </script>'
      );
      updated = true;
    }
    
    if (updated) {
      fs.writeFileSync(indexPath, indexContent);
      console.log('Updated index.html with script tags and SPA redirect handling');
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
    <script>
      // Handle redirects from 404.html
      (function() {
        // Parse the URL parameters
        var params = new URLSearchParams(window.location.search);
        var redirectPath = params.get('redirect');
        
        // If we have a redirect parameter, navigate to that path
        if (redirectPath) {
          // Clean the URL by removing the redirect parameter
          history.replaceState(null, null, redirectPath);
        }
      })();
    </script>
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