# CharterHub Directory Structure

This document outlines the expected directory structure for the CharterHub project and explains how the various components relate to each other.

## Project Root Structure

```
CharterHub/
├── backend/             # PHP backend code
│   ├── auth/            # Authentication-related endpoints
│   ├── customers/       # Customer management endpoints
│   ├── bootstrap.php    # Application initialization
│   ├── db-config.php    # Database configuration
│   └── ...
├── frontend/            # React/Vite frontend code
│   ├── src/             # Frontend source code
│   ├── public/          # Static assets
│   ├── package.json     # Frontend dependencies
│   └── ...
├── library/             # Documentation and reference materials
├── scripts/             # Utility scripts for development
├── .project-root        # Marker file to identify project root
├── server-start.sh      # Script to start the backend server
└── setup-dev-environment.sh  # Script to set up the entire dev environment
```

## Important Directories

### Backend (`/backend`)

The backend directory contains all PHP code and must be the document root for the PHP server. When starting the PHP server, you must either:

1. Start the server from within the `backend` directory:
   ```bash
   cd backend && php -S localhost:8000
   ```

2. OR specify the backend directory as the document root using the `-t` flag:
   ```bash
   php -S localhost:8000 -t backend
   ```

**IMPORTANT**: Starting the PHP server from any other directory without the `-t` flag will result in 404 errors for endpoints like `/auth/csrf-token.php`.

### Frontend (`/frontend`)

The frontend directory contains the React/Vite application. To start the frontend server:

```bash
cd frontend && npm run dev
```

## Server Configuration

### Backend Server

- **Port**: 8000
- **Document Root**: Must be the `backend` directory
- **Environment Variables**: Configured in `backend/.env`

### Frontend Server

- **Port**: 3000 (may fallback to 3001 if 3000 is in use)
- **Environment Variables**: Configured in `frontend/.env`

## Common Issues

1. **404 Errors for API Endpoints**: This usually means the PHP server was started from the wrong directory. Make sure to start it from the `backend` directory or use the `-t` flag.

2. **Port Already in Use**: Use the provided scripts to kill existing processes before starting servers.

3. **Missing npm Scripts**: If you encounter "Missing script" errors, check the `package.json` file in the frontend directory.

## Best Practices

Always use the provided scripts to start the servers:

```bash
./server-start.sh        # Start the backend server
./setup-dev-environment.sh  # Start both backend and frontend servers
```

These scripts ensure that the servers are started from the correct directories with the proper configuration. 