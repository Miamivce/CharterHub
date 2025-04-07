#!/usr/bin/env node

// Script to create UI component files with proper case variation
// This is a CommonJS script specifically designed to run in any Node.js environment
const fs = require('fs');
const path = require('path');

console.log('Setting up UI components with case variations...');

const componentsDir = path.join(__dirname, 'src/components/ui');

// Ensure the UI components directory exists
if (!fs.existsSync(componentsDir)) {
  console.log(`Creating UI components directory: ${componentsDir}`);
  try {
    fs.mkdirSync(componentsDir, { recursive: true });
  } catch (err) {
    console.error(`Failed to create components directory: ${err.message}`);
    process.exit(1);
  }
}

// Define the critical UI components with both casing variations
const criticalComponents = [
  { 
    name: 'Button.tsx', 
    content: `// Button component (uppercase)
import React from 'react';
export const Button = ({ children, ...props }) => {
  return <button {...props}>{children}</button>;
};
`
  },
  { 
    name: 'button.tsx', 
    content: `// button component (lowercase)
import React from 'react';
export const Button = ({ children, ...props }) => {
  return <button {...props}>{children}</button>;
};
`
  },
  { 
    name: 'Card.tsx', 
    content: `// Card component (uppercase)
import React from 'react';
export const Card = ({ children, ...props }) => {
  return <div className="card" {...props}>{children}</div>;
};
` 
  },
  { 
    name: 'card.tsx', 
    content: `// card component (lowercase)
import React from 'react';
export const Card = ({ children, ...props }) => {
  return <div className="card" {...props}>{children}</div>;
};
`
  },
  { 
    name: 'Dialog.tsx', 
    content: `// Dialog component (uppercase)
import React from 'react';
export const Dialog = ({ children, ...props }) => {
  return <div className="dialog" {...props}>{children}</div>;
};
`
  },
  { 
    name: 'dialog.tsx', 
    content: `// dialog component (lowercase)
import React from 'react';
export const Dialog = ({ children, ...props }) => {
  return <div className="dialog" {...props}>{children}</div>;
};
`
  },
  { 
    name: 'Toast.tsx', 
    content: `// Toast component (uppercase)
import React from 'react';
export const Toast = ({ children, ...props }) => {
  return <div className="toast" {...props}>{children}</div>;
};
`
  },
  { 
    name: 'toast.tsx', 
    content: `// toast component (lowercase)
import React from 'react';
export const Toast = ({ children, ...props }) => {
  return <div className="toast" {...props}>{children}</div>;
};
`
  },
  { 
    name: 'PageHeader.tsx', 
    content: `// PageHeader component (uppercase)
import React from 'react';
export const PageHeader = ({ children, ...props }) => {
  return <header className="page-header" {...props}>{children}</header>;
};
`
  },
  { 
    name: 'pageheader.tsx', 
    content: `// pageheader component (lowercase)
import React from 'react';
export const PageHeader = ({ children, ...props }) => {
  return <header className="page-header" {...props}>{children}</header>;
};
`
  },
  { 
    name: 'Spinner.tsx', 
    content: `// Spinner component (uppercase)
import React from 'react';
export const Spinner = ({ ...props }) => {
  return <div className="spinner" {...props}></div>;
};
`
  },
  { 
    name: 'spinner.tsx', 
    content: `// spinner component (lowercase)
import React from 'react';
export const Spinner = ({ ...props }) => {
  return <div className="spinner" {...props}></div>;
};
`
  }
];

// Create each component file if it doesn't exist
for (const component of criticalComponents) {
  const filePath = path.join(componentsDir, component.name);
  
  if (!fs.existsSync(filePath)) {
    try {
      fs.writeFileSync(filePath, component.content);
      console.log(`Created component file: ${component.name}`);
    } catch (err) {
      console.error(`Failed to create ${component.name}: ${err.message}`);
    }
  } else {
    console.log(`Component file already exists: ${component.name}`);
  }
}

console.log('UI component setup completed!');
process.exit(0); 