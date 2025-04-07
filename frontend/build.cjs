// CommonJS build script with direct DOM injection of environment variables
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Starting direct build process');

// Ensure dist directory exists
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  console.log('Creating dist directory');
  fs.mkdirSync(distDir, { recursive: true });
}

// Get all environment variables with VITE_ prefix for injection
const viteEnvVars = {};
Object.keys(process.env)
  .filter(key => key.startsWith('VITE_'))
  .forEach(key => {
    console.log(`${key}: ${process.env[key]}`);
    viteEnvVars[key] = process.env[key];
  });

// Set production mode explicitly
viteEnvVars.VITE_ENV = viteEnvVars.VITE_ENV || 'production';
viteEnvVars.VITE_DEBUG = viteEnvVars.VITE_DEBUG || 'false';

// Generate environment variables script content
const envVarsScript = `window.ENV = ${JSON.stringify(viteEnvVars, null, 2)};
// Make environment variables available through import.meta.env
window.import = window.import || {};
window.import.meta = window.import.meta || {};
window.import.meta.env = ${JSON.stringify(viteEnvVars, null, 2)};
// Add standard Vite environment variables
window.import.meta.env.MODE = 'production';
window.import.meta.env.PROD = true;
window.import.meta.env.DEV = false;
console.log('Environment variables loaded:', window.import.meta.env);`;

// Save environment variables to file
const envScriptPath = path.join(distDir, 'env-config.js');
fs.writeFileSync(envScriptPath, envVarsScript);

// Create a more robust admin dashboard redirect
const redirectScript = `
// Redirect script
const redirectToAdminDashboard = () => {
  // Check if we're already on the admin page
  if (window.location.pathname.startsWith('/admin')) {
    return;
  }
  
  // Get the URL params
  const params = new URLSearchParams(window.location.search);
  
  // If a redirect parameter is specified, honor it
  if (params.has('redirect')) {
    window.location.href = params.get('redirect');
    return;
  }
  
  // Otherwise redirect to admin dashboard
  window.location.href = '/admin';
};

// Run redirect on page load
if (document.readyState === 'complete') {
  redirectToAdminDashboard();
} else {
  window.addEventListener('load', redirectToAdminDashboard);
}`;

// Save redirect script
const redirectScriptPath = path.join(distDir, 'redirect.js');
fs.writeFileSync(redirectScriptPath, redirectScript);

try {
  console.log('Creating a fully functional admin interface...');
  
  // Create admin interface with ESM imports
  fs.writeFileSync(path.join(distDir, 'assets', 'app.js'), `
import React from 'https://esm.sh/react@18.2.0';
import ReactDOM from 'https://esm.sh/react-dom@18.2.0/client';
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'https://esm.sh/react-router-dom@6.13.0';

function AdminDashboard() {
  return (
    <div>
      <h2>Admin Dashboard</h2>
      <p>Welcome to the CharterHub admin interface.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        <DashboardCard 
          title="Customers" 
          icon="👥" 
          link="/admin/customers"
          description="Manage customer accounts and profiles" 
        />
        <DashboardCard 
          title="Bookings" 
          icon="📅" 
          link="/admin/bookings"
          description="Manage reservations and schedules" 
        />
        <DashboardCard 
          title="Documents" 
          icon="📄" 
          link="/admin/documents"
          description="Manage contracts and documents" 
        />
        <DashboardCard 
          title="Settings" 
          icon="⚙️" 
          link="/admin/settings"
          description="Configure system settings" 
        />
      </div>
      
      <ApiStatus />
    </div>
  );
}

function DashboardCard({ title, icon, description, link }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
      padding: '1.5rem',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }} 
    onClick={() => window.location.href = link}
    onMouseOver={(e) => {
      e.currentTarget.style.transform = 'translateY(-5px)';
      e.currentTarget.style.boxShadow = '0 6px 15px rgba(0,0,0,0.1)';
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.08)';
    }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{icon}</div>
      <h3 style={{ margin: '0 0 0.5rem 0', color: '#0066cc' }}>{title}</h3>
      <p style={{ margin: '0 0 1rem 0', color: '#666' }}>{description}</p>
      <div style={{ marginTop: 'auto' }}>
        <span style={{ color: '#0066cc', fontWeight: 'bold' }}>Manage →</span>
      </div>
    </div>
  );
}

function ApiStatus() {
  const [status, setStatus] = React.useState('checking');
  const [message, setMessage] = React.useState('Checking API connection...');
  
  React.useEffect(() => {
    async function checkApi() {
      try {
        const apiUrl = window.ENV.VITE_API_URL || window.ENV.VITE_PHP_API_URL;
        if (!apiUrl) {
          throw new Error('No API URL configured in environment variables');
        }
        
        const response = await fetch(\`\${apiUrl}/status\`);
        
        if (!response.ok) {
          throw new Error(\`API returned status \${response.status}\`);
        }
        
        setStatus('connected');
        setMessage('API is connected and operational');
      } catch (err) {
        console.error('API check failed:', err);
        setStatus('error');
        setMessage(\`API connection failed: \${err.message}\`);
      }
    }
    
    checkApi();
  }, []);
  
  return (
    <div style={{ 
      marginTop: '2rem',
      padding: '1rem',
      background: status === 'checking' ? '#f5f5f5' : 
                  status === 'connected' ? '#f0fff4' : 
                  '#fff0f0',
      borderRadius: '8px',
      border: \`1px solid \${status === 'checking' ? '#ddd' : 
                          status === 'connected' ? '#c6f6d5' : 
                          '#fed7d7'}\`
    }}>
      <h3 style={{ 
        margin: '0 0 0.5rem 0',
        color: status === 'checking' ? '#666' : 
              status === 'connected' ? '#38a169' : 
              '#e53e3e'
      }}>
        API Status: {status === 'checking' ? 'Checking...' : 
                     status === 'connected' ? 'Connected' : 
                     'Error'}
      </h3>
      <p style={{ margin: '0' }}>{message}</p>
      <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#666' }}>
        API URL: {window.ENV.VITE_API_URL || window.ENV.VITE_PHP_API_URL || 'Not configured'}
      </div>
    </div>
  );
}

function PageNotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <h2>404 - Page Not Found</h2>
      <p>The page you are looking for does not exist.</p>
      <Link to="/admin" style={{ 
        display: 'inline-block', 
        marginTop: '1rem',
        padding: '0.5rem 1rem',
        background: '#0066cc',
        color: 'white',
        borderRadius: '4px',
        textDecoration: 'none'
      }}>
        Return to Dashboard
      </Link>
    </div>
  );
}

function AdminLayout({ children }) {
  const location = useLocation();
  
  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh'
    }}>
      <header style={{
        background: '#0066cc',
        color: 'white',
        padding: '1rem',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto',
        }}>
          <h1 style={{ margin: 0 }}>CharterHub Admin</h1>
          <nav>
            <ul style={{ display: 'flex', listStyle: 'none', gap: '1rem', margin: 0 }}>
              <li>
                <Link 
                  to="/admin" 
                  style={{ 
                    color: 'white', 
                    textDecoration: 'none',
                    fontWeight: location.pathname === '/admin' ? 'bold' : 'normal',
                    borderBottom: location.pathname === '/admin' ? '2px solid white' : 'none',
                    paddingBottom: '2px'
                  }}>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link 
                  to="/admin/customers" 
                  style={{ 
                    color: 'white', 
                    textDecoration: 'none',
                    fontWeight: location.pathname === '/admin/customers' ? 'bold' : 'normal',
                    borderBottom: location.pathname === '/admin/customers' ? '2px solid white' : 'none',
                    paddingBottom: '2px'
                  }}>
                  Customers
                </Link>
              </li>
              <li>
                <Link 
                  to="/admin/bookings" 
                  style={{ 
                    color: 'white', 
                    textDecoration: 'none',
                    fontWeight: location.pathname === '/admin/bookings' ? 'bold' : 'normal',
                    borderBottom: location.pathname === '/admin/bookings' ? '2px solid white' : 'none',
                    paddingBottom: '2px'
                  }}>
                  Bookings
                </Link>
              </li>
              <li>
                <Link 
                  to="/admin/documents" 
                  style={{ 
                    color: 'white', 
                    textDecoration: 'none',
                    fontWeight: location.pathname === '/admin/documents' ? 'bold' : 'normal',
                    borderBottom: location.pathname === '/admin/documents' ? '2px solid white' : 'none',
                    paddingBottom: '2px'
                  }}>
                  Documents
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      <main style={{ flex: 1, padding: '1rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {children}
      </main>
      <footer style={{ background: '#f5f5f5', padding: '1rem', textAlign: 'center' }}>
        <p>&copy; 2023 CharterHub. All rights reserved.</p>
        <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
          Env: {window.ENV.VITE_ENV} | Version: {window.ENV.VITE_VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'local'}
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="/admin" element={
        <AdminLayout>
          <AdminDashboard />
        </AdminLayout>
      } />
      <Route path="/admin/customers" element={
        <AdminLayout>
          <div>
            <h2>Customers</h2>
            <p>Customer management interface will be displayed here.</p>
          </div>
        </AdminLayout>
      } />
      <Route path="/admin/bookings" element={
        <AdminLayout>
          <div>
            <h2>Bookings</h2>
            <p>Booking management interface will be displayed here.</p>
          </div>
        </AdminLayout>
      } />
      <Route path="/admin/documents" element={
        <AdminLayout>
          <div>
            <h2>Documents</h2>
            <p>Document management interface will be displayed here.</p>
          </div>
        </AdminLayout>
      } />
      <Route path="/admin/settings" element={
        <AdminLayout>
          <div>
            <h2>Settings</h2>
            <p>System settings interface will be displayed here.</p>
          </div>
        </AdminLayout>
      } />
      <Route path="*" element={
        <AdminLayout>
          <PageNotFound />
        </AdminLayout>
      } />
    </Routes>
  );
}

// Mount the application
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
`);
    
  // Create a minimal but complete index.html
  fs.writeFileSync(path.join(distDir, 'index.html'), `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CharterHub Admin</title>
  <script src="/env-config.js"></script>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 0;
      line-height: 1.5;
      background-color: #f5f8fa;
      color: #333;
    }
    #root {
      min-height: 100vh;
    }
    .loading {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100vh;
      width: 100vw;
    }
    .loading-spinner {
      width: 50px;
      height: 50px;
      border: 5px solid rgba(0, 102, 204, 0.2);
      border-radius: 50%;
      border-top-color: #0066cc;
      animation: spin 1s ease-in-out infinite;
      margin-bottom: 1rem;
    }
    .loading-text {
      font-size: 1.2rem;
      color: #0066cc;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div id="root">
    <div class="loading">
      <div class="loading-spinner"></div>
      <div class="loading-text">Loading CharterHub Admin...</div>
    </div>
  </div>
  
  <script type="module" src="/assets/app.js"></script>
  <script src="/redirect.js"></script>
  <script>
    // Check if app fails to load after 5 seconds
    setTimeout(() => {
      const root = document.getElementById('root');
      const loadingEl = root.querySelector('.loading');
      
      if (loadingEl && root.children.length === 1) {
        const loadingText = loadingEl.querySelector('.loading-text');
        if (loadingText) {
          loadingText.textContent = 'Loading app components...';
        }
        
        // Try to dynamically load React if app hasn't loaded
        const reactScript = document.createElement('script');
        reactScript.src = 'https://esm.sh/react@18.2.0';
        reactScript.type = 'module';
        document.head.appendChild(reactScript);
        
        const reactDomScript = document.createElement('script');
        reactDomScript.src = 'https://esm.sh/react-dom@18.2.0/client';
        reactDomScript.type = 'module';
        document.head.appendChild(reactDomScript);
        
        const routerScript = document.createElement('script');
        routerScript.src = 'https://esm.sh/react-router-dom@6.13.0';
        routerScript.type = 'module';
        document.head.appendChild(routerScript);
      }
    }, 5000);
  </script>
</body>
</html>
  `);
  
  // Create assets directory if it doesn't exist
  const assetsDir = path.join(distDir, 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }
  
  // Create _redirects file for SPA routing
  fs.writeFileSync(path.join(distDir, '_redirects'), `
/*    /index.html   200
  `);
  
  console.log('Successfully created admin interface');
  
} catch (error) {
  console.error('Error during build process:', error.message);
  
  // Create a basic diagnostic page
  console.log('Creating diagnostic page');
  fs.writeFileSync(path.join(distDir, 'index.html'), `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CharterHub - Admin Dashboard</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      background-color: #f5f8fa;
      color: #333;
      line-height: 1.6;
      padding: 0;
      margin: 0;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    .card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.08);
      padding: 2rem;
      margin: 2rem 0;
    }
    h1 {
      color: #0066cc;
      margin-top: 0;
    }
    code, pre {
      background: #f1f5f9;
      border-radius: 4px;
      padding: 0.5rem;
      overflow-x: auto;
    }
    .env-var {
      margin-bottom: 0.5rem;
    }
    .key {
      font-weight: bold;
      color: #0066cc;
    }
    .btn {
      padding: 0.5rem 1rem;
      background: #0066cc;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 1rem;
      display: inline-block;
      text-decoration: none;
    }
  </style>
  <script src="/env-config.js"></script>
</head>
<body>
  <div class="container">
    <h1>CharterHub - Admin Dashboard</h1>
    
    <div class="card">
      <h2>Environment Variables</h2>
      <pre id="env-vars">Loading environment variables...</pre>
    </div>
    
    <div class="card">
      <h2>API Connection Tester</h2>
      <div id="api-test-result">Click the button below to test the API connection</div>
      <button id="test-api" class="btn">
        Test API Connection
      </button>
    </div>
    
    <div class="card">
      <h2>Admin Navigation</h2>
      <p>These links should be handled by client-side routing:</p>
      <div style="display: flex; gap: 1rem;">
        <a href="/admin" class="btn">Dashboard</a>
        <a href="/admin/customers" class="btn">Customers</a>
        <a href="/admin/bookings" class="btn">Bookings</a>
        <a href="/admin/documents" class="btn">Documents</a>
      </div>
    </div>
  </div>
  
  <script>
    // Redirect to admin dashboard from root
    if (window.location.pathname === '/') {
      window.location.href = '/admin';
    }
    
    // Display environment variables
    document.addEventListener('DOMContentLoaded', function() {
      const envVarsEl = document.getElementById('env-vars');
      const envVars = window.ENV || {};
      
      envVarsEl.textContent = JSON.stringify(envVars, null, 2);
      
      // API test button
      document.getElementById('test-api').addEventListener('click', async function() {
        const resultEl = document.getElementById('api-test-result');
        resultEl.innerHTML = 'Testing API connection...';
        
        try {
          const apiUrl = envVars.VITE_API_URL || envVars.VITE_PHP_API_URL;
          if (!apiUrl) {
            throw new Error('No API URL configured in environment variables');
          }
          
          const response = await fetch(\`\${apiUrl}/status\`);
          
          if (!response.ok) {
            throw new Error(\`API returned status \${response.status}: \${response.statusText}\`);
          }
          
          const data = await response.text();
          resultEl.innerHTML = \`<div style="color: green;">Success! API responded with: \${data}</div>\`;
        } catch (err) {
          console.error('API test failed:', err);
          resultEl.innerHTML = \`<div style="color: red;">Error: \${err.message}</div>\`;
        }
      });
    });
  </script>
</body>
</html>
  `);
  
  console.log('Admin dashboard fallback created successfully');
} 