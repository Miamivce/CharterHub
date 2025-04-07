# WordPress Integration in CharterHub

*Last updated: March 11, 2025*

## ⚠️ IMPORTANT UPDATE: Complete Separation of User Systems

As of the latest update, CharterHub has **completely separated** its user system from WordPress. The following changes were implemented:

1. All WordPress users with the 'client' role have been removed
2. The `wp_user_id` column has been removed from `wp_charterhub_users` table
3. Authentication code has been updated to remove any synchronization between systems
4. Client authentication now exclusively uses the JWT token system

The information below is maintained for historical reference and applies only to admin authentication, which still uses WordPress.

## Current WordPress Dependencies

### Database Tables

The application uses the following WordPress-related tables:

1. **`wp_charterhub_users`**: The main user table for CharterHub users (now completely independent from WordPress).
2. **WordPress Core Tables**: `wp_users` and `wp_usermeta` are used for WordPress admin authentication.
3. **Other WordPress Tables**: Various WordPress tables for posts, options, etc. that support the WordPress backend.

### WordPress User Roles

After cleanup, the WordPress system now contains only the following user roles:
- **Administrator**: 2 users (for WordPress admin access)
- **Subscriber**: 4 users (standard WordPress accounts)

There are no longer any users with 'client' or 'none' roles in the WordPress system.

### Authentication System

The authentication system in CharterHub now features a complete separation between:

1. **CharterHub Authentication (Client Users):** Completely independent JWT-based authentication system for all client users.
2. **WordPress Authentication (Admin Only):** Used exclusively for admin users accessing the WordPress admin panel.

The following files are relevant to the WordPress admin authentication:

- `admin-auth.php`: Handles WordPress admin authentication (admin users only)
- `is-authenticated.php`: Updated to only use WordPress authentication for admin roles

## WordPress Integration Architecture

```
┌─────────────────────┐     ┌──────────────────────┐
│                     │     │                      │
│  CharterHub App     │     │  WordPress Admin     │
│                     │     │                      │
└──────────┬──────────┘     └──────────┬───────────┘
           │                           │
           │                           │
           ▼                           ▼
┌─────────────────────────────────────────────────┐
│                                                 │
│        Dual Authentication System               │
│                                                 │
│  ┌────────────────┐       ┌────────────────┐    │
│  │                │       │                │    │
│  │ JWT Auth       │       │ WordPress Auth │    │
│  │                │       │                │    │
│  └────────────────┘       └────────────────┘    │
│                                                 │
└─────────────────┬───────────────┬───────────────┘
                  │               │
                  ▼               ▼
┌─────────────────────┐  ┌──────────────────────┐
│                     │  │                      │
│  wp_charterhub_*    │  │  wp_users &          │
│  Tables             │  │  WordPress Tables    │
│                     │  │                      │
└─────────────────────┘  └──────────────────────┘
```

## Reasons for Integration

The WordPress integration is now limited to:

1. **Admin Access:** Maintaining admin access to WordPress for content management
2. **WordPress Functions:** Leveraging WordPress functions for admin-specific operations

Client users are now completely separated from WordPress, operating on an independent authentication system.

## Future Considerations

With the complete separation of client users from WordPress, the following considerations remain:

1. **Admin Authentication:** Consider whether admin users still need WordPress authentication
2. **Content Management:** Evaluate if WordPress is still needed for content management
3. **Complete Decoupling:** Plan for completely removing WordPress dependencies if desired

## Maintaining Integration

The WordPress integration is now minimal and applies only to admin users. To maintain it:

1. Ensure `admin-auth.php` is not used for client authentication
2. Only use WordPress authentication for admin roles
3. Do not recreate dependencies between client users and WordPress users

The client authentication system is now completely separate and should remain that way.

## Legacy Endpoints

Legacy endpoints in the `backend/client` directory have been deprecated and backed up to `backend/legacy_backup`. These endpoints return proper 410 Gone responses with explanatory messages.

---

**Last Updated**: March 11, 2025 