# CharterHub

CharterHub is a booking and client management system with separate client and admin interfaces. The system utilizes a JWT-based authentication framework for secure access management with role-based permissions.

## Project Structure

```
CharterHub/
├── frontend/              # React/TypeScript frontend
│   ├── src/               # Source code
│   ├── package.json       # Frontend dependencies
│   ├── vite.config.ts     # Vite configuration
│   └── vercel.json        # Vercel deployment configuration
├── backend/               # PHP backend
│   ├── api/               # API endpoints
│   ├── auth/              # Authentication endpoints
│   ├── config/            # Configuration files
│   ├── setup/             # Database setup scripts
│   ├── utils/             # Utility functions
│   ├── uploads/           # File uploads directory (not checked into Git)
│   ├── index.php          # Backend entry point
│   └── vercel.json        # Vercel deployment configuration
└── .gitignore             # Git ignore file
```

## Development Setup

### Prerequisites

- PHP 7.4 or higher
- MySQL 5.7 or higher
- Node.js 14 or higher
- npm or yarn

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at http://localhost:3000

### Backend Setup

```bash
cd backend
# Configure the database
cp .env.template .env
# Edit .env with your database credentials
# Run the database setup script
php setup/setup-database.php
```

The backend API will be available at http://localhost:8000

### Running Both Frontend and Backend

Use the unified server script:

```bash
./start-unified-server.sh
```

## Deployment

### Vercel Deployment

#### Frontend Deployment

1. Push your code to a Git repository
2. Create a new project in Vercel
3. Connect your Git repository
4. Set the following environment variables:
   - `VITE_API_BASE_URL`: URL of your backend API

#### Backend Deployment

For the backend, you'll need a PHP hosting solution or a serverless PHP platform like Vercel with PHP support:

1. Push your code to a Git repository
2. Create a new project in Vercel
3. Connect your Git repository
4. Set the following environment variables:
   - `DB_HOST`: Your database host
   - `DB_USER`: Your database username
   - `DB_PASSWORD`: Your database password
   - `DB_NAME`: Your database name
   - `JWT_SECRET`: Secret for JWT tokens
   - `JWT_REFRESH_SECRET`: Secret for JWT refresh tokens
   - `FRONTEND_URL`: URL of your frontend application

### Database Considerations

For production, you'll need to set up a MySQL database. Consider using:

- Managed database services (AWS RDS, Google Cloud SQL, Digital Ocean Managed Databases)
- Make sure to secure your database properly and keep backups

## Key Features

- JWT-based authentication
- Role-based access control
- Booking management
- Client management
- Document handling
- Yacht and destination information

## API Documentation

The API provides endpoints for:

- Authentication (`/api/auth/*`)
- Admin management (`/api/admin/*`)
- Client operations (`/api/client/*`)
- General endpoints (`/api/yachts.php`, `/api/destinations.php`)

For detailed API documentation, see the [API Documentation](library/Charterhub_overview.md).

## License

This project is proprietary software. All rights reserved. 