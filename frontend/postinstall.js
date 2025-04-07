#!/usr/bin/env node

// Script to handle case sensitivity issues with component imports
const fs = require('fs');
const path = require('path');

console.log('Running postinstall script to fix case sensitivity issues...');

const uiComponentsDir = path.join(__dirname, 'src/components/ui');

// Check if the directory exists
if (!fs.existsSync(uiComponentsDir)) {
  console.error(`Directory ${uiComponentsDir} does not exist. Skipping symlink creation.`);
  process.exit(0);
}

// Create symlinks for case-sensitive imports
try {
  // Map of component files that need case-sensitive symlinks
  const componentsToFix = {
    'button.tsx': 'Button.tsx',
    'Card.tsx': 'card.tsx',
    'PageHeader.tsx': 'pageheader.tsx',
    'Spinner.tsx': 'spinner.tsx'
  };

  // Create symlinks for each component
  Object.entries(componentsToFix).forEach(([source, target]) => {
    const sourcePath = path.join(uiComponentsDir, source);
    const targetPath = path.join(uiComponentsDir, target);

    // Check if source file exists
    if (!fs.existsSync(sourcePath)) {
      console.warn(`Source file ${sourcePath} does not exist. Skipping symlink creation.`);
      return;
    }

    // Create symlink if target doesn't exist
    if (!fs.existsSync(targetPath)) {
      try {
        fs.symlinkSync(source, targetPath);
        console.log(`Created symlink from ${source} to ${target}`);
      } catch (err) {
        // If permission error, just copy the file
        if (err.code === 'EPERM') {
          fs.copyFileSync(sourcePath, targetPath);
          console.log(`Copied ${source} to ${target} (no symlink permission)`);
        } else {
          throw err;
        }
      }
    } else {
      console.log(`Target ${target} already exists. Skipping.`);
    }
  });

  console.log('Completed fixing case sensitivity issues!');
} catch (error) {
  console.error('Error fixing case sensitivity issues:', error);
  // Don't exit with error to allow build to continue
} 