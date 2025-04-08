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

// Function to copy a file with logging
function copyFileWithLogging(src, dest) {
  if (fs.existsSync(src)) {
    console.log(`Copying ${src} to ${dest}`);
    fs.copyFileSync(src, dest);
    return true;
  } else {
    console.log(`Warning: ${src} not found`);
    return false;
  }
}

// Function to copy a directory recursively
function copyDirectoryRecursive(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) {
    console.log(`Warning: Source directory ${srcDir} not found`);
    return false;
  }

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const files = fs.readdirSync(srcDir);
  for (const file of files) {
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(destDir, file);
    
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      copyDirectoryRecursive(srcPath, destPath);
    } else {
      copyFileWithLogging(srcPath, destPath);
    }
  }
  
  return true;
}

try {
  // Find the correct dist directory
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

  // Create SPA route directories and copy index.html to them
  // This ensures direct access to these routes works even if the SPA routing fails
  const spaRoutes = [
    'login',
    'dashboard',
    'register',
    'admin',
    'profile'
  ];

  // Copy critical files from public directory
  const publicDir = path.join(rootDir, 'public');
  if (fs.existsSync(publicDir)) {
    console.log('Copying files from public directory to dist');
    
    // List of essential files to copy
    const essentialFiles = [
      '404.html',
      '_redirects',
      'test.html',
      'vite.svg',
      'favicon.ico',
      '_vercel_cache_breaker.txt'
    ];
    
    // Copy all essential files
    for (const file of essentialFiles) {
      const srcPath = path.join(publicDir, file);
      const destPath = path.join(distDir, file);
      copyFileWithLogging(srcPath, destPath);
    }
    
    // Copy images directory if it exists
    const imagesDir = path.join(publicDir, 'images');
    if (fs.existsSync(imagesDir)) {
      const destImagesDir = path.join(distDir, 'images');
      console.log('Copying images directory');
      copyDirectoryRecursive(imagesDir, destImagesDir);
    }
  } else {
    console.error('Warning: public directory not found');
  }

  // Create vite.svg fallback if it's missing
  const viteSvgPath = path.join(distDir, 'vite.svg');
  if (!fs.existsSync(viteSvgPath)) {
    console.log('Creating fallback vite.svg');
    const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <path fill="#41B883" d="M16 2L2 16 16 30 30 16 16 2z"/>
  <path fill="#0066cc" d="M16 6L6 16 16 26 26 16 16 6z"/>
  <circle cx="16" cy="16" r="4" fill="#fff"/>
</svg>`;
    fs.writeFileSync(viteSvgPath, fallbackSvg);
  }

  // Update the Vite-generated index.html (but do not replace it)
  const viteGeneratedIndexPath = path.join(distDir, 'index.html');
  if (fs.existsSync(viteGeneratedIndexPath)) {
    console.log('Found Vite-generated index.html, updating scripts...');
    
    let indexContent = fs.readFileSync(viteGeneratedIndexPath, 'utf8');
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
        '</head>',
        `  <script>
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
    
    // Unregister any existing service worker to prevent navigation issues
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for (let registration of registrations) {
          registration.unregister();
          console.log('Service worker unregistered');
        }
      });
    }
  </script>
</head>`
      );
      updated = true;
    }
    
    // Remove any service worker registration code
    if (indexContent.includes('serviceWorker.register')) {
      indexContent = indexContent.replace(
        /navigator\.serviceWorker\.register\([^)]*\)[\s\S]*?[;)]/g,
        'console.log("Service worker registration disabled")'
      );
      updated = true;
    }
    
    if (updated) {
      fs.writeFileSync(viteGeneratedIndexPath, indexContent);
      console.log('Updated index.html with required scripts');
    } else {
      console.log('index.html already has the required scripts');
    }
    
    // Now create directories for SPA routes and copy index.html to them
    console.log('Creating SPA route directories with index.html copies...');
    for (const route of spaRoutes) {
      const routeDir = path.join(distDir, route);
      if (!fs.existsSync(routeDir)) {
        fs.mkdirSync(routeDir, { recursive: true });
      }
      fs.copyFileSync(viteGeneratedIndexPath, path.join(routeDir, 'index.html'));
      console.log(`Created ${route}/index.html`);
    }
    
  } else {
    console.error('Warning: No Vite-generated index.html found. Vite build may have failed.');
    console.error('Ensure the build process is working correctly.');
  }

  console.log('Build completed successfully');
} catch (error) {
  console.error('Error during build:', error);
  process.exit(1);
} 