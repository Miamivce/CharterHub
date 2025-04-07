// CommonJS version of vite config for Vercel compatibility
const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');
const path = require('path');

// Skip TypeScript checking plugin
const skipTsCheckPlugin = () => ({
  name: 'skip-ts-check',
  buildStart() {
    console.log('TypeScript checking disabled for build');
  }
});

// Simple environment setup for production
const setupEnv = () => ({
  name: 'setup-env',
  config(config, { mode }) {
    console.log(`Setting up environment for mode: ${mode}`);
    
    // Define environment variables
    const env = {
      'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'https://charterhub-api.onrender.com'),
      'import.meta.env.VITE_PHP_API_URL': JSON.stringify(process.env.VITE_PHP_API_URL || 'https://charterhub-api.onrender.com'),
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL || 'https://charterhub-api.onrender.com'),
      'import.meta.env.MODE': JSON.stringify(mode || 'production'),
      'import.meta.env.DEV': mode === 'development',
      'import.meta.env.PROD': mode !== 'development',
    };
    
    // Add any VITE_ prefixed environment variables
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('VITE_')) {
        env[`import.meta.env.${key}`] = JSON.stringify(process.env[key]);
      }
    });
    
    return { define: env };
  }
});

module.exports = defineConfig(({ mode }) => {
  return {
    plugins: [
      react({
        jsxRuntime: 'automatic',
        babel: {
          plugins: [
            [
              '@babel/plugin-transform-react-jsx',
              {
                runtime: 'automatic'
              }
            ]
          ]
        }
      }),
      setupEnv(),
      skipTsCheckPlugin()
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      // Skip TypeScript type checking
      emptyOutDir: true,
      commonjsOptions: {
        transformMixedEsModules: true
      },
      rollupOptions: {
        treeshake: true,
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            ui: ['@headlessui/react', '@heroicons/react']
          }
        }
      },
      minify: 'terser',
      target: ['es2015', 'edge88', 'firefox78', 'chrome87', 'safari14']
    },
    esbuild: {
      // Skip type checking
      tsconfigRaw: {
        compilerOptions: {
          skipLibCheck: true,
          skipDefaultLibCheck: true,
          strict: false,
          noImplicitAny: false,
          noImplicitReturns: false,
          noImplicitThis: false,
          forceConsistentCasingInFileNames: false
        }
      }
    }
  };
}); 