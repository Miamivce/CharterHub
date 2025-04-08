// Build probe to verify output directory location
const fs = require('fs');
const path = require('path');

console.log('Probing for build output directories...');
console.log('Current directory:', process.cwd());

// Check common locations for the build output
const possibleLocations = [
  'dist',
  'frontend/dist',
  'build',
  'frontend/build',
  'public',
  'frontend/public',
  '../dist',
  '../../dist'
];

console.log('\nChecking for build directories:');
for (const loc of possibleLocations) {
  const fullPath = path.resolve(process.cwd(), loc);
  const exists = fs.existsSync(fullPath);
  console.log(`- ${fullPath}: ${exists ? 'EXISTS' : 'not found'}`);
  
  if (exists) {
    try {
      const files = fs.readdirSync(fullPath);
      console.log(`  Files: ${files.slice(0, 5).join(', ')}${files.length > 5 ? '...' : ''}`);
      
      // Check for index.html specifically
      if (fs.existsSync(path.join(fullPath, 'index.html'))) {
        console.log('  ✅ Found index.html!');
      }
    } catch (err) {
      console.log(`  Error reading directory: ${err.message}`);
    }
  }
}

// List environment variables
console.log('\nEnvironment Variables:');
const envVars = Object.keys(process.env)
  .filter(key => key.startsWith('VERCEL') || key.startsWith('NODE') || key.includes('DIR') || key.includes('PATH'))
  .sort();

for (const key of envVars) {
  console.log(`${key}=${process.env[key]}`);
}

console.log('\nBuild probe complete!'); 