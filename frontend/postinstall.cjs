#!/usr/bin/env node

// Script to handle case sensitivity issues with component imports
const fs = require('fs');
const path = require('path');

console.log('Running postinstall script (CJS version) to fix case sensitivity issues...');

// Function to create component duplicates for case insensitivity
function createDuplicatesForCaseInsensitivity(directory, components) {
  if (!fs.existsSync(directory)) {
    console.error(`Directory ${directory} does not exist. Creating it...`);
    try {
      fs.mkdirSync(directory, { recursive: true });
    } catch (err) {
      console.error(`Failed to create directory ${directory}:`, err);
      return false;
    }
  }

  // For each component file, create a duplicate with different casing
  for (const [source, targets] of Object.entries(components)) {
    const sourcePath = path.join(directory, source);
    
    // If source doesn't exist, try lowercase/uppercase version
    if (!fs.existsSync(sourcePath)) {
      const altSourcePath = path.join(directory, source.toLowerCase());
      if (fs.existsSync(altSourcePath)) {
        console.log(`Using alternative source: ${altSourcePath}`);
        
        // Create all target variations
        targets.forEach(target => {
          const targetPath = path.join(directory, target);
          try {
            if (!fs.existsSync(targetPath)) {
              fs.copyFileSync(altSourcePath, targetPath);
              console.log(`Created copy from ${altSourcePath} to ${targetPath}`);
            }
          } catch (err) {
            console.error(`Failed to create file ${targetPath}:`, err);
          }
        });
        continue;
      }
      
      // Try uppercase version
      const upperSourcePath = path.join(directory, source.charAt(0).toUpperCase() + source.slice(1));
      if (fs.existsSync(upperSourcePath)) {
        console.log(`Using uppercase source: ${upperSourcePath}`);
        
        // Create all target variations
        targets.forEach(target => {
          const targetPath = path.join(directory, target);
          try {
            if (!fs.existsSync(targetPath)) {
              fs.copyFileSync(upperSourcePath, targetPath);
              console.log(`Created copy from ${upperSourcePath} to ${targetPath}`);
            }
          } catch (err) {
            console.error(`Failed to create file ${targetPath}:`, err);
          }
        });
        continue;
      }
      
      console.warn(`Source file ${sourcePath} does not exist and no alternatives found. Skipping...`);
      continue;
    }

    // Create each target variation
    targets.forEach(target => {
      const targetPath = path.join(directory, target);
      try {
        if (!fs.existsSync(targetPath)) {
          fs.copyFileSync(sourcePath, targetPath);
          console.log(`Created copy from ${sourcePath} to ${targetPath}`);
        } else {
          console.log(`Target ${targetPath} already exists. Skipping.`);
        }
      } catch (err) {
        console.error(`Failed to create file ${targetPath}:`, err);
      }
    });
  }
  
  return true;
}

// Components in UI directory
const uiComponentsDir = path.join(__dirname, 'src/components/ui');
const uiComponents = {
  'button.tsx': ['Button.tsx'],
  'Button.tsx': ['button.tsx'],
  'card.tsx': ['Card.tsx'],
  'Card.tsx': ['card.tsx'], 
  'pageheader.tsx': ['PageHeader.tsx'],
  'PageHeader.tsx': ['pageheader.tsx'],
  'spinner.tsx': ['Spinner.tsx'],
  'Spinner.tsx': ['spinner.tsx'],
  'dialog.tsx': ['Dialog.tsx'],
  'Dialog.tsx': ['dialog.tsx'],
  'toast.tsx': ['Toast.tsx'],
  'Toast.tsx': ['toast.tsx']
};

// Create duplicates for UI components
const uiResult = createDuplicatesForCaseInsensitivity(uiComponentsDir, uiComponents);
console.log(`UI components fix ${uiResult ? 'successful' : 'failed'}`);

// Ensure the process completes successfully
console.log('Completed fixing case sensitivity issues!'); 