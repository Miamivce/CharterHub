<?php
/**
 * CharterHub Local Development Configuration
 */

// ** MySQL settings ** //
define( 'DB_NAME', 'charterhub_local' );
define( 'DB_USER', 'root' );
define( 'DB_PASSWORD', 'root' );
define( 'DB_HOST', 'localhost:8889' );
define( 'DB_CHARSET', 'utf8mb4' );
define( 'DB_COLLATE', '' );

// ** Authentication Unique Keys and Salts ** //
define('AUTH_KEY',         'Ej+Y-|GQ-u|+P|5UO-&K|nx-&Xt47Hs+|4w-&m.K|5UO-&K');
define('SECURE_AUTH_KEY',  'Hs+|4w-&m.K|5UO-&K|nx-&Xt47Hs+|4w-&m.K|5UO-&K');
define('LOGGED_IN_KEY',    'K|5UO-&K|nx-&Xt47Hs+|4w-&m.K|5UO-&K|nx-&Xt47H');
define('NONCE_KEY',        'nx-&Xt47Hs+|4w-&m.K|5UO-&K|nx-&Xt47Hs+|4w-&m.');
define('AUTH_SALT',        '4w-&m.K|5UO-&K|nx-&Xt47Hs+|4w-&m.K|5UO-&K|nx-');
define('SECURE_AUTH_SALT', 'm.K|5UO-&K|nx-&Xt47Hs+|4w-&m.K|5UO-&K|nx-&Xt4');
define('LOGGED_IN_SALT',   'O-&K|nx-&Xt47Hs+|4w-&m.K|5UO-&K|nx-&Xt47Hs+|4');
define('NONCE_SALT',       'x-&Xt47Hs+|4w-&m.K|5UO-&K|nx-&Xt47Hs+|4w-&m.K');

// ** WordPress Database Table prefix ** //
$table_prefix = 'wp_';

// ** Development Settings ** //
define( 'WP_DEBUG', true );
define( 'WP_DEBUG_LOG', true );
define( 'WP_DEBUG_DISPLAY', true );
@ini_set( 'display_errors', 1 );

// ** Custom Settings for CharterHub ** //
define( 'WP_ENVIRONMENT_TYPE', 'local' );
define( 'CHARTERHUB_JWT_SECRET', 'local-dev-'.hash('sha256', 'charterhub-local-dev-'.time()) );
define( 'FS_METHOD', 'direct' );
define( 'AUTOMATIC_UPDATER_DISABLED', true );

// ** WordPress Address (URL) ** //
define( 'WP_SITEURL', 'http://localhost:8888' );
define( 'WP_HOME', 'http://localhost:8888' );

// ** Memory Settings ** //
define( 'WP_MEMORY_LIMIT', '256M' );
define( 'WP_MAX_MEMORY_LIMIT', '256M' );

// ** Security Settings ** //
define( 'DISALLOW_FILE_EDIT', true );
define( 'FORCE_SSL_ADMIN', false );

// ** API Settings ** //
define( 'WP_REST_API_ENABLE_CORS', true );

// ** Cache Settings ** //
define( 'WP_CACHE', false );

// ** Custom Upload Path ** //
define( 'UPLOADS', 'wp-content/uploads' );

// ** That's all, stop editing! ** //
if ( ! defined( 'ABSPATH' ) ) {
    define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';
