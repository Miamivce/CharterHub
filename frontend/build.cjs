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

// Generate environment variables script content
const envVarsScript = `window.ENV = ${JSON.stringify(viteEnvVars, null, 2)};
// Make environment variables available through import.meta.env
window.import = window.import || {};
window.import.meta = window.import.meta || {};
window.import.meta.env = ${JSON.stringify(viteEnvVars, null, 2)};
console.log('Environment variables loaded:', window.import.meta.env);`;

// Save environment variables to file
const envScriptPath = path.join(distDir, 'env-config.js');
fs.writeFileSync(envScriptPath, envVarsScript);

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
    
    // Set up environment variables for globals plugin
    const globalImports = Object.keys(viteEnvVars).reduce((acc, key) => {
      acc[`import.meta.env.${key}`] = JSON.stringify(viteEnvVars[key]);
      return acc;
    }, {
      'import.meta.env.MODE': '"production"',
      'import.meta.env.DEV': 'false',
      'import.meta.env.PROD': 'true'
    });
    
    // Create globals.js plugin for esbuild
    const esbuildGlobalsPluginPath = path.join(__dirname, 'esbuild-globals.js');
    fs.writeFileSync(esbuildGlobalsPluginPath, `
module.exports = {
  name: 'globals',
  setup(build) {
    const globals = ${JSON.stringify(globalImports, null, 2)};
    
    Object.entries(globals).forEach(([key, value]) => {
      build.onResolve({ filter: new RegExp(key.replace(/\./g, '\\.')) }, args => {
        return { path: args.path, namespace: 'globals' };
      });
      
      build.onLoad({ filter: /.*/, namespace: 'globals' }, () => {
        return { contents: \`export default ${value}\` };
      });
    });
  }
};
    `);
    
    // Create an esbuild config file
    const esbuildConfigPath = path.join(__dirname, 'esbuild.config.js');
    fs.writeFileSync(esbuildConfigPath, `
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
    'process.env.NODE_ENV': '"production"',
    ${Object.keys(viteEnvVars).map(key => 
      `'process.env.${key}': ${JSON.stringify(viteEnvVars[key])}`
    ).join(',\n    ')}
  },
  plugins: [globalsPlugin],
}).catch(() => process.exit(1));
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
  <title>CharterHub</title>
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
</body>
</html>
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
import { BrowserRouter, Routes, Route, Link } from 'https://esm.sh/react-router-dom@6.13.0';

function App() {
  const [apiData, setApiData] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  
  React.useEffect(() => {
    async function testApi() {
      setLoading(true);
      try {
        const apiUrl = window.ENV.VITE_API_URL || window.ENV.VITE_PHP_API_URL;
        if (!apiUrl) {
          throw new Error('No API URL configured');
        }
        
        const response = await fetch(\`\${apiUrl}/status\`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(\`API returned \${response.status}: \${response.statusText}\`);
        }
        
        const data = await response.text();
        setApiData(data);
      } catch (err) {
        console.error('API test failed:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    testApi();
  }, []);
  
  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'system-ui, sans-serif' 
    }}>
      <h1>CharterHub</h1>
      <p>Environment Variables:</p>
      <pre style={{ 
        background: '#f5f5f5', 
        padding: '10px', 
        borderRadius: '4px',
        overflow: 'auto' 
      }}>
        {JSON.stringify(window.ENV, null, 2)}
      </pre>
      
      <h2>API Connection Test</h2>
      {loading && <p>Testing API connection...</p>}
      {error && (
        <div style={{ 
          padding: '10px', 
          background: '#ffebee', 
          color: '#b71c1c',
          borderRadius: '4px',
          marginBottom: '10px' 
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      {apiData && (
        <div style={{ 
          padding: '10px', 
          background: '#e8f5e9', 
          color: '#1b5e20',
          borderRadius: '4px' 
        }}>
          <strong>Success:</strong> {apiData}
        </div>
      )}
      
      <p>
        This is a diagnostic page to verify the environment setup. 
        If you're seeing this instead of the application, there might be 
        issues with the build or environment configuration.
      </p>
    </div>
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
  <title>CharterHub - Diagnostic Mode</title>
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
  </style>
</head>
<body>
  <div id="root">Loading CharterHub diagnostic page...</div>
  <script type="module" src="/assets/app.js"></script>
</body>
</html>
    `);
    
    console.log('Created diagnostic page successfully');
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
  <title>CharterHub - Diagnostic</title>
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
  </style>
  <script src="/env-config.js"></script>
</head>
<body>
  <div class="container">
    <h1>CharterHub - Environment Diagnostic</h1>
    
    <div class="card">
      <h2>Environment Variables</h2>
      <pre id="env-vars">Loading environment variables...</pre>
    </div>
    
    <div class="card">
      <h2>API Connection Tester</h2>
      <div id="api-test-result">Click the button below to test the API connection</div>
      <button id="test-api" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Test API Connection
      </button>
    </div>
  </div>
  
  <script>
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
  
  console.log('Diagnostic page created successfully');
} 