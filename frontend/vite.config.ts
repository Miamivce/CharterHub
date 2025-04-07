import { defineConfig } from 'vite'
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

// Development CSP configuration
const developmentCsp = [
  // Restrict default sources to same origin
  "default-src 'self'",
  
  // Allow connections to development APIs, websockets, and telemetry
  "connect-src 'self' https://*.cloudflare.com https://*.googleapis.com http://localhost:* ws://localhost:* https://yachtstory.com https://charterhub-api.onrender.com https://*.yachtstory.be",
  
  // Scripts - Allow development necessities
  // Note: 'unsafe-inline' needed for development, use nonces in production
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
export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
      babel: {
        plugins: [
          ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }]
        ]
      }
    }),
    headerLoggingPlugin()
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
        rewrite: (path) => path,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxying request:', req.method, req.url);
          });
        }
      },
      // Add proxy for direct API endpoints - point to standalone backend
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('API Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxying API request:', req.method, req.url);
          });
        }
      },
      // Add direct proxy for auth endpoints - point to standalone backend
      '/auth': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Auth Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxying Auth request:', req.method, req.url);
          });
        }
      }
    },
  },
  build: {
    // Enable source maps for debugging
    sourcemap: true,
    
    // Optimize chunks
    chunkSizeWarningLimit: 1000,
    
    // Add content hash to file names for cache busting
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@headlessui/react', '@heroicons/react'],
        },
      },
    },
    
    // Ensure assets are properly hashed
    assetsDir: 'assets',
    
    // Optimize build
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console logs for debugging
        drop_debugger: true,
      },
    },
  },
  // Configure base path based on domain for admin/client split
  base: process.env.NODE_ENV === 'production' 
    ? (process.env.VERCEL_URL?.includes('admin') ? '/admin' : '/')
    : '/',
}) 