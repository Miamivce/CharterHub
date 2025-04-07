/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WP_API_URL: string
  readonly VITE_WP_USERNAME: string
  readonly VITE_WORDPRESS_APPLICATION_PASSWORD: string
  readonly VITE_API_TIMEOUT: string
  readonly VITE_MAX_RETRIES: string
  readonly VITE_API_RETRY_DELAY: string
  readonly VITE_AUTH_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 