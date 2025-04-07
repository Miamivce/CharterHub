// Direct build script that uses CommonJS
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Running direct build script in CommonJS format');

// Make sure we're in the right directory
const cwd = process.cwd();
console.log(`Current working directory: ${cwd}`);

// Ensure dist directory exists
const distDir = path.join(cwd, 'dist');
if (!fs.existsSync(distDir)) {
  console.log('Creating dist directory');
  fs.mkdirSync(distDir, { recursive: true });
}

// Log all VITE_ environment variables
Object.keys(process.env)
  .filter(key => key.startsWith('VITE_'))
  .forEach(key => {
    console.log(`${key}: ${process.env[key]}`);
  });

try {
  console.log('Installing dependencies...');
  execSync('npm install vite@5.4.14 @vitejs/plugin-react@4.3.4 --no-fund', { 
    stdio: 'inherit',
    cwd
  });
  
  console.log('Running Vite build with CJS config...');
  execSync('npx vite build --config vite.config.cjs --mode production', { 
    stdio: 'inherit',
    cwd,
    env: {
      ...process.env,
      SKIP_TYPESCRIPT_CHECK: 'true',
      NODE_ENV: 'production',
      TSC_COMPILE_ON_ERROR: 'true'
    }
  });
  
  console.log('Build completed successfully');
  process.exit(0);
} catch (error) {
  console.error('Build failed:', error);
  
  // Create a fallback if build fails
  console.log('Creating fallback redirect page...');
  
  // Create a simple HTML file
  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CharterHub</title>
    <meta http-equiv="refresh" content="0;url=/admin">
  </head>
  <body>
    <p>Redirecting to admin dashboard...</p>
    <script>
      window.location.href = '/admin';
    </script>
  </body>
  </html>
  `;
  
  fs.writeFileSync(path.join(distDir, 'index.html'), html);
  console.log('Created fallback index.html');
  process.exit(1);
} 