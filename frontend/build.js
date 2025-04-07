#!/usr/bin/env node

// Custom build script that bypasses TypeScript checking
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for output formatting
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

// Helper function to run a command and log its output
function runCommand(command, description) {
  console.log(`${colors.blue}${colors.bright}>>> ${description}${colors.reset}`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`${colors.green}✓ Completed: ${description}${colors.reset}\n`);
    return true;
  } catch (error) {
    console.error(`${colors.red}✗ Failed: ${description}${colors.reset}`);
    console.error(`${colors.red}Error: ${error.message}${colors.reset}\n`);
    return false;
  }
}

// Ensure we're using production .env file
console.log(`${colors.yellow}${colors.bright}Starting production build process...${colors.reset}\n`);

// Set up environment for production
process.env.NODE_ENV = 'production';

// Copy .env.production to .env if it exists
if (fs.existsSync(path.join(__dirname, '.env.production'))) {
  console.log(`${colors.blue}Copying .env.production to .env...${colors.reset}`);
  fs.copyFileSync(
    path.join(__dirname, '.env.production'),
    path.join(__dirname, '.env')
  );
}

// Build without TypeScript checks
const buildSuccessful = runCommand(
  'vite build',
  'Building production bundle without TypeScript checks'
);

if (buildSuccessful) {
  console.log(`${colors.green}${colors.bright}Build completed successfully!${colors.reset}`);
} else {
  console.error(`${colors.red}${colors.bright}Build failed. See errors above.${colors.reset}`);
  process.exit(1);
} 