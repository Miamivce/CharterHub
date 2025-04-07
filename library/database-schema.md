# CharterHub Database Schema

This document describes the database schema used by the CharterHub application.

## Tables

### wp_users

Standard WordPress users table that stores basic user information.

| Column | Type | Description |
|--------|------|-------------|
| ID | bigint(20) | Primary key |
| user_login | varchar(60) | Username for login |
| user_pass | varchar(255) | Hashed password |
| user_nicename | varchar(50) | URL-friendly username |
| user_email | varchar(100) | User's email address |
| user_url | varchar(100) | User's website URL |
| user_registered | datetime | Registration date and time |
| user_activation_key | varchar(255) | Password reset key |
| user_status | int(11) | User status (deprecated) |
| display_name | varchar(250) | Name displayed publicly |

### wp_usermeta

Standard WordPress user metadata table that stores additional user information.

| Column | Type | Description |
|--------|------|-------------|
| umeta_id | bigint(20) | Primary key |
| user_id | bigint(20) | Foreign key to wp_users.ID |
| meta_key | varchar(255) | Metadata key |
| meta_value | longtext | Metadata value |

### wp_charterhub_users

Custom table for CharterHub user data, including refresh tokens.

| Column | Type | Description |
|--------|------|-------------|
| id | int | Primary key |
| wp_user_id | int | Foreign key to wp_users.ID |
| role | varchar(50) | User role (charter_client, administrator, etc.) |
| refresh_token | varchar(255) | JWT refresh token |
| token_expires | datetime | Refresh token expiration date and time |
| created_at | datetime | Record creation date and time |
| updated_at | datetime | Record update date and time |

## Relationships

- `wp_charterhub_users.wp_user_id` references `wp_users.ID` (foreign key)
- `wp_usermeta.user_id` references `wp_users.ID` (foreign key)

## Key Fields

### User Roles

User roles are stored in two places:

1. In `wp_usermeta` with `meta_key = '{prefix}capabilities'` as a serialized array
2. In `wp_charterhub_users.role` as a string

The application uses the role in `wp_charterhub_users` for authentication and authorization.

### Refresh Tokens

Refresh tokens are stored in `wp_charterhub_users.refresh_token` and are used to refresh JWT access tokens when they expire.

## Data Flow

1. User logs in with username/password
2. System generates JWT access token and refresh token
3. Refresh token is stored in `wp_charterhub_users.refresh_token`
4. When access token expires, system uses refresh token to generate a new access token
5. If refresh token expires, user must log in again

## Schema Maintenance

The database schema is maintained through the following scripts:

- `init-database.php`: Creates the required tables if they don't exist
- `verify-database.php`: Verifies the database structure and reports issues
- `migrate-refresh-tokens.php`: Migrates user data to the wp_charterhub_users table
