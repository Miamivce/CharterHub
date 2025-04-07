import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { Plugin } from 'vite'

// Custom plugin for header logging
const headerLoggingPlugin = (): Plugin => ({
  name: 'header-logging',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const originalSetHeader = res.setHeader;
      res.setHeader = function(name, value) {
        if (name.toLowerCase() === 'content-security-policy') {
          console.log('CSP Header Applied:', value);
        }
        return originalSetHeader.call(this, name, value);
      };
      next();
    });
  },
});

// Dynamic environment loading plugin
const envPlugin = (): Plugin => ({
  name: 'env-plugin',
  config(config, { mode }) {
    const env = loadEnv(mode, process.cwd(), '')
    console.log(`Loading environment for mode: ${mode}`)
    
    // Default environment variables for production
    const defaultEnv = {
      VITE_API_URL: 'https://charterhub-api.onrender.com',
      VITE_PHP_API_URL: 'https://charterhub-api.onrender.com',
      VITE_ADMIN_API_URL: 'https://charterhub-api.onrender.com/admin/api',
      VITE_API_BASE_URL: 'https://charterhub-api.onrender.com',
      VITE_WP_API_URL: 'https://yachtstory.com/wp-json',
      VITE_WP_LIVE_API_URL: 'https://yachtstory.com/wp-json',
      VITE_FRONTEND_URL: 'https://app.yachtstory.com',
      VITE_WORDPRESS_URL: 'https://yachtstory.com',
      VITE_USE_JWT: 'true',
      VITE_DEBUG: 'false',
      MODE: mode,
      DEV: mode === 'development' ? 'true' : 'false',
      VITE_GOOGLE_MAPS_API_KEY: 'AIzaSyC33pICGzToc0_0jJLkm2zp2g3_RniBZP4',
      VITE_WORDPRESS_USERNAME: 'admin',
      VITE_WORDPRESS_PASSWORD: 'password',
      VITE_WORDPRESS_APPLICATION_PASSWORD: 'secret',
    }
    
    // Build the define object by merging default values with actual env
    const defineObj = {}
    for (const [key, defaultValue] of Object.entries(defaultEnv)) {
      defineObj[`import.meta.env.${key}`] = JSON.stringify(env[key] || defaultValue)
    }
    
    // Always make sure DEV and MODE are correctly set
    defineObj['import.meta.env.DEV'] = mode === 'development'
    defineObj['import.meta.env.MODE'] = JSON.stringify(mode)
    
    return { define: defineObj }
  }
})

// Skip TypeScript checking plugin
const skipTsCheckPlugin = (): Plugin => ({
  name: 'skip-ts-check',
  buildStart() {
    console.log('TypeScript checking disabled for build')
  }
})

// Development CSP configuration
const developmentCsp = [
  // Restrict default sources to same origin
  "default-src 'self'",
  
  // Allow connections to development APIs, websockets, and telemetry
  "connect-src 'self' https://*.cloudflare.com https://*.googleapis.com http://localhost:* ws://localhost:* https://yachtstory.com https://charterhub-api.onrender.com https://*.yachtstory.be",
  
  // Scripts - Allow development necessities
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' http://localhost:3000 https://challenges.cloudflare.com https://*.cloudflare.com https://*.googleapis.com",
  
  // Styles - Allow inline for development
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  
  // Fonts
  "font-src 'self' https://fonts.gstatic.com",
  
  // Images - Allow data URIs and external sources
  "img-src 'self' data: https://* blob:",
  
  // Frames - Required for Cloudflare
  "frame-src 'self' https://*.cloudflare.com https://challenges.cloudflare.com",
  
  // Workers and child contexts
  "worker-src 'self' blob:",
  "child-src 'self' blob: https://challenges.cloudflare.com",
  
  // Form submissions
  "form-action 'self'",
  
  // Base URI restriction
  "base-uri 'self'",
  
  // Object restriction
  "object-src 'none'",
  
  // Inline script attributes
  "script-src-attr 'unsafe-inline'"
].join('; ');

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [
      react({
        jsxRuntime: 'automatic',
        babel: {
          plugins: [
            ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }]
          ]
        }
      }),
      headerLoggingPlugin(),
      envPlugin(),
      skipTsCheckPlugin()
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      headers: {
        // Force CSP headers with multiple variants to prevent overrides
        'Content-Security-Policy': developmentCsp,
        'X-Content-Security-Policy': developmentCsp,
        'X-Webkit-CSP': developmentCsp,
        
        // Prevent caching during development
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      // HMR settings for better performance
      hmr: {
        overlay: false, // Disable the error overlay to save memory
      },
      // Reduce watch load on filesystem
      watch: {
        usePolling: false,
        interval: 1000,
      },
      proxy: {
        '/wp-json': {
          target: 'https://yachtstory.com',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path
        },
        // Add proxy for direct API endpoints
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false
        },
        // Add direct proxy for auth endpoints
        '/auth': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false
        }
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
  }
}) 