/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_WP_API_URL: string
  readonly VITE_PHP_API_URL: string
  readonly VITE_ADMIN_API_URL: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_FRONTEND_URL: string
  readonly VITE_WORDPRESS_URL: string
  readonly VITE_WORDPRESS_USERNAME: string
  readonly VITE_WORDPRESS_PASSWORD: string
  readonly VITE_WORDPRESS_APPLICATION_PASSWORD: string
  readonly VITE_GOOGLE_MAPS_API_KEY: string
  readonly VITE_USE_JWT: string
  readonly VITE_WP_LIVE_API_URL: string
  readonly VITE_DEBUG: string
  readonly VITE_MODE: string
  readonly MODE: string
  readonly DEV: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
