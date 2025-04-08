// Script to clean node_modules before building
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Starting node_modules cleanup...');

function cleanNodeModules(dir) {
  const nodeModulesPath = path.join(dir, 'node_modules');
  
  if (fs.existsSync(nodeModulesPath)) {
    console.log(`Removing ${nodeModulesPath}`);
    try {
      // Using rimraf-like approach for better cross-platform compatibility
      execSync(`rm -rf "${nodeModulesPath}"`, { stdio: 'inherit' });
      console.log(`Successfully removed ${nodeModulesPath}`);
    } catch (error) {
      console.error(`Error removing ${nodeModulesPath}:`, error.message);
    }
  }
  
  // Check subdirectories
  try {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const itemPath = path.join(dir, item);
      if (fs.statSync(itemPath).isDirectory() && item !== 'node_modules' && !item.startsWith('.')) {
        cleanNodeModules(itemPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
}

// Start the cleanup from the current directory
cleanNodeModules(__dirname);

console.log('Node modules cleanup completed.');

// Replace frontend package.json with clean version
console.log('Replacing frontend package.json with clean version...');

const frontendDir = path.join(__dirname, 'frontend');
const cleanPackagePath = path.join(frontendDir, 'clean-package.json');
const packageJsonPath = path.join(frontendDir, 'package.json');

if (fs.existsSync(cleanPackagePath)) {
  try {
    // Backup original package.json if needed
    if (fs.existsSync(packageJsonPath)) {
      const backupPath = path.join(frontendDir, 'package.json.bak');
      fs.copyFileSync(packageJsonPath, backupPath);
      console.log(`Original package.json backed up to ${backupPath}`);
    }
    
    // Copy clean package.json to replace the original
    fs.copyFileSync(cleanPackagePath, packageJsonPath);
    console.log('Replaced frontend package.json with clean version');
  } catch (error) {
    console.error('Error replacing package.json:', error.message);
  }
} else {
  console.log('Clean package.json not found, creating a minimal one...');
  const simplePackageJson = {
    "name": "charterhub-frontend",
    "version": "1.0.0",
    "private": true,
    "dependencies": {
      "express": "^4.17.3"
    },
    "scripts": {
      "build": "node ../build.js"
    }
  };
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(simplePackageJson, null, 2));
  console.log('Created minimal package.json');
}

// Now run the build.js script
console.log('Running build.js...');
require('./build.js'); 