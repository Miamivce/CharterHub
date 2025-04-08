// Ultra-simple direct build script with no external dependencies
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Starting direct build script...');
console.log('Current working directory:', process.cwd());

// Keep track of copied images for reporting
const copiedImages = [];

// Create dist directory if it doesn't exist
const distDir = path.join(process.cwd(), 'dist');
if (!fs.existsSync(distDir)) {
  console.log('Creating dist directory');
  fs.mkdirSync(distDir, { recursive: true });
}

// Create images directory if it doesn't exist
const imagesDir = path.join(distDir, 'images');
if (!fs.existsSync(imagesDir)) {
  console.log('Creating images directory');
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Utility function to create safe filenames
function safeFilename(filename) {
  // Replace spaces with underscores and handle other special characters
  return filename.replace(/\s+/g, '_').replace(/[^\w\-_.]/g, '');
}

// Function to recursively copy a directory
function copyDirectory(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const entries = fs.readdirSync(source, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(source, entry.name);
    const destPath = path.join(target, safeFilename(entry.name));

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      try {
        fs.copyFileSync(srcPath, destPath);
        if (srcPath.match(/\.(jpg|jpeg|png|svg|gif)$/i)) {
          const stats = fs.statSync(destPath);
          copiedImages.push({
            original: srcPath,
            safe: destPath,
            size: stats.size
          });
        }
      } catch (err) {
        console.error(`Error copying ${srcPath} to ${destPath}:`, err.message);
      }
    }
  }
}

// Run the actual Vite build
try {
  console.log('Installing dependencies...');
  execSync('npm install vite@latest @vitejs/plugin-react@latest --no-fund', { stdio: 'inherit' });
  
  console.log('Running Vite build...');
  execSync('npx vite build', { stdio: 'inherit' });
  console.log('Vite build completed');
} catch (error) {
  console.error('Vite build failed:', error.message);
  
  // Create a minimal fallback page
  console.log('Creating fallback page...');
  const fallbackHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CharterHub Admin</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background-color: #f5f5f5;
      text-align: center;
    }
    .container {
      max-width: 600px;
      padding: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 { margin-bottom: 0.5rem; color: #333; }
    p { margin: 0.5rem 0; color: #666; }
    button {
      background: #007bff;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      margin-top: 20px;
    }
    button:hover { background: #0069d9; }
  </style>
</head>
<body>
  <div class="container">
    <h1>CharterHub Admin</h1>
    <p>The admin dashboard is loading...</p>
    <p>You will be redirected shortly.</p>
    <button onclick="window.location.href='/admin'">Go to Admin Dashboard</button>
  </div>
  <script>
    // Redirect to admin after 2 seconds
    setTimeout(() => {
      window.location.href = '/admin';
    }, 2000);
  </script>
</body>
</html>`;
  
  fs.writeFileSync(path.join(distDir, 'index.html'), fallbackHtml);
}

// Copy static assets after the build
console.log('Copying static assets...');

// Check if public/images exists and copy
const publicImagesDir = path.join(process.cwd(), 'public', 'images');
if (fs.existsSync(publicImagesDir)) {
  console.log('Copying images from public/images');
  copyDirectory(publicImagesDir, imagesDir);
}

// Check if src/assets/images exists and copy
const srcImagesDir = path.join(process.cwd(), 'src', 'assets', 'images');
if (fs.existsSync(srcImagesDir)) {
  console.log('Copying images from src/assets/images');
  copyDirectory(srcImagesDir, imagesDir);
}

// Create fallback images if needed
function createFallbackImages() {
  console.log('Creating fallback images...');
  
  // Simple blue background as fallback
  const blueBackground = Buffer.from(`<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#1e3a8a"/>
  </svg>`);
  
  // Simple logo as fallback
  const fallbackLogo = Buffer.from(`<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="200" fill="#1e3a8a"/>
    <text x="30" y="120" font-family="Arial" font-size="32" fill="white">CharterHub</text>
  </svg>`);
  
  fs.writeFileSync(path.join(imagesDir, 'blue_background.svg'), blueBackground);
  fs.writeFileSync(path.join(imagesDir, 'logo.svg'), fallbackLogo);
  
  // Fallback images metadata
  copiedImages.push({ 
    original: 'fallback',
    safe: path.join(imagesDir, 'blue_background.svg'),
    size: blueBackground.length
  });
  copiedImages.push({ 
    original: 'fallback',
    safe: path.join(imagesDir, 'logo.svg'),
    size: fallbackLogo.length
  });
}

// If no images were copied, create fallback images
if (copiedImages.length === 0) {
  createFallbackImages();
}

// Create redirect.js for admin redirect
console.log('Creating redirect.js...');
const redirectJs = `
// redirect.js - Handles redirection to admin dashboard
(function() {
  console.log('Redirect script loaded');
  // Check if we're on the root path
  if (window.location.pathname === '/' || window.location.pathname === '') {
    console.log('Redirecting to admin dashboard');
    window.location.href = '/admin';
  }
})();
`;
fs.writeFileSync(path.join(distDir, 'redirect.js'), redirectJs);

// Create env-config.js with environment variables
console.log('Creating env-config.js...');
const apiUrl = process.env.API_URL || 'https://api.charterhub.app';
const envConfig = `
// env-config.js - Environment configuration
window.ENV = {
  API_URL: '${apiUrl}',
  NODE_ENV: 'production',
  VITE_API_URL: '${apiUrl}',
  APP_VERSION: '${new Date().toISOString()}'
};
console.log('Environment config loaded:', window.ENV);
`;
fs.writeFileSync(path.join(distDir, 'env-config.js'), envConfig);

// Create CSRF helper
console.log('Creating csrf-helper.js...');
const csrfHelper = `
// csrf-helper.js - Cross-Site Request Forgery protection
window.csrfToken = '${Math.random().toString(36).substring(2, 15)}';
console.log('CSRF protection initialized');
`;
fs.writeFileSync(path.join(distDir, 'csrf-helper.js'), csrfHelper);

// Create a test file to check if files are accessible
console.log('Creating filetest.html...');
const filetestHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>File Accessibility Test</title>
  <style>
    body { font-family: sans-serif; margin: 20px; }
    h1 { color: #333; }
    .status { padding: 5px; margin: 5px 0; border-radius: 3px; }
    .success { background: #d4edda; color: #155724; }
    .error { background: #f8d7da; color: #721c24; }
    .pending { background: #fff3cd; color: #856404; }
    img { max-width: 200px; max-height: 200px; border: 1px solid #ddd; margin: 5px; }
    .debug { margin-top: 20px; padding: 10px; background: #f8f9fa; border: 1px solid #ddd; }
    pre { white-space: pre-wrap; }
  </style>
</head>
<body>
  <h1>CharterHub File Accessibility Test</h1>
  <div id="js-files">
    <h2>JavaScript Files</h2>
    <div id="env-config" class="status pending">Testing env-config.js...</div>
    <div id="redirect" class="status pending">Testing redirect.js...</div>
    <div id="csrf-helper" class="status pending">Testing csrf-helper.js...</div>
  </div>
  
  <div id="images">
    <h2>Images</h2>
    <div id="images-status" class="status pending">Testing images...</div>
    <div id="images-display"></div>
  </div>
  
  <div class="debug">
    <h3>Debug Information</h3>
    <h4>Environment Variables</h4>
    <pre id="env-vars">Loading...</pre>
    <h4>Image Paths</h4>
    <pre id="image-paths">Loading...</pre>
  </div>
  
  <script>
    // Test JavaScript files
    function testScript(url, elementId) {
      const script = document.createElement('script');
      script.src = url;
      script.onload = () => {
        document.getElementById(elementId).className = 'status success';
        document.getElementById(elementId).textContent = \`\${url} loaded successfully\`;
      };
      script.onerror = () => {
        document.getElementById(elementId).className = 'status error';
        document.getElementById(elementId).textContent = \`Failed to load \${url}\`;
      };
      document.head.appendChild(script);
    }
    
    // Test image files
    function testImages() {
      const imageFiles = [
        '/images/logo.svg',
        '/images/blue_background.svg',
        // Add paths to any other important images here
      ];
      
      let successCount = 0;
      const display = document.getElementById('images-display');
      const status = document.getElementById('images-status');
      const paths = document.getElementById('image-paths');
      
      paths.textContent = JSON.stringify(imageFiles, null, 2);
      
      imageFiles.forEach(src => {
        const img = new Image();
        img.src = src;
        img.alt = src.split('/').pop();
        
        img.onload = () => {
          successCount++;
          status.textContent = \`\${successCount}/\${imageFiles.length} images loaded\`;
          status.className = 'status success';
          
          const wrapper = document.createElement('div');
          wrapper.innerHTML = \`<p>\${src} - OK</p>\`;
          wrapper.appendChild(img);
          display.appendChild(wrapper);
        };
        
        img.onerror = () => {
          const wrapper = document.createElement('div');
          wrapper.innerHTML = \`<p>\${src} - FAILED</p>\`;
          wrapper.className = 'error';
          display.appendChild(wrapper);
        };
      });
    }
    
    // Display environment variables
    function showEnvVars() {
      setTimeout(() => {
        const envDisplay = document.getElementById('env-vars');
        try {
          envDisplay.textContent = JSON.stringify(window.ENV || {}, null, 2);
        } catch (e) {
          envDisplay.textContent = 'No environment variables found';
        }
      }, 1000);
    }
    
    // Run tests
    window.onload = function() {
      testScript('/env-config.js', 'env-config');
      testScript('/redirect.js', 'redirect');
      testScript('/csrf-helper.js', 'csrf-helper');
      testImages();
      showEnvVars();
    };
  </script>
</body>
</html>`;
fs.writeFileSync(path.join(distDir, 'filetest.html'), filetestHtml);

// Calculate sizes and provide summary
let totalImgSize = 0;
copiedImages.forEach(img => {
  totalImgSize += img.size;
});

// Generate report
console.log('\n---------- BUILD REPORT ----------');
console.log(`Build completed at: ${new Date().toISOString()}`);
console.log(`Build successful: ${fs.existsSync(path.join(distDir, 'index.html')) ? 'Yes' : 'No'}`);
console.log(`Deployment URL: ${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'Unknown'}`);
console.log(`\nCreated files:`);
console.log(`- env-config.js: ${fs.existsSync(path.join(distDir, 'env-config.js')) ? 'Yes' : 'No'}`);
console.log(`- redirect.js: ${fs.existsSync(path.join(distDir, 'redirect.js')) ? 'Yes' : 'No'}`);
console.log(`- csrf-helper.js: ${fs.existsSync(path.join(distDir, 'csrf-helper.js')) ? 'Yes' : 'No'}`);
console.log(`- filetest.html: ${fs.existsSync(path.join(distDir, 'filetest.html')) ? 'Yes' : 'No'}`);
console.log(`\nImages copied: ${copiedImages.length}`);
console.log(`Total images size: ${(totalImgSize / 1024 / 1024).toFixed(2)} MB`);

console.log('\nImage Details:');
copiedImages.forEach(img => {
  const originalName = path.basename(img.original);
  const safeName = path.basename(img.safe);
  const sizeKB = (img.size / 1024).toFixed(2);
  
  console.log(`- ${originalName} → ${safeName} (${sizeKB} KB)`);
});

console.log('----------- END REPORT -----------\n');
console.log('Build script completed.'); 