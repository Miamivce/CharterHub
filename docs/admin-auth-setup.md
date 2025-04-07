# Setting Up WordPress Admin Authentication

This document provides step-by-step instructions for setting up the WordPress admin authentication system for CharterHub.

## Prerequisites

1. Local WordPress installation running on `http://localhost:8888`
2. PHP 7.4 or higher
3. Node.js and npm for the frontend

## WordPress Plugin Setup

The WordPress admin authentication requires a custom plugin to be installed on your WordPress instance.

### 1. Install the WordPress Plugin

1. Navigate to your WordPress plugins directory:
   ```bash
   cd /path/to/wordpress/wp-content/plugins
   ```

2. If the `charterhub-admin-auth` plugin directory doesn't exist, create it:
   ```bash
   mkdir charterhub-admin-auth
   ```

3. Create or ensure the main plugin file exists:
   ```bash
   touch charterhub-admin-auth/charterhub-admin-auth.php
   ```

4. Edit the plugin file with the following content:
   ```php
   <?php
   /**
    * Plugin Name: CharterHub Admin Authentication
    * Description: Custom REST API endpoint for CharterHub admin authentication
    * Version: 1.0
    * Author: Your Name
    */
   
   // If this file is called directly, abort.
   if (!defined('WPINC')) {
       die;
   }
   
   class CharterHub_Admin_Auth {
       public function __construct() {
           add_action('rest_api_init', [$this, 'register_rest_routes']);
           add_action('init', [$this, 'add_cors_support']);
       }
   
       public function add_cors_support() {
           // Add CORS headers for REST API requests
           add_filter('rest_pre_serve_request', function ($served, $result, $request) {
               header('Access-Control-Allow-Origin: *');
               header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE');
               header('Access-Control-Allow-Credentials: true');
               header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization');
               
               if ('OPTIONS' === $_SERVER['REQUEST_METHOD']) {
                   status_header(200);
                   exit();
               }
               
               return $served;
           }, 10, 3);
       }
   
       public function register_rest_routes() {
           register_rest_route('charterhub/v1', '/admin-login', [
               'methods' => 'POST',
               'callback' => [$this, 'admin_login'],
               'permission_callback' => '__return_true'
           ]);
       }
   
       public function admin_login($request) {
           $params = $request->get_params();
           
           if (!isset($params['username']) || !isset($params['password'])) {
               return new WP_Error(
                   'invalid_credentials',
                   'Username and password are required',
                   ['status' => 400]
               );
           }
           
           $username = sanitize_text_field($params['username']);
           $password = $params['password']; // Don't sanitize the password
           
           // Authenticate the user
           $user = wp_authenticate($username, $password);
           
           if (is_wp_error($user)) {
               return new WP_Error(
                   'authentication_failed',
                   $user->get_error_message(),
                   ['status' => 401]
               );
           }
           
           // Check if the user is an administrator
           if (!in_array('administrator', $user->roles)) {
               return new WP_Error(
                   'insufficient_permissions',
                   'User is not an administrator',
                   ['status' => 403]
               );
           }
           
           // Return user information
           return [
               'user_id' => $user->ID,
               'email' => $user->user_email,
               'firstName' => $user->first_name,
               'lastName' => $user->last_name,
               'display_name' => $user->display_name,
               'success' => true
           ];
       }
   }
   
   // Initialize the plugin
   new CharterHub_Admin_Auth();
   ```

5. Activate the plugin in your WordPress admin dashboard (Plugins > Installed Plugins).

## CharterHub Backend Setup

The backend runs on two PHP servers: one for client authentication (port 8000) and one for admin authentication (port 8001).

### 1. Start the PHP Servers

We've created a shell script that starts both PHP servers:

```bash
# From the project root directory
./start-servers.sh
```

This script will:
1. Kill any existing PHP servers running on ports 8000 and 8001
2. Start a new PHP server for client authentication on port 8000
3. Start a new PHP server for admin authentication on port 8001

### 2. Test WordPress Endpoint

To ensure the WordPress plugin is correctly installed and the endpoint is accessible:

```bash
# From the project root directory
cd backend
php wp-endpoint-test.php
```

This will test if the WordPress REST API and our custom endpoint are accessible.

## Frontend Configuration

The frontend is configured to use different API endpoints for client and admin authentication.

### 1. Environment Variables

Create or update `.env.local` in the frontend directory:

```
# API URLs
VITE_PHP_API_URL=http://localhost:8000
VITE_PHP_ADMIN_API_URL=http://localhost:8001

# WordPress URL
VITE_WORDPRESS_URL=http://localhost:8888

# Development settings
VITE_ENV=development
```

### 2. Start the Frontend

```bash
# From the project root directory
cd frontend
npm run dev
```

This will start the frontend development server. By default, it will try to use port 3000, but if that's in use, it will select the next available port.

## Testing the Authentication

1. Navigate to the admin login page in your browser
2. Enter WordPress admin credentials from your local installation
3. If everything is set up correctly, you should be authenticated and redirected to the admin dashboard

## Troubleshooting

### CORS Issues

If you encounter CORS errors:

1. Verify that the WordPress plugin is correctly adding CORS headers
2. Check that the PHP server for admin authentication is running on port 8001
3. Ensure the frontend is properly configured to use the correct endpoint URLs

### Authentication Errors

If authentication fails:

1. Check the WordPress user credentials
2. Verify that the user has administrator role
3. Look at the PHP error logs for more information

### Port Conflicts

If you see "Address already in use" errors:

1. Use `pkill -f "php -S localhost:8000"` to kill any existing PHP server on port 8000
2. Use `pkill -f "php -S localhost:8001"` to kill any existing PHP server on port 8001
3. Try using different ports if needed and update the environment variables accordingly

## Production Deployment

In production, the separate port approach is not needed. Instead:

1. The frontend will be hosted on Vercel
2. The backend endpoints will be properly routed through the web server (nginx/apache)
3. The WordPress REST API endpoint will be available at the production WordPress installation 