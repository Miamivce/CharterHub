// Environment variables for CharterHub frontend
window.ENV = {
  VITE_API_URL: "https://charterhub-api.onrender.com",
  VITE_PHP_API_URL: "https://charterhub-api.onrender.com",
  VITE_FRONTEND_URL: "https://charter-hub.vercel.app",
  VITE_ADMIN_URL: "https://admin.yachtstory.be",
  VITE_ALLOWED_ORIGINS: "https://charter-hub.vercel.app,https://admin.yachtstory.be,https://app.yachtstory.be"
};

// Make environment variables available through import.meta.env
window.import = window.import || {};
window.import.meta = window.import.meta || {};
window.import.meta.env = {
  VITE_API_URL: "https://charterhub-api.onrender.com",
  VITE_PHP_API_URL: "https://charterhub-api.onrender.com",
  VITE_FRONTEND_URL: "https://charter-hub.vercel.app",
  VITE_ADMIN_URL: "https://admin.yachtstory.be",
  VITE_ALLOWED_ORIGINS: "https://charter-hub.vercel.app,https://admin.yachtstory.be,https://app.yachtstory.be",
  MODE: 'production',
  PROD: true,
  DEV: false
};

console.log('Environment config loaded successfully'); 