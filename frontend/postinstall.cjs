#!/usr/bin/env node

// This script creates symlinks for components that might have case sensitivity issues
const fs = require('fs');
const path = require('path');

// Do not run if environment variable is set
if (process.env.SKIP_POSTINSTALL === 'true') {
  console.log('Skipping postinstall script due to SKIP_POSTINSTALL=true');
  process.exit(0);
}

console.log('Running postinstall script for case-sensitivity issues...');

// Create UI component directory symlinks
try {
  const uiComponentsDir = path.join(process.cwd(), 'src', 'components', 'ui');
  
  // Create the directory if it doesn't exist
  if (!fs.existsSync(uiComponentsDir)) {
    fs.mkdirSync(uiComponentsDir, { recursive: true });
    console.log('Created UI components directory');
  }

  // Define the component pairs that need to have both case variations
  const components = [
    ['Button.tsx', 'button.tsx'],
    ['Card.tsx', 'card.tsx'],
    ['Dialog.tsx', 'dialog.tsx'],
    ['Toast.tsx', 'toast.tsx'],
    ['PageHeader.tsx', 'pageheader.tsx'],
    ['Spinner.tsx', 'spinner.tsx']
  ];

  // For each component, ensure both case variations exist
  for (const [uppercase, lowercase] of components) {
    const uppercasePath = path.join(uiComponentsDir, uppercase);
    const lowercasePath = path.join(uiComponentsDir, lowercase);

    // Check if files exist
    const uppercaseExists = fs.existsSync(uppercasePath);
    const lowercaseExists = fs.existsSync(lowercasePath);

    if (uppercaseExists && !lowercaseExists) {
      try {
        // If only uppercase exists, create lowercase as simple import from uppercase
        const content = `import { ${path.parse(uppercase).name} } from './${path.parse(uppercase).name}';\nexport { ${path.parse(uppercase).name} };\nexport default ${path.parse(uppercase).name};`;
        fs.writeFileSync(lowercasePath, content);
        console.log(`Created lowercase variant: ${lowercase}`);
      } catch (error) {
        console.error(`Error creating lowercase variant for ${uppercase}:`, error);
      }
    } else if (lowercaseExists && !uppercaseExists) {
      try {
        // If only lowercase exists, create uppercase as simple import from lowercase
        const content = `import { ${path.parse(lowercase).name} } from './${path.parse(lowercase).name}';\nexport { ${path.parse(lowercase).name} };\nexport default ${path.parse(lowercase).name};`;
        fs.writeFileSync(uppercasePath, content);
        console.log(`Created uppercase variant: ${uppercase}`);
      } catch (error) {
        console.error(`Error creating uppercase variant for ${lowercase}:`, error);
      }
    } else if (!uppercaseExists && !lowercaseExists) {
      // Try to run UI setup script if available
      try {
        console.log('No components found, trying to run setup-ui-components.cjs');
        require('./setup-ui-components.cjs');
        console.log('Successfully ran UI components setup script');
        // Exit after running setup script
        process.exit(0);
      } catch (error) {
        console.error('Failed to run UI components setup script:', error);
        // Continue with minimal component creation
      }

      // If neither exists, create minimal versions
      try {
        const componentName = path.parse(uppercase).name;
        const uppercaseContent = `import React from 'react';\nexport const ${componentName} = ({ children, ...props }) => <div {...props}>{children}</div>;\nexport default ${componentName};`;
        fs.writeFileSync(uppercasePath, uppercaseContent);
        console.log(`Created minimal ${uppercase}`);

        const lowercaseContent = `import { ${componentName} } from './${componentName}';\nexport { ${componentName} };\nexport default ${componentName};`;
        fs.writeFileSync(lowercasePath, lowercaseContent);
        console.log(`Created minimal ${lowercase}`);
      } catch (error) {
        console.error(`Error creating minimal components:`, error);
      }
    } else {
      console.log(`Both variants exist for ${uppercase}`);
    }
  }

  console.log('Case sensitivity handling completed successfully');
} catch (error) {
  console.error('Error in postinstall script:', error);
  // Exit with success to avoid breaking builds
  process.exit(0);
}

// Exit with success
process.exit(0); 