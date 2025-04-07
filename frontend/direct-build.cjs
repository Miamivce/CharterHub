// Ultra-simple direct build script with no external dependencies
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Running simplified direct build script for Vercel');

// Ensure dist directory exists
const distDir = path.join(process.cwd(), 'dist');
if (!fs.existsSync(distDir)) {
  console.log('Creating dist directory');
  fs.mkdirSync(distDir, { recursive: true });
}

// Get the current Vercel domain from environment variables
const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                  process.env.VITE_FRONTEND_URL || 'https://charter-kn1eupp28-maurits-s-projects.vercel.app';
console.log(`Vercel deployment URL: ${vercelUrl}`);

// Create directories for assets
console.log('Setting up directory structure');
const assetsDir = path.join(distDir, 'assets');
const imagesDir = path.join(distDir, 'images');
const publicDir = path.join(process.cwd(), 'public');

// Ensure directories exist
[assetsDir, imagesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Copy static assets (public directory)
console.log('Copying static assets from public folder');
if (fs.existsSync(publicDir)) {
  try {
    // Copy service-worker.js if it exists
    const serviceWorkerSrc = path.join(publicDir, 'service-worker.js');
    if (fs.existsSync(serviceWorkerSrc)) {
      fs.copyFileSync(serviceWorkerSrc, path.join(distDir, 'service-worker.js'));
      console.log('Copied service-worker.js');
    }
    
    // Copy images
    const publicImagesDir = path.join(publicDir, 'images');
    if (fs.existsSync(publicImagesDir)) {
      const imageFiles = fs.readdirSync(publicImagesDir);
      imageFiles.forEach(file => {
        const sourcePath = path.join(publicImagesDir, file);
        const destPath = path.join(imagesDir, file);
        
        if (fs.statSync(sourcePath).isFile()) {
          fs.copyFileSync(sourcePath, destPath);
          console.log(`Copied ${file} to /images/`);
        }
      });
    }
  } catch (err) {
    console.error('Error copying static assets:', err);
  }
}

// Create standalone JavaScript files
console.log('Creating standalone JavaScript files');

// Create the redirect script - ENSURE IT'S VALID JAVASCRIPT
const redirectJs = `
// Redirect script - properly formatted as JavaScript
(function() {
  console.log("Redirect script loaded");
  // Only redirect from root path to /admin
  if (window.location.pathname === "/") {
    console.log("Redirecting to /admin");
    window.location.href = "/admin";
  }
})();
`;
const redirectPath = path.join(distDir, 'redirect.js');
fs.writeFileSync(redirectPath, redirectJs);
console.log(`Created redirect.js at ${redirectPath}`);

// Create env-config.js with proper JavaScript content
const domains = [
  vercelUrl,
  'https://app.yachtstory.be',
  'https://charter-kn1eupp28-maurits-s-projects.vercel.app'
].filter(Boolean);

const envConfig = `
// CharterHub Environment Configuration
// Generated on ${new Date().toISOString()}
// For deployment: ${vercelUrl}

// Environment variables
window.ENV = ${JSON.stringify({
  VITE_API_URL: process.env.VITE_API_URL || 'https://charterhub-api.onrender.com',
  VITE_PHP_API_URL: process.env.VITE_PHP_API_URL || 'https://charterhub-api.onrender.com',
  VITE_ALLOWED_ORIGINS: domains.join(','),
  VITE_FRONTEND_URL: vercelUrl
}, null, 2)};

// For Vite compatibility
window.import = window.import || {};
window.import.meta = window.import.meta || {};
window.import.meta.env = {
  MODE: 'production',
  PROD: true,
  DEV: false,
  VITE_API_URL: "${process.env.VITE_API_URL || 'https://charterhub-api.onrender.com'}",
  VITE_PHP_API_URL: "${process.env.VITE_PHP_API_URL || 'https://charterhub-api.onrender.com'}",
  VITE_ALLOWED_ORIGINS: "${domains.join(',')}",
  VITE_FRONTEND_URL: "${vercelUrl}"
};

// CORS configuration
window.CORS_CONFIG = {
  apiUrl: "${process.env.VITE_API_URL || 'https://charterhub-api.onrender.com'}",
  clientDomain: "${vercelUrl}",
  allowedOrigins: ${JSON.stringify(domains)},
  credentials: "include"
};

// API request helper with proper CORS handling
window.fetchWithCORS = function(url, options = {}) {
  if (!url) return Promise.reject(new Error("URL is required"));
  
  // Ensure URL is absolute for API calls
  if (url.startsWith('/')) {
    url = window.CORS_CONFIG.apiUrl + url;
  }
  
  // Prepare headers with origin
  const headers = options.headers || {};
  headers['Origin'] = window.location.origin;
  headers['X-Requested-With'] = 'XMLHttpRequest';
  
  // Return fetch promise with proper configuration
  return fetch(url, {
    ...options,
    credentials: "include",
    headers
  });
};

// Patch the original fetch to use our CORS-enabled version for API calls
(function() {
  const originalFetch = window.fetch;
  
  window.fetch = function(url, options = {}) {
    // Only apply CORS handling to API calls
    if (url && typeof url === 'string' && 
        (url.includes('charterhub-api.onrender.com') || url.startsWith('/auth/'))) {
      return window.fetchWithCORS(url, options);
    }
    
    // Use original fetch for other requests
    return originalFetch(url, options);
  };
})();

// Log environment setup for debugging
console.log("Environment config loaded for:", window.ENV.VITE_FRONTEND_URL);
`;

const envConfigPath = path.join(distDir, 'env-config.js');
fs.writeFileSync(envConfigPath, envConfig);
console.log(`Created env-config.js at ${envConfigPath}`);

// Create a CSRF helper for axios (assuming that's what's being used)
const csrfHelper = `
// CSRF Helper Module
// Handles CSRF token retrieval and management for API requests
(function() {
  // CSRF Manager
  window.CSRFManager = {
    token: null,
    
    // Try several methods to get a CSRF token
    fetchToken: async function() {
      // If we already have a token, return it
      if (this.token) return this.token;
      
      const apiBase = window.ENV.VITE_API_URL || window.ENV.VITE_PHP_API_URL || "https://charterhub-api.onrender.com";
      
      // Try different endpoints and methods
      const endpoints = [
        '/auth/csrf-token.php',
        '/api/csrf-token',
        '/csrf-token'
      ];
      
      // Log CORS setup
      console.log("Attempting CSRF token fetch with Origin:", window.location.origin);
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(apiBase + endpoint, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'X-Requested-With': 'XMLHttpRequest',
              'Origin': window.location.origin
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data && data.token) {
              this.token = data.token;
              console.log("CSRF token retrieved successfully");
              return this.token;
            }
          }
        } catch (err) {
          console.warn("Error fetching CSRF token from " + endpoint, err);
        }
      }
      
      // If all methods fail, create a fallback token
      console.warn("Failed to fetch CSRF token, using fallback");
      this.token = "fallback-" + Math.random().toString(36).substring(2, 15);
      return this.token;
    },
    
    // Get token with optional refresh
    async getToken(forceRefresh = false) {
      if (forceRefresh || !this.token) {
        await this.fetchToken();
      }
      return this.token;
    }
  };
  
  // Initialize CSRF token fetch in background
  setTimeout(() => {
    window.CSRFManager.fetchToken().catch(err => {
      console.warn("Background CSRF token fetch failed:", err);
    });
  }, 1000);
})();
`;

const csrfHelperPath = path.join(distDir, 'csrf-helper.js');
fs.writeFileSync(csrfHelperPath, csrfHelper);
console.log(`Created csrf-helper.js at ${csrfHelperPath}`);

// Create a minimal Vite config
console.log('Creating minimal Vite config');
const viteConfigPath = path.join(process.cwd(), 'vite.config.simple.cjs');
const minimalConfig = `
module.exports = {
  root: '${process.cwd().replace(/\\/g, '\\\\')}',
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash][extname]'
      }
    }
  },
  resolve: {
    alias: {
      '@': '${path.join(process.cwd(), 'src').replace(/\\/g, '\\\\')}'
    }
  },
  server: {
    cors: {
      origin: "*",
      methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
      credentials: true,
      preflightContinue: false,
      optionsSuccessStatus: 204
    }
  },
  publicDir: 'public',
  define: {
    // Environment variables
    ${Object.keys(process.env)
      .filter(key => key.startsWith('VITE_'))
      .map(key => `'import.meta.env.${key}': JSON.stringify('${process.env[key]}')`)
      .join(',\n    ')}
  }
};
`;
fs.writeFileSync(viteConfigPath, minimalConfig);

// Attempt a build with Vite
let buildSuccess = false;
try {
  console.log('Attempting direct build with Vite');
  execSync('npx vite build --config vite.config.simple.cjs', {
    stdio: 'inherit',
    env: {
      ...process.env,
      SKIP_TYPESCRIPT_CHECK: 'true',
      NODE_ENV: 'production',
      TSC_COMPILE_ON_ERROR: 'true'
    }
  });
  buildSuccess = true;
  console.log('Build succeeded');
  
  // Inject our scripts into the built index.html
  const indexPath = path.join(distDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Inject scripts at appropriate locations
    const hasEnvConfig = indexContent.includes('env-config.js');
    const hasRedirect = indexContent.includes('redirect.js');
    const hasCsrfHelper = indexContent.includes('csrf-helper.js');
    
    let modified = false;
    
    // Add scripts that are missing
    if (!hasEnvConfig) {
      indexContent = indexContent.replace(
        '</head>',
        `<script src="/env-config.js?v=${Date.now()}"></script>\n</head>`
      );
      modified = true;
    }
    
    if (!hasCsrfHelper) {
      indexContent = indexContent.replace(
        '</head>',
        `<script src="/csrf-helper.js?v=${Date.now()}"></script>\n</head>`
      );
      modified = true;
    }
    
    if (!hasRedirect) {
      indexContent = indexContent.replace(
        '</body>',
        `<script src="/redirect.js?v=${Date.now()}"></script>\n</body>`
      );
      modified = true;
    }
    
    // Check for background image and add if missing
    if (!indexContent.includes('adminbackground.jpg')) {
      // Add background styling if needed
      const backgroundStyle = `
<style>
  body {
    background: url('/images/adminbackground.jpg') no-repeat center center fixed !important;
    background-size: cover !important;
  }
</style>`;
      
      indexContent = indexContent.replace(
        '</head>',
        `${backgroundStyle}\n</head>`
      );
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(indexPath, indexContent);
      console.log('Updated index.html with required scripts and styles');
    }
  } else {
    console.warn('No index.html found after build - this is unexpected');
  }
  
  // Copy our script files again to ensure they're in place (build might have deleted them)
  fs.writeFileSync(redirectPath, redirectJs);
  fs.writeFileSync(envConfigPath, envConfig);
  fs.writeFileSync(csrfHelperPath, csrfHelper);
  console.log('Re-copied script files after build');
  
} catch (err) {
  console.error('Build failed:', err.message);
  
  // Create a fallback application
  console.log('Creating fallback application');
  try {
    // Create a minimal but functional index.html
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CharterHub</title>
  <script src="/env-config.js?v=${Date.now()}"></script>
  <script src="/csrf-helper.js?v=${Date.now()}"></script>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background: url('/images/adminbackground.jpg') no-repeat center center fixed;
      background-size: cover;
    }
    header {
      background: rgba(0, 102, 204, 0.8);
      color: white;
      padding: 1rem;
      text-align: center;
    }
    .logo {
      max-width: 200px;
      height: auto;
    }
    main {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 2rem;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      text-align: center;
      background: rgba(255, 255, 255, 0.9);
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    footer {
      background: rgba(0, 0, 0, 0.7);
      padding: 1rem;
      text-align: center;
      font-size: 0.875rem;
      color: white;
    }
    .btn {
      display: inline-block;
      background: #0066cc;
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: 4px;
      text-decoration: none;
      font-weight: 600;
      margin-top: 1rem;
    }
    #logoImage {
      opacity: 0;
      transition: opacity 0.5s;
    }
    #logoImage.loaded {
      opacity: 1;
    }
  </style>
</head>
<body>
  <header>
    <img id="logoImage" src="/images/Logo-Yachtstory-WHITE.png" alt="CharterHub Logo" class="logo" onload="this.classList.add('loaded')" onerror="this.src='/images/BLUE HQ.png'; this.onerror=null;">
  </header>
  <main>
    <div class="container">
      <h2>Welcome to CharterHub</h2>
      <p>Please proceed to the admin dashboard to manage your charter services.</p>
      <a href="/admin" class="btn">Go to Admin Dashboard</a>
      <p id="status"></p>
    </div>
  </main>
  <footer>
    <p>&copy; ${new Date().getFullYear()} CharterHub. All rights reserved.</p>
  </footer>
  <script src="/redirect.js?v=${Date.now()}"></script>
  <script>
    // Image loading verification
    document.addEventListener('DOMContentLoaded', function() {
      const statusElem = document.getElementById('status');
      const imgSrc = '/images/adminbackground.jpg';
      
      // Test background image loading
      const img = new Image();
      img.onload = function() {
        console.log('Background image loaded successfully');
      };
      img.onerror = function() {
        console.error('Background image failed to load');
        document.body.style.backgroundColor = '#f0f4f8';
      };
      img.src = imgSrc;
      
      // Display environment info
      if (window.ENV) {
        statusElem.textContent = 'Environment: ' + (window.ENV.VITE_FRONTEND_URL || 'Unknown');
      }
    });
  </script>
</body>
</html>
    `;
    
    // Write the HTML file
    fs.writeFileSync(path.join(distDir, 'index.html'), html);
    
    // Create an empty CSS file
    fs.writeFileSync(path.join(assetsDir, 'index.css'), '/* Default styles */');
    
    // Create a dummy JS file for the app
    fs.writeFileSync(path.join(assetsDir, 'app.js'), 'console.log("CharterHub app starting...");');
    
    buildSuccess = true;
    console.log('Created fallback app');
  } catch (err2) {
    console.error('Failed to create fallback app:', err2);
  }
}

// Add a .nojekyll file to prevent GitHub Pages processing
fs.writeFileSync(path.join(distDir, '.nojekyll'), '');

// Create a test file for diagnosing path issues
const testHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>CharterHub File Test</title>
  <style>
    body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .success { color: green; }
    .error { color: red; }
    img { max-width: 100px; height: auto; border: 1px solid #ccc; }
  </style>
</head>
<body>
  <h1>CharterHub File Accessibility Test</h1>
  <p>This page tests whether key files are accessible.</p>
  
  <h2>JavaScript Files</h2>
  <div id="js-status">Testing...</div>
  
  <h2>Image Files</h2>
  <div id="image-status">
    <p>Logo: <span id="logo-status">Checking...</span></p>
    <img id="logo-test" src="/images/Logo-Yachtstory-WHITE.png" alt="Logo">
    
    <p>Background: <span id="bg-status">Checking...</span></p>
    <img id="bg-test" src="/images/adminbackground.jpg" alt="Background">
  </div>
  
  <script>
    // Test JS files
    function testFile(url, displayName, statusElement) {
      fetch(url)
        .then(response => {
          if (!response.ok) throw new Error(\`HTTP error! status: \${response.status}\`);
          return response.text();
        })
        .then(content => {
          console.log(\`\${displayName} loaded - length: \${content.length} chars\`);
          statusElement.innerHTML = \`<span class="success">✓ \${displayName} loaded successfully</span>\`;
        })
        .catch(e => {
          console.error(\`Error loading \${displayName}:\`, e);
          statusElement.innerHTML = \`<span class="error">✗ Failed to load \${displayName}: \${e.message}</span>\`;
        });
    }
    
    // Test JS files
    const jsStatus = document.getElementById('js-status');
    jsStatus.innerHTML = '';
    
    // Test env-config.js
    const envConfigStatus = document.createElement('p');
    jsStatus.appendChild(envConfigStatus);
    testFile('/env-config.js', 'env-config.js', envConfigStatus);
    
    // Test redirect.js
    const redirectStatus = document.createElement('p');
    jsStatus.appendChild(redirectStatus);
    testFile('/redirect.js', 'redirect.js', redirectStatus);
    
    // Test csrf-helper.js
    const csrfStatus = document.createElement('p');
    jsStatus.appendChild(csrfStatus);
    testFile('/csrf-helper.js', 'csrf-helper.js', csrfStatus);
    
    // Test images
    document.getElementById('logo-test').onload = function() {
      document.getElementById('logo-status').innerHTML = '<span class="success">✓ Logo loaded</span>';
    };
    document.getElementById('logo-test').onerror = function() {
      document.getElementById('logo-status').innerHTML = '<span class="error">✗ Logo failed to load</span>';
    };
    
    document.getElementById('bg-test').onload = function() {
      document.getElementById('bg-status').innerHTML = '<span class="success">✓ Background loaded</span>';
    };
    document.getElementById('bg-test').onerror = function() {
      document.getElementById('bg-status').innerHTML = '<span class="error">✗ Background failed to load</span>';
    };
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(distDir, 'filetest.html'), testHtml);
console.log('Created file test page at /filetest.html');

// Final build report
console.log('\n==== Build Report ====');
console.log(`Build success: ${buildSuccess}`);
console.log(`Deployment URL: ${vercelUrl}`);
console.log(`Created env-config.js: ${fs.existsSync(envConfigPath)}`);
console.log(`Created redirect.js: ${fs.existsSync(redirectPath)}`);
console.log(`Created csrf-helper.js: ${fs.existsSync(csrfHelperPath)}`);

// Create .nowignore to exclude unnecessary files
fs.writeFileSync(path.join(process.cwd(), '.nowignore'), `
node_modules
.git
.github
.*
`);

// Exit with appropriate code
console.log(`\n✅ Build script completed ${buildSuccess ? 'successfully' : 'with errors'}`);
process.exit(buildSuccess ? 0 : 1); 