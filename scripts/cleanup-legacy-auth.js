/**
 * Script to scan for and optionally remove references to LegacyAuthProvider
 * Run with: node scripts/cleanup-legacy-auth.js
 * 
 * Options:
 *   --dry-run    Only report findings without making changes (default)
 *   --remove     Remove LegacyAuthProvider imports and references
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const rootDir = path.resolve(__dirname, '..');
const excludedDirs = ['node_modules', 'build', 'dist', '.git', 'scripts']; 
const excludedFiles = [
  'LegacyAuthProvider.tsx', 
  'jwt-migration-completion-report.md',
  'jwt-auth-developer-guidelines.md',
  'cleanup-legacy-auth.js',
  '13mrt_refactor_auth.md'
];

// Patterns to search for
const patterns = [
  {
    name: 'Import from LegacyAuthProvider',
    regex: /import\s+.*\s+from\s+['"].*\/LegacyAuthProvider['"];?/g
  },
  {
    name: 'useAuth hook from legacy provider',
    regex: /const\s+.*\s+=\s+useAuth\(\);/g
  },
  {
    name: 'LegacyAuthProvider component',
    regex: /<LegacyAuthProvider[\s\S]*?<\/LegacyAuthProvider>/g
  }
];

// Check for --remove flag
const shouldRemove = process.argv.includes('--remove');
const dryRun = process.argv.includes('--dry-run') || !shouldRemove;

console.log(`
========================================
Legacy Auth Reference Scanner
========================================
Mode: ${dryRun ? 'Dry Run (reporting only)' : 'Remove Mode (will modify files)'}
`);

// Function to scan file content
function scanFile(filePath, content) {
  let hasMatches = false;
  const matches = [];

  patterns.forEach(pattern => {
    const results = content.match(pattern.regex);
    if (results && results.length > 0) {
      hasMatches = true;
      matches.push({
        pattern: pattern.name,
        matches: results
      });
    }
  });

  if (hasMatches) {
    return {
      filePath,
      matches
    };
  }

  return null;
}

// Function to remove legacy references
function removeLegacyReferences(filePath, content) {
  let updatedContent = content;
  let changesCount = 0;

  // Remove imports
  const importRegex = /import\s+.*\s+from\s+['"].*\/LegacyAuthProvider['"];?\n?/g;
  updatedContent = updatedContent.replace(importRegex, '');
  const importsRemoved = content !== updatedContent;
  if (importsRemoved) changesCount++;

  // Replace useAuth with useJWTAuth if it exists
  if (updatedContent.includes('useAuth')) {
    const originalContent = updatedContent;
    updatedContent = updatedContent.replace(/const\s+(.*)\s+=\s+useAuth\(\);/g, 'const $1 = useJWTAuth();');
    if (originalContent !== updatedContent) {
      // Add the import for JWTAuthContext if needed
      if (!updatedContent.includes('JWTAuthContext') && !updatedContent.includes('useJWTAuth')) {
        const importStatement = "import { useJWTAuth } from '../../frontend/src/contexts/auth/JWTAuthContext';\n";
        // Find the last import statement
        const lastImportIndex = updatedContent.lastIndexOf('import ');
        if (lastImportIndex !== -1) {
          const endOfImport = updatedContent.indexOf('\n', lastImportIndex) + 1;
          updatedContent = 
            updatedContent.substring(0, endOfImport) + 
            importStatement + 
            updatedContent.substring(endOfImport);
        } else {
          // Add at beginning if no other imports
          updatedContent = importStatement + updatedContent;
        }
      }
      changesCount++;
    }
  }

  // Replace LegacyAuthProvider with JWTAuthProvider
  if (updatedContent.includes('LegacyAuthProvider')) {
    const originalContent = updatedContent;
    updatedContent = updatedContent.replace(/<LegacyAuthProvider([^>]*)>/g, '<JWTAuthProvider$1>');
    updatedContent = updatedContent.replace(/<\/LegacyAuthProvider>/g, '</JWTAuthProvider>');
    if (originalContent !== updatedContent) {
      // Add the import for JWTAuthProvider if needed
      if (!updatedContent.includes('JWTAuthProvider') || !updatedContent.includes('JWTAuthContext')) {
        const importStatement = "import { JWTAuthProvider } from '../../frontend/src/contexts/auth/JWTAuthContext';\n";
        // Find the last import statement
        const lastImportIndex = updatedContent.lastIndexOf('import ');
        if (lastImportIndex !== -1) {
          const endOfImport = updatedContent.indexOf('\n', lastImportIndex) + 1;
          updatedContent = 
            updatedContent.substring(0, endOfImport) + 
            importStatement + 
            updatedContent.substring(endOfImport);
        } else {
          // Add at beginning if no other imports
          updatedContent = importStatement + updatedContent;
        }
      }
      changesCount++;
    }
  }

  return { 
    updatedContent,
    changesCount
  };
}

// Find all files to scan
function getFilesToScan(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!excludedDirs.includes(file)) {
        fileList = getFilesToScan(filePath, fileList);
      }
    } else {
      const ext = path.extname(file).toLowerCase();
      const isTextFile = ['.js', '.jsx', '.ts', '.tsx', '.md', '.html', '.css', '.json'].includes(ext);
      const isExcluded = excludedFiles.includes(file);
      
      if (isTextFile && !isExcluded) {
        fileList.push(filePath);
      }
    }
  });
  
  return fileList;
}

// Main execution
try {
  console.log('Scanning for legacy auth references...');
  
  const filesToScan = getFilesToScan(rootDir);
  const findings = [];
  let modifiedFilesCount = 0;
  
  console.log(`Found ${filesToScan.length} files to scan`);
  
  filesToScan.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const result = scanFile(filePath, content);
      
      if (result) {
        findings.push(result);
        
        if (!dryRun) {
          const { updatedContent, changesCount } = removeLegacyReferences(filePath, content);
          
          if (changesCount > 0) {
            fs.writeFileSync(filePath, updatedContent, 'utf8');
            console.log(`✓ Updated: ${filePath} (${changesCount} changes)`);
            modifiedFilesCount++;
          }
        }
      }
    } catch (err) {
      console.error(`Error scanning file ${filePath}: ${err.message}`);
    }
  });
  
  // Print findings
  console.log('\n========================================');
  console.log(`Found ${findings.length} files with legacy auth references:`);
  console.log('========================================\n');
  
  findings.forEach(finding => {
    console.log(`FILE: ${finding.filePath}`);
    finding.matches.forEach(match => {
      console.log(`  - ${match.pattern}:`);
      match.matches.forEach(m => {
        console.log(`    ${m.trim().replace(/\n/g, ' ')}`);
      });
    });
    console.log('');
  });
  
  if (!dryRun) {
    console.log(`Modified ${modifiedFilesCount} files to remove legacy auth references.`);
  } else {
    console.log('This was a dry run. No files were modified.');
    console.log('Run with --remove flag to remove legacy auth references.');
  }
  
} catch (err) {
  console.error('Error:', err);
  process.exit(1);
} 