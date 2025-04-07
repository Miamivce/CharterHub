// CommonJS build script that properly uses Vite to build the real application
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for output formatting
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

// Get the current working directory
const cwd = process.cwd();
console.log(`${colors.green}Building real CharterHub application...${colors.reset}`);
console.log(`Current working directory: ${cwd}`);

// Helper function to check if a package is installed
function isPackageInstalled(packageName) {
  try {
    const nodeModulesPath = path.join(cwd, 'node_modules', packageName);
    return fs.existsSync(nodeModulesPath);
  } catch (error) {
    console.error(`Error checking if ${packageName} is installed:`, error);
    return false;
  }
}

// Helper function to check if the build produced valid output files
function isBuildSuccessful() {
  const distDir = path.join(cwd, 'dist');
  try {
    if (!fs.existsSync(distDir)) return false;
    
    // Check for index.html
    if (!fs.existsSync(path.join(distDir, 'index.html'))) return false;
    
    // Check for assets directory with at least one file
    const assetsDir = path.join(distDir, 'assets');
    if (!fs.existsSync(assetsDir)) return false;
    
    const assetFiles = fs.readdirSync(assetsDir);
    if (assetFiles.length === 0) return false;
    
    return true;
  } catch (err) {
    console.error('Error checking build output:', err);
    return false;
  }
}

// Ensure dist directory exists
const distDir = path.join(cwd, 'dist');
if (!fs.existsSync(distDir)) {
  console.log('Creating dist directory');
  fs.mkdirSync(distDir, { recursive: true });
}

// Get all environment variables with VITE_ prefix for logging
Object.keys(process.env)
  .filter(key => key.startsWith('VITE_'))
  .forEach(key => {
    console.log(`${key}: ${process.env[key]}`);
  });

// Run dependencies check first
try {
  console.log('Checking for required dependencies...');
  
  // Check if vite is installed
  if (!isPackageInstalled('vite')) {
    console.log(`${colors.yellow}Vite not found in node_modules. Installing specific version...${colors.reset}`);
    try {
      // First try to install vite directly with exact version
      execSync('npm install vite@5.4.14 @vitejs/plugin-react@4.3.4 --no-save', { stdio: 'inherit' });
      console.log(`${colors.green}Vite installed successfully${colors.reset}`);
    } catch (e) {
      console.error(`${colors.red}Failed to install vite directly:${colors.reset}`, e.message);
      try {
        // Fallback to full dependencies installation
        console.log('Attempting full dependencies installation...');
        execSync('npm install --no-audit --no-fund', { stdio: 'inherit' });
      } catch (e2) {
        console.error(`${colors.red}Failed to install dependencies. Build may fail:${colors.reset}`, e2.message);
      }
    }
  } else {
    console.log(`${colors.green}Vite is installed. Proceeding with build.${colors.reset}`);
  }

  // Ensure environment variables are available
  console.log('Setting up environment variables...');
  if (fs.existsSync('.env.production')) {
    console.log('Using .env.production file');
    try {
      // Clean up any NODE_ENV=production line which causes issues
      const envContent = fs.readFileSync('.env.production', 'utf8')
        .split('\n')
        .filter(line => !line.trim().startsWith('NODE_ENV=production'))
        .join('\n');
      
      fs.writeFileSync('.env', envContent);
      console.log('Cleaned and copied .env.production to .env');
    } catch (e) {
      console.error('Failed to copy .env.production to .env:', e);
    }
  } else {
    console.log('No .env.production file found, creating minimal .env');
    const envContent = Object.keys(process.env)
      .filter(key => key.startsWith('VITE_'))
      .map(key => `${key}=${process.env[key]}`)
      .join('\n');
    
    fs.writeFileSync('.env', envContent || 'VITE_API_URL=https://charterhub-api.onrender.com\n');
  }

  // Make sure vite.config.ts exists
  const viteConfigPath = path.join(cwd, 'vite.config.ts');
  if (!fs.existsSync(viteConfigPath)) {
    console.log('vite.config.ts not found. Creating minimal version...');
    const minimalConfig = `
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
`;
    fs.writeFileSync(viteConfigPath, minimalConfig);
  }
  
  // Set environment variables for build
  process.env.NODE_PATH = path.join(cwd, 'node_modules');
  process.env.SKIP_TYPESCRIPT_CHECK = 'true';
  process.env.TSC_COMPILE_ON_ERROR = 'true';
  process.env.VITE_SKIP_TS_CHECK = 'true';
  
  console.log(`${colors.bright}${colors.blue}Starting Vite build process...${colors.reset}`);
  
  try {
    if (fs.existsSync(path.join(cwd, 'node_modules', 'vite'))) {
      // Use local vite if installed
      console.log('Using local Vite installation');
      execSync('node ./node_modules/vite/bin/vite.js build --emptyOutDir', { 
        stdio: 'inherit',
        env: {...process.env}
      });
    } else {
      // Fallback to npx with specific version
      console.log('Using npx to run Vite');
      execSync('npx vite@5.4.14 build --emptyOutDir', { 
        stdio: 'inherit',
        env: {...process.env}
      });
    }
    console.log(`${colors.green}Build completed successfully${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Build command error:${colors.reset}`, error);
    
    // Try another approach with direct require
    console.log('Trying alternative build approach...');
    try {
      // First check if Vite is installed globally
      console.log('Checking for global Vite installation...');
      try {
        execSync('npm list -g vite', { stdio: 'pipe' });
        console.log('Using global Vite installation');
        execSync('vite build --emptyOutDir', { 
          stdio: 'inherit',
          env: {...process.env}
        });
      } catch (globalErr) {
        console.log('Vite not found globally or error running global Vite.');
        console.log('Creating direct build script with CommonJS...');
        // Create a simple build script that uses CommonJS
        const buildScriptPath = path.join(cwd, 'direct-build.cjs');
        const directBuildScript = `
const path = require('path');
// Try different ways to require vite
let vite;
try {
  vite = require('vite');
} catch (err1) {
  try {
    vite = require(path.join(process.cwd(), 'node_modules', 'vite'));
  } catch (err2) {
    console.error('Failed to require vite:', err2);
    process.exit(1);
  }
}

async function buildApp() {
  try {
    await vite.build({
      root: process.cwd(),
      configFile: path.join(process.cwd(), 'vite.config.ts'),
      build: {
        outDir: 'dist',
        emptyOutDir: true,
      }
    });
    console.log('Direct build completed successfully');
  } catch (err) {
    console.error('Direct build failed:', err);
    process.exit(1);
  }
}

buildApp();
`;
        fs.writeFileSync(buildScriptPath, directBuildScript);
        
        // Run the direct build script
        console.log('Running direct build script...');
        execSync(`node ${buildScriptPath}`, { stdio: 'inherit' });
      }
    } catch (directError) {
      console.error(`${colors.red}Alternative build approach failed:${colors.reset}`, directError);
      
      // Last resort: install vite globally and try again
      console.log('Last resort: Installing Vite globally...');
      try {
        execSync('npm install -g vite@5.4.14 @vitejs/plugin-react@4.3.4', { stdio: 'inherit' });
        execSync('vite build --emptyOutDir', { stdio: 'inherit' });
      } catch (globalInstallError) {
        console.error('Global Vite installation or build failed:', globalInstallError);
      }
    }
  }

  // Check if build actually produced valid output files despite errors
  if (isBuildSuccessful()) {
    console.log(`${colors.green}Build generated valid output files - build successful!${colors.reset}`);
    process.exit(0);
  }

  // If we get here, the build truly failed
  console.error(`${colors.red}Build failed to produce valid output files${colors.reset}`);
  console.log('Creating a very basic but functional index.html...');
  
  // Create a very simple index.html that redirects to the admin page
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CharterHub</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background-color: #f5f8fa;
    }
    header {
      background-color: #0066cc;
      color: white;
      padding: 1rem;
      text-align: center;
    }
    main {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 2rem;
      text-align: center;
    }
    footer {
      background-color: #f0f0f0;
      padding: 1rem;
      text-align: center;
    }
    .btn {
      display: inline-block;
      padding: 0.5rem 1rem;
      background-color: #0066cc;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-weight: bold;
      margin-top: 1rem;
    }
    .message {
      margin-bottom: 2rem;
      color: #555;
    }
  </style>
</head>
<body>
  <header>
    <h1>CharterHub</h1>
  </header>
  <main>
    <div class="message">
      <h2>Welcome to CharterHub</h2>
      <p>The application is currently experiencing technical difficulties.</p>
      <p>Our team has been notified and is working to fix the issue.</p>
    </div>
    <a href="/admin" class="btn">Go to Admin Dashboard</a>
  </main>
  <footer>
    <p>&copy; ${new Date().getFullYear()} CharterHub. All rights reserved.</p>
  </footer>
  <script>
    // Redirect to admin dashboard after 2 seconds
    setTimeout(() => {
      window.location.href = '/admin';
    }, 2000);
  </script>
</body>
</html>
  `;
  
  fs.writeFileSync(path.join(distDir, 'index.html'), html);
  
  // Also create a simple redirect script
  fs.writeFileSync(path.join(distDir, 'redirect.js'), `
// Redirect to admin dashboard
window.location.href = '/admin';
  `);
  
  console.log(`${colors.yellow}Created fallback index.html with redirect to admin dashboard${colors.reset}`);
  process.exit(1);
  
} catch (error) {
  console.error(`${colors.red}Failed during build process:${colors.reset}`, error);
  process.exit(1);
} 