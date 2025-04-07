# WordPress Document Integration Plan

## Overview
This document outlines how to safely integrate document storage with WordPress without modifying the existing website. We'll use WordPress's Media Library and custom post types through the REST API.

## 1. Authentication Setup

### 1.1 Application Passwords
Application passwords have been configured for secure API access. These should be used for all API requests instead of regular user credentials.

```javascript
// Example API request with application password
const makeApiRequest = async (endpoint) => {
    const credentials = {
        username: process.env.WP_API_USERNAME,
        password: process.env.WP_API_PASSWORD
    };
    
    const headers = {
        'Authorization': 'Basic ' + btoa(`${credentials.username}:${credentials.password}`),
        'Content-Type': 'application/json'
    };
    
    const response = await fetch(`${process.env.WP_API_URL}${endpoint}`, {
        headers: headers
    });
    
    return response.json();
};
```

### 1.2 Security Considerations
- Store credentials in environment variables
- Never commit credentials to version control
- Rotate application passwords regularly
- Monitor API access logs
- Implement rate limiting
- Use HTTPS for all API requests

## 1. WordPress Configuration

### 1.1 Custom Post Type Setup
```php
// In your custom plugin file (charterhub-api/plugin.php)
function charterhub_register_document_post_type() {
    register_post_type('charterhub_document', [
        'public' => false,
        'show_ui' => true,
        'show_in_rest' => true,
        'supports' => ['title', 'custom-fields'],
        'labels' => [
            'name' => 'Charter Documents',
            'singular_name' => 'Charter Document'
        ]
    ]);
}
add_action('init', 'charterhub_register_document_post_type');
```

### 1.2 Custom Meta Fields
```php
// Register meta fields for documents
function charterhub_register_document_meta() {
    register_post_meta('charterhub_document', 'document_type', [
        'type' => 'string',
        'single' => true,
        'show_in_rest' => true
    ]);
    register_post_meta('charterhub_document', 'document_category', [
        'type' => 'string',
        'single' => true,
        'show_in_rest' => true
    ]);
    register_post_meta('charterhub_document', 'uploaded_by', [
        'type' => 'integer',
        'single' => true,
        'show_in_rest' => true
    ]);
    // Add more meta fields as needed
}
add_action('init', 'charterhub_register_document_meta');
```

## 2. REST API Endpoints

### 2.1 Document Upload Endpoint
```php
function charterhub_register_document_endpoints() {
    register_rest_route('charterhub/v1', '/documents', [
        'methods' => 'POST',
        'callback' => 'handle_document_upload',
        'permission_callback' => function() {
            return current_user_can('upload_files');
        },
        'args' => [
            'title' => [
                'required' => true,
                'type' => 'string'
            ],
            'document_type' => [
                'required' => true,
                'type' => 'string'
            ]
        ]
    ]);
}
add_action('rest_api_init', 'charterhub_register_document_endpoints');
```

## 3. Frontend Integration

### 3.1 API Service Setup
```typescript
// frontend/src/services/documentApi.ts

interface UploadDocumentResponse {
  success: boolean;
  document_id: number;
  url: string;
  attachment_id: number;
}

export const documentApi = {
  async uploadDocument(file: File, metadata: {
    title: string;
    document_type: string;
    document_category: string;
    description?: string;
  }): Promise<UploadDocumentResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', metadata.title);
    formData.append('document_type', metadata.document_type);
    formData.append('document_category', metadata.document_category);
    if (metadata.description) {
      formData.append('description', metadata.description);
    }

    const response = await fetch('/wp-json/charterhub/v1/documents', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return response.json();
  }
};
```

## 4. Security Considerations

### 4.1 File Type Restrictions
```php
function charterhub_allowed_file_types($mimes) {
    // Only allow specific file types
    return [
        'pdf' => 'application/pdf',
        'jpg|jpeg' => 'image/jpeg',
        'png' => 'image/png'
    ];
}
add_filter('upload_mimes', 'charterhub_allowed_file_types');
```

### 4.2 File Size Limits
```php
function charterhub_max_upload_size($size) {
    // Limit uploads to 5MB
    return 5 * 1024 * 1024;
}
add_filter('upload_size_limit', 'charterhub_max_upload_size');
```

## 5. Implementation Steps

1. **Plugin Installation**
   - Create a new directory `wp-content/plugins/charterhub-api`
   - Create the main plugin file `charterhub-api.php`
   - Copy all PHP code snippets into appropriate files
   - Activate the plugin through WordPress admin

2. **Frontend Updates**
   - Add the API service file to your frontend project
   - Update document upload logic to use the new API
   - Implement proper error handling
   - Add loading states and progress indicators

3. **Testing**
   - Test file uploads with various file types and sizes
   - Verify document metadata is correctly stored
   - Check file permissions and access control
   - Test error scenarios and edge cases

## 6. Error Handling

### 6.1 Common Issues and Solutions

1. **Upload Fails**
   - Check file size limits
   - Verify file type is allowed
   - Ensure user has proper permissions
   - Check WordPress upload directory permissions

2. **File Not Found**
   - Verify file URL is correct
   - Check if file was actually uploaded
   - Ensure media library permissions are correct

3. **Permission Denied**
   - Verify user authentication
   - Check user role permissions
   - Ensure JWT token is valid and not expired

## 7. Maintenance

### 7.1 Regular Tasks
- Monitor WordPress media library size
- Clean up unused attachments
- Verify backup systems are working
- Check error logs for issues
- Update file type restrictions as needed

### 7.2 Backup Considerations
- Include media library in backups
- Back up document post type data
- Store metadata backups separately
- Document recovery procedures

## 8. Performance Optimization

### 8.1 Media Library
```php
// Add custom image sizes if needed
add_image_size('document-thumbnail', 300, 300, true);

// Optimize uploads directory structure
function charterhub_custom_upload_directory($uploads) {
    $uploads['subdir'] = '/charterhub-documents' . $uploads['subdir'];
    $uploads['path'] = $uploads['basedir'] . $uploads['subdir'];
    $uploads['url'] = $uploads['baseurl'] . $uploads['subdir'];
    return $uploads;
}
add_filter('upload_dir', 'charterhub_custom_upload_directory');
```

### 8.2 Caching
```php
// Add cache headers for document files
function charterhub_document_cache_headers() {
    if (is_singular('charterhub_document')) {
        header('Cache-Control: private, max-age=3600');
    }
}
add_action('template_redirect', 'charterhub_document_cache_headers');
```

## 9. Monitoring and Logging

### 9.1 Error Logging
```php
function charterhub_log_upload_error($error_message, $context = []) {
    if (!defined('WP_DEBUG_LOG') || !WP_DEBUG_LOG) {
        return;
    }
    error_log(sprintf(
        '[CharterHub] Upload Error: %s | Context: %s',
        $error_message,
        json_encode($context)
    ));
}
```

### 9.2 Usage Statistics
```php
function charterhub_track_upload_stats($document_id) {
    $stats = get_option('charterhub_upload_stats', []);
    $stats['total_uploads'] = ($stats['total_uploads'] ?? 0) + 1;
    $stats['last_upload'] = current_time('mysql');
    update_option('charterhub_upload_stats', $stats);
}
add_action('charterhub_document_uploaded', 'charterhub_track_upload_stats');
```

## 10. Troubleshooting Guide

### Common Issues

1. **Upload Permission Denied**
   ```
   Error: User cannot upload files
   Solution: Check user role and capabilities
   Code: current_user_can('upload_files')
   ```

2. **File Size Too Large**
   ```
   Error: File exceeds size limit
   Solution: Adjust PHP and WordPress upload limits
   File: php.ini or wp-config.php
   ```

3. **Invalid File Type**
   ```
   Error: File type not allowed
   Solution: Add MIME type to allowed list
   Function: charterhub_allowed_file_types()
   ```

### Debugging Steps

1. Enable WordPress debug mode:
   ```php
   // In wp-config.php
   define('WP_DEBUG', true);
   define('WP_DEBUG_LOG', true);
   define('WP_DEBUG_DISPLAY', false);
   ```

2. Check error logs:
   ```bash
   tail -f wp-content/debug.log
   ```

3. Test API endpoints:
   ```bash
   curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -F "file=@test.pdf" \
     -F "title=Test Document" \
     -F "document_type=file" \
     -F "document_category=passport_details" \
     http://your-site.com/wp-json/charterhub/v1/documents
   ```

## 11. Future Considerations

1. **Scaling**
   - Implement cloud storage integration
   - Add CDN support
   - Optimize database queries
   - Add bulk upload support

2. **Features**
   - Document versioning
   - Automatic file conversion
   - Preview generation
   - Document expiration

3. **Security**
   - Regular security audits
   - File scanning integration
   - Access logging
   - Encryption at rest

## 12. User Management Integration

### 12.1 User Roles Setup
```php
function charterhub_setup_user_roles() {
    // Add Charter Client role
    add_role('charter_client', 'Charter Client', [
        'read' => true,
        'upload_files' => true,
        'edit_posts' => false
    ]);

    // Add Charter Admin role
    add_role('charter_admin', 'Charter Admin', [
        'read' => true,
        'upload_files' => true,
        'edit_posts' => true,
        'manage_options' => true,
        'edit_others_posts' => true,
        'publish_posts' => true,
        'delete_posts' => true
    ]);
}
add_action('init', 'charterhub_setup_user_roles');
```

### 12.2 User Meta Fields
```php
function charterhub_register_user_meta() {
    // Client-specific fields
    register_meta('user', 'phone_number', [
        'type' => 'string',
        'single' => true,
        'show_in_rest' => true,
        'auth_callback' => function() { 
            return current_user_can('edit_user');
        }
    ]);
    
    register_meta('user', 'company', [
        'type' => 'string',
        'single' => true,
        'show_in_rest' => true,
        'auth_callback' => function() {
            return current_user_can('edit_user');
        }
    ]);

    register_meta('user', 'country', [
        'type' => 'string',
        'single' => true,
        'show_in_rest' => true,
        'auth_callback' => function() {
            return current_user_can('edit_user');
        }
    ]);

    // Admin-specific fields
    register_meta('user', 'admin_permissions', [
        'type' => 'array',
        'single' => true,
        'show_in_rest' => [
            'schema' => [
                'type' => 'array',
                'items' => ['type' => 'string']
            ]
        ],
        'auth_callback' => function() {
            return current_user_can('manage_options');
        }
    ]);
}
add_action('init', 'charterhub_register_user_meta');
```

### 12.3 User Management API Endpoints
```php
function charterhub_register_user_routes() {
    // Register client
    register_rest_route('charterhub/v1', '/clients', [
        'methods' => 'POST',
        'callback' => 'charterhub_create_client',
        'permission_callback' => 'charterhub_verify_admin_permission',
        'args' => [
            'email' => [
                'required' => true,
                'type' => 'string',
                'format' => 'email'
            ],
            'firstName' => [
                'required' => true,
                'type' => 'string'
            ],
            'lastName' => [
                'required' => true,
                'type' => 'string'
            ],
            'phone' => [
                'type' => 'string'
            ],
            'company' => [
                'type' => 'string'
            ],
            'country' => [
                'type' => 'string'
            ]
        ]
    ]);

    // Update client profile
    register_rest_route('charterhub/v1', '/clients/(?P<id>[\d]+)', [
        'methods' => 'PUT',
        'callback' => 'charterhub_update_client',
        'permission_callback' => 'charterhub_verify_client_permission',
        'args' => [
            'id' => [
                'required' => true,
                'type' => 'integer'
            ]
        ]
    ]);
}
add_action('rest_api_init', 'charterhub_register_user_routes');

function charterhub_create_client($request) {
    $user_data = [
        'user_login' => $request['email'],
        'user_email' => $request['email'],
        'first_name' => $request['firstName'],
        'last_name' => $request['lastName'],
        'user_pass' => wp_generate_password(),
        'role' => 'charter_client'
    ];

    $user_id = wp_insert_user($user_data);

    if (is_wp_error($user_id)) {
        return new WP_Error('user_create_failed', $user_id->get_error_message(), ['status' => 400]);
    }

    // Add additional user meta
    update_user_meta($user_id, 'phone_number', $request['phone']);
    update_user_meta($user_id, 'company', $request['company']);
    update_user_meta($user_id, 'country', $request['country']);

    // Send welcome email with password reset link
    $reset_key = get_password_reset_key($user_id);
    if (!is_wp_error($reset_key)) {
        $reset_link = network_site_url("wp-login.php?action=rp&key=$reset_key&login=" . rawurlencode($user_data['user_login']));
        // Send email with reset_link
    }

    return [
        'success' => true,
        'user_id' => $user_id
    ];
}

function charterhub_verify_admin_permission() {
    return current_user_can('manage_options') || current_user_can('charter_admin');
}

function charterhub_verify_client_permission($request) {
    $user_id = $request['id'];
    return get_current_user_id() === $user_id || current_user_can('manage_options');
}
```

### 12.4 Authentication Integration
```php
function charterhub_authenticate_user($user, $username, $password) {
    if (is_wp_error($user)) {
        return $user;
    }

    // Check if user has required role
    if (!in_array('charter_client', (array) $user->roles) && 
        !in_array('charter_admin', (array) $user->roles)) {
        return new WP_Error(
            'invalid_role',
            'User does not have permission to access the charter system.'
        );
    }

    return $user;
}
add_filter('authenticate', 'charterhub_authenticate_user', 30, 3);
```

### 12.5 Frontend Integration

```typescript
// frontend/src/services/userApi.ts

interface CreateClientResponse {
    success: boolean;
    user_id: number;
}

interface ClientData {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    company?: string;
    country?: string;
}

export const userApi = {
    async createClient(data: ClientData): Promise<CreateClientResponse> {
        const response = await fetch('/wp-json/charterhub/v1/clients', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Failed to create client');
        }

        return response.json();
    },

    async updateClient(userId: number, data: Partial<ClientData>): Promise<void> {
        const response = await fetch(`/wp-json/charterhub/v1/clients/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Failed to update client');
        }
    }
};
```

### 12.6 Security Considerations for User Management

1. **Password Security**
```php
function charterhub_password_requirements($errors, $update, $user) {
    if ($update) {
        return;
    }

    $password = isset($_POST['pass1']) ? $_POST['pass1'] : false;
    
    if ($password && strlen($password) < 12) {
        $errors->add('password_too_short', 
            'Password must be at least 12 characters long');
    }
    
    if ($password && !preg_match('/[A-Z]/', $password)) {
        $errors->add('password_no_upper', 
            'Password must contain at least one uppercase letter');
    }
    
    if ($password && !preg_match('/[a-z]/', $password)) {
        $errors->add('password_no_lower', 
            'Password must contain at least one lowercase letter');
    }
    
    if ($password && !preg_match('/[0-9]/', $password)) {
        $errors->add('password_no_number', 
            'Password must contain at least one number');
    }
}
add_action('user_profile_update_errors', 'charterhub_password_requirements', 10, 3);
```

2. **Login Security**
```php
function charterhub_limit_login_attempts($user, $username) {
    if (is_wp_error($user)) {
        $failed_attempts = get_transient('failed_login_' . $username);
        
        if ($failed_attempts === false) {
            set_transient('failed_login_' . $username, 1, HOUR_IN_SECONDS);
        } else if ($failed_attempts >= 5) {
            return new WP_Error('too_many_attempts', 
                'Too many failed login attempts. Please try again later.');
        } else {
            set_transient('failed_login_' . $username, $failed_attempts + 1, HOUR_IN_SECONDS);
        }
    }
    
    return $user;
}
add_filter('authenticate', 'charterhub_limit_login_attempts', 30, 2);
```

### 12.7 Implementation Steps for User Management

1. **Database Preparation**
   - Backup existing WordPress users and roles
   - Document existing user meta fields
   - Plan migration strategy for existing users

2. **Role Setup**
   - Add custom roles (charter_client, charter_admin)
   - Configure role capabilities
   - Test role permissions

3. **User Meta Setup**
   - Register custom user meta fields
   - Set up meta field validation
   - Configure REST API access

4. **API Implementation**
   - Create user management endpoints
   - Implement authentication checks
   - Add error handling

5. **Testing**
   - Test user creation
   - Verify role assignments
   - Check meta field storage
   - Validate API endpoints

6. **Security Audit**
   - Review permission settings
   - Test authentication flows
   - Verify data encryption
   - Check password policies

## 13. Future Considerations

1. **Scaling**
   - Implement cloud storage integration
   - Add CDN support
   - Optimize database queries
   - Add bulk upload support

2. **Features**
   - Document versioning
   - Automatic file conversion
   - Preview generation
   - Document expiration

3. **Security**
   - Regular security audits
   - File scanning integration
   - Access logging
   - Encryption at rest 