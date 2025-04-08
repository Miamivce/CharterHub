// Environment variables for CharterHub frontend
window.ENV = {
  VITE_API_URL: "https://charterhub-api.onrender.com",
  VITE_PHP_API_URL: "https://charterhub-api.onrender.com"
};

// Make environment variables available through import.meta.env
window.import = window.import || {};
window.import.meta = window.import.meta || {};
window.import.meta.env = {
  VITE_API_URL: "https://charterhub-api.onrender.com",
  VITE_PHP_API_URL: "https://charterhub-api.onrender.com",
  MODE: 'production',
  PROD: true,
  DEV: false
};

console.log('Environment config loaded successfully'); 