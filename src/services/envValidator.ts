/**
 * Environment variable validator
 * 
 * This utility helps ensure critical environment variables are loaded correctly
 * and logs helpful diagnostic information in development.
 */

export const validateEnvironment = () => {
  const environment = {
    AUTH_API_URL: import.meta.env.VITE_AUTH_API_URL,
    PHP_API_URL: import.meta.env.VITE_PHP_API_URL,
    WP_API_URL: import.meta.env.VITE_WP_API_URL,
    API_TIMEOUT: import.meta.env.VITE_API_TIMEOUT,
    ENV: import.meta.env.VITE_ENV,
  };

  // Only log in development mode
  if (environment.ENV === 'development') {
    console.group('Environment Configuration');
    
    Object.entries(environment).forEach(([key, value]) => {
      if (!value) {
        console.warn(`⚠️ Missing environment variable: VITE_${key}`);
      } else {
        console.log(`✓ VITE_${key}: ${value}`);
      }
    });
    
    console.groupEnd();
  }

  return environment;
};

// Automatically validate on import
export const envConfig = validateEnvironment(); 