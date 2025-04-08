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
          try {
            // Read the file first to ensure we have permission
            const content = fs.readFileSync(sourcePath);
            fs.writeFileSync(destPath, content);
            
            // Fix permissions to ensure readable by all
            fs.chmodSync(destPath, 0644);
            
            // Log success with file size
            const stats = fs.statSync(destPath);
            console.log(`Copied ${file} to /images/ (${(stats.size / 1024).toFixed(2)} KB)`);
          } catch (err) {
            console.error(`Error copying ${file}: ${err.message}`);
          }
        }
      });
      
      // Create additional optimized versions of large images
      try {
        // Create 1x and 2x versions of the logo
        const logoPath = path.join(imagesDir, 'Logo-Yachtstory-WHITE.png');
        if (fs.existsSync(logoPath)) {
          // Copy original to a backup
          const logoContent = fs.readFileSync(logoPath);
          fs.writeFileSync(path.join(imagesDir, 'logo-original.png'), logoContent);
          console.log('Created backup of original logo');
        }
        
        // Create a simplified transparent placeholder for faster loading
        const transparentLogoSvg = `<svg width="200" height="80" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="transparent"/><text x="10" y="40" font-family="Arial" font-size="24" fill="white">YachtStory</text></svg>`;
        fs.writeFileSync(path.join(imagesDir, 'logo-placeholder.svg'), transparentLogoSvg);
        console.log('Created SVG logo placeholder for faster loading');
      } catch (error) {
        console.error('Error creating optimized images:', error);
      }
    } else {
      console.warn('Images directory not found at ' + publicImagesDir);
    }
    
    // Create a fallback CSS file for images
    const fallbackCss = `
/* Fallback styles for missing images */
body {
  /* Fallback background color if image fails to load */
  background-color: #0066cc !important;
}

/* Low res version of background for quick loading */
body::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0066cc, #004080);
  z-index: -1;
}

/* Progressive loading for background image */
@media (min-width: 768px) {
  body {
    background: url('/images/adminbackground.jpg') no-repeat center center fixed !important;
    background-size: cover !important;
  }
}

/* Logo fallbacks */
.logo {
  content: url('/images/logo-placeholder.svg');
}

.logo.loaded {
  content: url('/images/Logo-Yachtstory-WHITE.png');
}

/* For browsers that don't support content: url() */
img.logo[src*="Logo-Yachtstory-WHITE.png"]:not([src=""]):not(.loaded) {
  opacity: 0;
}
`;
    fs.writeFileSync(path.join(imagesDir, 'fallback.css'), fallbackCss);
    console.log('Created fallback CSS for images');
    
    // Create a file-exists-checker script
    const fileCheckerJs = `
// Image existence checker
(function() {
  // Helper to check if a file exists without caching issues
  window.fileExists = function(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url + '?nocache=' + Date.now();
    });
  };
  
  // Check critical images on load
  document.addEventListener('DOMContentLoaded', async function() {
    console.log('Checking for critical images...');
    
    // Critical images
    const images = [
      '/images/Logo-Yachtstory-WHITE.png',
      '/images/adminbackground.jpg',
      '/images/BLUE HQ.png'
    ];
    
    // Check each image
    for (const src of images) {
      const exists = await window.fileExists(src);
      console.log(\`Image \${src}: \${exists ? 'Available' : 'Missing'}\`);
      
      // Add to diagnostics if available
      if (document.getElementById('image-diagnostics')) {
        const div = document.createElement('div');
        div.innerHTML = \`<span class="\${exists ? 'success' : 'error'}">\${src}: \${exists ? '✓' : '✗'}</span>\`;
        document.getElementById('image-diagnostics').appendChild(div);
      }
    }
  });
})();
`;
    fs.writeFileSync(path.join(distDir, 'file-checker.js'), fileCheckerJs);
    console.log('Created file existence checker script');
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

// Main build script execution
console.log('Starting simplified build script for Vercel...');
console.log('Current working directory:', process.cwd());

// Create dist directory if it doesn't exist
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist', { recursive: true });
  console.log('Created dist directory');
}

// Create support files first (diagnostics JS, fallback CSS, SVG placeholder)
createSupportFiles();

// Try multiple build approaches
let buildSuccessful = false;

// Approach 1: Direct Vite build
try {
  console.log('Attempting build with direct Vite command...');
  const { execSync } = require('child_process');
  
  // Install vite and react plugin if they're not already installed
  try {
    execSync('npm list vite || npm install -D vite@latest @vitejs/plugin-react@latest', { stdio: 'inherit' });
    console.log('Vite packages installed or already present');
  } catch (err) {
    console.error('Error installing Vite packages:', err.message);
    // Continue anyway, they might be installed globally
  }
  
  // Run Vite build
  execSync('npx vite build --config vite.config.cjs', { stdio: 'inherit' });
  
  if (fs.existsSync('dist/index.html')) {
    console.log('Build successful using direct Vite build!');
    buildSuccessful = true;
  }
} catch (err) {
  console.error('Build with direct Vite command failed:', err.message);
}

// Approach 2: Try package.json build script
if (!buildSuccessful) {
  try {
    console.log('Attempting build with package.json build script...');
    const { execSync } = require('child_process');
    execSync('npm run build', { stdio: 'inherit' });
    
    if (fs.existsSync('dist/index.html')) {
      console.log('Build successful using package.json build script!');
      buildSuccessful = true;
    }
  } catch (err) {
    console.error('Build with package.json build script failed:', err.message);
  }
}

// Approach 3: Create fallback HTML
if (!buildSuccessful || !fs.existsSync('dist/index.html')) {
  console.log('Main build approaches failed. Creating fallback index.html...');
  fs.writeFileSync('dist/index.html', createFallbackHTML());
  console.log('Fallback index.html created');
}

// Always copy images - even after successful build to ensure they're available
console.log('Copying images to dist directory...');
copyImages();

// Final check
console.log('Build process completed.');
if (fs.existsSync('dist/index.html')) {
  console.log('✅ index.html exists in dist directory.');
} else {
  console.log('❌ WARNING: No index.html found in dist directory!');
  console.log('Creating final emergency index.html...');
  fs.writeFileSync('dist/index.html', createFallbackHTML());
}

console.log('Vercel build script completed!');

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
console.log(`Build success: ${buildSuccessful}`);
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
console.log(`\n✅ Build script completed ${buildSuccessful ? 'successfully' : 'with errors'}`);
process.exit(buildSuccessful ? 0 : 1); 

/**
 * Copy a file from source to destination
 * @param {string} source Source file path
 * @param {string} destination Destination file path
 * @returns {boolean} Success status
 */
function copyFile(source, destination) {
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Create destination directory if it doesn't exist
    const destDir = path.dirname(destination);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
      console.log(`Created directory: ${destDir}`);
    }
    
    // Copy the file
    fs.copyFileSync(source, destination);
    
    // Set more permissive file permissions (0644)
    fs.chmodSync(destination, 0o644);
    
    console.log(`Successfully copied: ${source} → ${destination}`);
    return true;
  } catch (error) {
    console.error(`Error copying file from ${source} to ${destination}:`, error.message);
    return false;
  }
}

/**
 * Create necessary support files for fallback page
 */
function createSupportFiles() {
  const fs = require('fs');
  const path = require('path');
  
  try {
    // Ensure dist directory exists
    if (!fs.existsSync('dist')) {
      fs.mkdirSync('dist', { recursive: true });
    }
    
    // Create diagnostics JS file
    const jsContent = `// File checker script
document.addEventListener('DOMContentLoaded', function() {
  const debugBtn = document.getElementById('debug-btn');
  const diagnosticsArea = document.getElementById('image-diagnostics');
  
  // Show diagnostics when debug button is clicked
  debugBtn.addEventListener('click', function() {
    if (diagnosticsArea.style.display === 'block') {
      diagnosticsArea.style.display = 'none';
    } else {
      runDiagnostics();
      diagnosticsArea.style.display = 'block';
    }
  });
  
  function runDiagnostics() {
    diagnosticsArea.innerHTML = '<h3>Image File Diagnostics</h3>';
    const filesToCheck = [
      '/images/logo.png',
      '/images/Logo-Yachtstory-WHITE.png',
      '/images/boat-background.jpg',
      '/images/background.jpg',
      '/assets/logo.png',
      '/assets/boat-background.jpg',
      '/logo.png',
      '/background.jpg'
    ];
    
    filesToCheck.forEach(checkFile);
  }
  
  function checkFile(path) {
    fetch(path, { method: 'HEAD' })
      .then(response => {
        const status = response.ok ? '✅' : '❌';
        const statusText = response.ok ? 'Found' : 'Not found';
        addResult(path, status, statusText, response.status, response.headers.get('content-type'));
      })
      .catch(error => {
        addResult(path, '❌', 'Error', 'N/A', error.message);
      });
  }
  
  function addResult(path, status, statusText, statusCode, contentType) {
    const elem = document.createElement('p');
    elem.innerHTML = \`\${status} \${path} - \${statusText} (Status: \${statusCode}, Type: \${contentType || 'unknown'})\`;
    diagnosticsArea.appendChild(elem);
  }
});`;

    // Create images directory if it doesn't exist
    if (!fs.existsSync('dist/images')) {
      fs.mkdirSync('dist/images', { recursive: true });
    }
    
    // Write diagnostic JS file
    fs.writeFileSync('dist/file-checker.js', jsContent);
    console.log('Created diagnostic JS file: dist/file-checker.js');
    
    // Create CSS for progressive image loading
    const cssContent = `
.background-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #051a30;
  background-image: linear-gradient(120deg, #051a30 0%, #0a2c4e 100%);
  background-size: cover;
  background-position: center;
  z-index: -1;
  opacity: 0;
  transition: opacity 0.8s ease-in-out;
}

.background-container.loaded {
  opacity: 1;
}

.progressive-img {
  transition: opacity 0.3s ease-in-out;
}`;
    
    fs.writeFileSync('dist/images/fallback.css', cssContent);
    console.log('Created fallback CSS file: dist/images/fallback.css');
    
    // Create a placeholder SVG logo
    const svgLogo = `<svg width="200" height="60" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="none"/>
  <text x="50%" y="50%" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle">CharterHub</text>
</svg>`;
    
    fs.writeFileSync('dist/images/logo-placeholder.svg', svgLogo);
    console.log('Created placeholder logo: dist/images/logo-placeholder.svg');
    
  } catch (error) {
    console.error('Error creating support files:', error.message);
  }
}

/**
 * Copy images from common locations to dist/images
 */
function copyImages() {
  const fs = require('fs');
  const path = require('path');
  
  const possibleImageLocations = [
    'public/images',
    'src/assets',
    'src/images',
    'assets',
    'public/assets',
    'static/images',
    'static/assets',
    'public'
  ];
  
  // Common image names to look for
  const commonImages = [
    'logo.png',
    'Logo-Yachtstory-WHITE.png',
    'background.jpg',
    'boat-background.jpg',
    'background.webp',
    'background.png',
    'bg.jpg',
    'hero.jpg',
    'boat.jpg',
    'yacht.jpg'
  ];
  
  console.log('Searching for images in common locations...');
  
  // Check for images in predefined locations
  let foundImages = 0;
  for (const location of possibleImageLocations) {
    try {
      if (fs.existsSync(location)) {
        console.log(`Checking ${location} for images...`);
        
        const files = fs.readdirSync(location);
        
        for (const file of files) {
          if (path.extname(file).match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) {
            const sourcePath = path.join(location, file);
            // Replace spaces with hyphens in filenames
            const cleanFileName = file.replace(/\s+/g, '-');
            const destPath = path.join('dist/images', cleanFileName);
            
            if (copyFile(sourcePath, destPath)) {
              foundImages++;
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error accessing ${location}:`, error.message);
    }
  }
  
  // Look for specific common images with exact names
  for (const location of possibleImageLocations) {
    for (const imageName of commonImages) {
      const sourcePath = path.join(location, imageName);
      if (fs.existsSync(sourcePath)) {
        // Replace spaces with hyphens in filenames
        const cleanFileName = imageName.replace(/\s+/g, '-');
        const destPath = path.join('dist/images', cleanFileName);
        
        if (copyFile(sourcePath, destPath)) {
          // Also copy to root as some paths might reference directly
          copyFile(sourcePath, path.join('dist', cleanFileName));
          foundImages++;
        }
      }
    }
  }
  
  console.log(`Found and copied ${foundImages} images to dist/images`);
  
  // If no images found, attempt a recursive search for images (with limits to avoid excessive copying)
  if (foundImages === 0) {
    console.log('No images found in common locations. Attempting recursive search...');
    
    const imageFiles = [];
    const visitedDirs = new Set();
    
    function findImagesRecursive(dir, maxDepth = 3, currentDepth = 0) {
      if (currentDepth > maxDepth || visitedDirs.has(dir) || imageFiles.length >= 50) {
        return;
      }
      
      visitedDirs.add(dir);
      
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory() && 
              !entry.name.startsWith('.') && 
              !entry.name.includes('node_modules') &&
              !entry.name.includes('dist')) {
            findImagesRecursive(fullPath, maxDepth, currentDepth + 1);
          } else if (entry.isFile() && 
                     path.extname(entry.name).match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) {
            imageFiles.push(fullPath);
            
            if (imageFiles.length >= 50) {
              console.log('Reached maximum image count (50). Stopping search.');
              break;
            }
          }
        }
      } catch (error) {
        console.error(`Error searching directory ${dir}:`, error.message);
      }
    }
    
    findImagesRecursive('.');
    
    console.log(`Found ${imageFiles.length} images in recursive search`);
    
    for (const imagePath of imageFiles) {
      const fileName = path.basename(imagePath).replace(/\s+/g, '-');
      const destPath = path.join('dist/images', fileName);
      copyFile(imagePath, destPath);
    }
  }
} 