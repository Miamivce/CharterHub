# CharterHub Environment Setup

A comprehensive guide to setting up the CharterHub development environment.

## Prerequisites

- PHP 8.4 or higher
- MySQL 8.0 or higher
- Node.js 18.0 or higher
- npm 9.0 or higher

## Initial Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/charterhub.git
   cd charterhub
   ```

2. **Set up environment variables**

   Copy the template files and customize as needed:

   ```bash
   cp backend/.env.template backend/.env
   cp frontend/.env.template frontend/.env
   ```

3. **Set up the database**

   Create a MySQL database named `charterhub_local` and update the database credentials in `backend/.env`.

4. **Install backend dependencies**

   ```bash
   cd backend
   composer install
   ```

5. **Install frontend dependencies**

   ```bash
   cd frontend
   npm install
   ```

6. **Initialize the database**

   ```bash
   cd backend
   php init-database.php
   ```

7. **Verify the database structure**

   ```bash
   php verify-database.php
   ```

8. **Migrate user data**

   ```bash
   php migrate-refresh-tokens.php
   ```

## Starting the Development Environment

Use the provided scripts to start the development environment:

```bash
# Make the scripts executable
chmod +x server-start.sh setup-dev-environment.sh

# Start both backend and frontend servers
./setup-dev-environment.sh
```

Or start them individually:

```bash
# Start the backend server
./server-start.sh

# Start the frontend server
cd frontend
npm run dev
```

## Accessing the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

## Troubleshooting

### Port Already in Use

If you see an error like "Failed to listen on localhost:8000 (reason: Address already in use)", kill the existing process:

```bash
pkill -f "php -S localhost:8000"
```

### Database Connection Issues

Verify your database credentials in `backend/.env` and ensure the MySQL server is running.

### Missing Tables

If you see errors about missing tables, run the initialization script:

```bash
cd backend
php init-database.php
```

### 404 Errors for Backend Files

Ensure you're starting the PHP server from the correct directory:

```bash
cd backend
php -S localhost:8000
```

## Database Structure

The application uses the following tables:

- `wp_users`: Standard WordPress users table
- `wp_usermeta`: Standard WordPress user metadata table
- `wp_charterhub_users`: Custom table for CharterHub user data, including refresh tokens

## Development Guidelines

- Always use the provided scripts to start the development environment
- Run `verify-database.php` after making changes to the database structure
- Use the centralized configuration files for database access
- Follow the established code structure and naming conventions
