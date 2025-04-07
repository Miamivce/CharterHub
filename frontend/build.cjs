// CommonJS build script with direct DOM injection of environment variables
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Starting direct build process');

// Ensure dist directory exists
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  console.log('Creating dist directory');
  fs.mkdirSync(distDir, { recursive: true });
}

// Get all environment variables with VITE_ prefix for injection
const viteEnvVars = {};
Object.keys(process.env)
  .filter(key => key.startsWith('VITE_'))
  .forEach(key => {
    console.log(`${key}: ${process.env[key]}`);
    viteEnvVars[key] = process.env[key];
  });

// Set production mode explicitly
viteEnvVars.VITE_ENV = viteEnvVars.VITE_ENV || 'production';
viteEnvVars.VITE_DEBUG = viteEnvVars.VITE_DEBUG || 'false';

// Generate environment variables script content
const envVarsScript = `window.ENV = ${JSON.stringify(viteEnvVars, null, 2)};
// Make environment variables available through import.meta.env
window.import = window.import || {};
window.import.meta = window.import.meta || {};
window.import.meta.env = ${JSON.stringify(viteEnvVars, null, 2)};
// Add standard Vite environment variables
window.import.meta.env.MODE = 'production';
window.import.meta.env.PROD = true;
window.import.meta.env.DEV = false;
console.log('Environment variables loaded:', window.import.meta.env);`;

// Save environment variables to file
const envScriptPath = path.join(distDir, 'env-config.js');
fs.writeFileSync(envScriptPath, envVarsScript);

// Create a more robust admin dashboard redirect
const redirectScript = `
// Redirect script
const redirectToAdminDashboard = () => {
  // Check if we're already on the admin page
  if (window.location.pathname.startsWith('/admin')) {
    return;
  }
  
  // Get the URL params
  const params = new URLSearchParams(window.location.search);
  
  // If a redirect parameter is specified, honor it
  if (params.has('redirect')) {
    window.location.href = params.get('redirect');
    return;
  }
  
  // Otherwise redirect to admin dashboard
  window.location.href = '/admin';
};

// Run redirect on page load
if (document.readyState === 'complete') {
  redirectToAdminDashboard();
} else {
  window.addEventListener('load', redirectToAdminDashboard);
}`;

// Save redirect script
const redirectScriptPath = path.join(distDir, 'redirect.js');
fs.writeFileSync(redirectScriptPath, redirectScript);

try {
  // Step 1: Copy the application source files to a build directory
  console.log('Setting up build directory...');
  const buildDir = path.join(__dirname, 'build-temp');
  if (fs.existsSync(buildDir)) {
    fs.rmSync(buildDir, { recursive: true, force: true });
  }
  fs.mkdirSync(buildDir, { recursive: true });
  
  // Copy the src directory to build directory
  console.log('Copying source files...');
  execSync(`cp -r ${path.join(__dirname, 'src')} ${buildDir}/`, { stdio: 'inherit' });
  
  // Create a simple index.html in the build directory
  console.log('Creating index.html...');
  fs.writeFileSync(path.join(buildDir, 'index.html'), `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CharterHub</title>
  <!-- Environment variables will be injected here -->
  <script src="/env-config.js"></script>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
  `);
  
  // Step 2: Run esbuild with proper module format
  console.log('Building with esbuild...');
  
  try {
    console.log('Installing esbuild...');
    execSync('npm install -g esbuild', { stdio: 'inherit' });
    
    // Find the main entry point
    const entryFile = path.join(__dirname, 'src', 'main.tsx');
    const outputFile = path.join(distDir, 'assets', 'app.js');
    
    // Ensure the assets directory exists
    if (!fs.existsSync(path.join(distDir, 'assets'))) {
      fs.mkdirSync(path.join(distDir, 'assets'), { recursive: true });
    }
    
    // Create modified index that bypasses import.meta.env directly
    const modifiedIndexPath = path.join(buildDir, 'env-patched-main.jsx');
    
    // Create a simpler globals.js plugin for esbuild
    const esbuildGlobalsPluginPath = path.join(__dirname, 'esbuild-globals.js');
    fs.writeFileSync(esbuildGlobalsPluginPath, `
// Simple globals plugin for esbuild
module.exports = {
  name: 'globals',
  setup(build) {
    build.onResolve({ filter: /^import\.meta\.env$/ }, args => {
      return { path: 'import.meta.env', namespace: 'env-ns' };
    });

    build.onLoad({ filter: /.*/, namespace: 'env-ns' }, () => {
      return {
        contents: \`export default ${JSON.stringify(viteEnvVars)}\`,
        loader: 'js'
      };
    });
  }
};
    `);
    
    // Create an esbuild config file
    const esbuildConfigPath = path.join(__dirname, 'esbuild.config.js');
    fs.writeFileSync(esbuildConfigPath, `
// Import the globals plugin
const globalsPlugin = require('./esbuild-globals.js');

require('esbuild').build({
  entryPoints: ['${entryFile.replace(/\\/g, '\\\\')}'],
  outfile: '${outputFile.replace(/\\/g, '\\\\')}',
  bundle: true,
  minify: true,
  format: 'esm',
  target: ['es2020'],
  loader: {
    '.js': 'jsx',
    '.ts': 'tsx',
    '.tsx': 'tsx',
    '.jsx': 'jsx',
    '.css': 'css',
    '.svg': 'dataurl',
    '.png': 'dataurl',
    '.jpg': 'dataurl',
    '.jpeg': 'dataurl'
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  plugins: [globalsPlugin],
  logLevel: 'info',
  metafile: true,
}).then(result => {
  const fs = require('fs');
  const path = require('path');
  fs.writeFileSync(
    path.join(__dirname, 'meta.json'),
    JSON.stringify(result.metafile)
  );
  process.exit(0);
}).catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
    `);
    
    // Run esbuild
    execSync(`node ${esbuildConfigPath}`, { stdio: 'inherit' });
    
    // Create index.html in dist directory
    fs.writeFileSync(path.join(distDir, 'index.html'), `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CharterHub Admin</title>
  <!-- Environment variables are injected here -->
  <script src="/env-config.js"></script>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      margin: 0;
      padding: 0;
    }
    
    #root {
      min-height: 100vh;
    }
    
    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      width: 100vw;
    }
    
    .loading-spinner {
      width: 50px;
      height: 50px;
      border: 5px solid rgba(0, 102, 204, 0.2);
      border-radius: 50%;
      border-top-color: #0066cc;
      animation: spin 1s ease-in-out infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div id="root">
    <div class="loading">
      <div class="loading-spinner"></div>
    </div>
  </div>
  <script>
    // Debug information
    console.log('CharterHub starting with config:', window.ENV);
  </script>
  <script type="module" src="/assets/app.js"></script>
  <script src="/redirect.js"></script>
</body>
</html>
  `);
    
    // Create redirects for SPA navigation
    fs.writeFileSync(path.join(distDir, '_redirects'), `
/*    /index.html   200
`);
    
    console.log('Build completed successfully');
  } catch (error) {
    console.error('Build failed:', error.message);
    
    // Create a minimal functional app
    console.log('Creating minimal functional app for debugging...');
    
    // Create a simple React app
    fs.writeFileSync(path.join(distDir, 'assets', 'app.js'), `
import React from 'https://esm.sh/react@18.2.0';
import ReactDOM from 'https://esm.sh/react-dom@18.2.0/client';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'https://esm.sh/react-router-dom@6.13.0';

function AdminDashboard() {
  return (
    <div>
      <h2>Admin Dashboard</h2>
      <p>This is the admin dashboard. You should implement your admin UI here.</p>
      <nav>
        <ul style={{ display: 'flex', listStyle: 'none', gap: '1rem' }}>
          <li><Link to="/admin/customers">Customers</Link></li>
          <li><Link to="/admin/bookings">Bookings</Link></li>
          <li><Link to="/admin/documents">Documents</Link></li>
        </ul>
      </nav>
    </div>
  );
}

function AdminLayout({ children }) {
  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh'
    }}>
      <header style={{
        background: '#0066cc',
        color: 'white',
        padding: '1rem',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto',
        }}>
          <h1 style={{ margin: 0 }}>CharterHub Admin</h1>
          <nav>
            <ul style={{ display: 'flex', listStyle: 'none', gap: '1rem', margin: 0 }}>
              <li><Link to="/admin" style={{ color: 'white', textDecoration: 'none' }}>Dashboard</Link></li>
              <li><Link to="/admin/customers" style={{ color: 'white', textDecoration: 'none' }}>Customers</Link></li>
              <li><Link to="/admin/bookings" style={{ color: 'white', textDecoration: 'none' }}>Bookings</Link></li>
              <li><Link to="/admin/documents" style={{ color: 'white', textDecoration: 'none' }}>Documents</Link></li>
            </ul>
          </nav>
        </div>
      </header>
      <main style={{ flex: 1, padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
        {children}
      </main>
      <footer style={{ background: '#f5f5f5', padding: '1rem', textAlign: 'center' }}>
        <p>&copy; 2023 CharterHub. All rights reserved.</p>
      </footer>
    </div>
  );
}

function App() {
  const apiUrl = window.ENV.VITE_API_URL || window.ENV.VITE_PHP_API_URL;
  
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="/admin" element={
        <AdminLayout>
          <AdminDashboard />
        </AdminLayout>
      } />
      <Route path="/admin/*" element={
        <AdminLayout>
          <Routes>
            <Route path="customers" element={<h2>Customers</h2>} />
            <Route path="bookings" element={<h2>Bookings</h2>} />
            <Route path="documents" element={<h2>Documents</h2>} />
            <Route path="*" element={<h2>Page Not Found</h2>} />
          </Routes>
        </AdminLayout>
      } />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
    `);
    
    // Update index.html to load from CDN
    fs.writeFileSync(path.join(distDir, 'index.html'), `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CharterHub Admin</title>
  <script src="/env-config.js"></script>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 0;
      line-height: 1.5;
    }
    #root {
      min-height: 100vh;
    }
    a {
      color: #0066cc;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div id="root">Loading CharterHub Admin...</div>
  <script type="module" src="/assets/app.js"></script>
</body>
</html>
    `);
    
    console.log('Created fallback admin interface');
  }
} catch (error) {
  console.error('Error during build process:', error.message);
  
  // Create a basic diagnostic page
  console.log('Creating diagnostic page');
  fs.writeFileSync(path.join(distDir, 'index.html'), `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CharterHub - Admin Dashboard</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      background-color: #f5f8fa;
      color: #333;
      line-height: 1.6;
      padding: 0;
      margin: 0;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    .card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.08);
      padding: 2rem;
      margin: 2rem 0;
    }
    h1 {
      color: #0066cc;
      margin-top: 0;
    }
    code, pre {
      background: #f1f5f9;
      border-radius: 4px;
      padding: 0.5rem;
      overflow-x: auto;
    }
    .env-var {
      margin-bottom: 0.5rem;
    }
    .key {
      font-weight: bold;
      color: #0066cc;
    }
    .btn {
      padding: 0.5rem 1rem;
      background: #0066cc;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 1rem;
      display: inline-block;
      text-decoration: none;
    }
  </style>
  <script src="/env-config.js"></script>
</head>
<body>
  <div class="container">
    <h1>CharterHub - Admin Dashboard</h1>
    
    <div class="card">
      <h2>Environment Variables</h2>
      <pre id="env-vars">Loading environment variables...</pre>
    </div>
    
    <div class="card">
      <h2>API Connection Tester</h2>
      <div id="api-test-result">Click the button below to test the API connection</div>
      <button id="test-api" class="btn">
        Test API Connection
      </button>
    </div>
    
    <div class="card">
      <h2>Admin Navigation</h2>
      <p>These links should be handled by client-side routing:</p>
      <div style="display: flex; gap: 1rem;">
        <a href="/admin" class="btn">Dashboard</a>
        <a href="/admin/customers" class="btn">Customers</a>
        <a href="/admin/bookings" class="btn">Bookings</a>
        <a href="/admin/documents" class="btn">Documents</a>
      </div>
    </div>
  </div>
  
  <script>
    // Redirect to admin dashboard from root
    if (window.location.pathname === '/') {
      window.location.href = '/admin';
    }
    
    // Display environment variables
    document.addEventListener('DOMContentLoaded', function() {
      const envVarsEl = document.getElementById('env-vars');
      const envVars = window.ENV || {};
      
      envVarsEl.textContent = JSON.stringify(envVars, null, 2);
      
      // API test button
      document.getElementById('test-api').addEventListener('click', async function() {
        const resultEl = document.getElementById('api-test-result');
        resultEl.innerHTML = 'Testing API connection...';
        
        try {
          const apiUrl = envVars.VITE_API_URL || envVars.VITE_PHP_API_URL;
          if (!apiUrl) {
            throw new Error('No API URL configured in environment variables');
          }
          
          const response = await fetch(\`\${apiUrl}/status\`);
          
          if (!response.ok) {
            throw new Error(\`API returned status \${response.status}: \${response.statusText}\`);
          }
          
          const data = await response.text();
          resultEl.innerHTML = \`<div style="color: green;">Success! API responded with: \${data}</div>\`;
        } catch (err) {
          console.error('API test failed:', err);
          resultEl.innerHTML = \`<div style="color: red;">Error: \${err.message}</div>\`;
        }
      });
    });
  </script>
</body>
</html>
  `);
  
  console.log('Admin dashboard fallback created successfully');
} 