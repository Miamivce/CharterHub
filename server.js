// Root level Express server to handle redirection to frontend
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Redirect to frontend directory
app.get('/', (req, res) => {
  res.redirect('/frontend');
});

// Special handling for JS files
app.get('/env-config.js', (req, res) => {
  res.set('Content-Type', 'application/javascript; charset=utf-8');
  res.sendFile(path.join(__dirname, 'frontend', 'dist', 'env-config.js'));
});

app.get('/redirect.js', (req, res) => {
  res.set('Content-Type', 'application/javascript; charset=utf-8');
  res.sendFile(path.join(__dirname, 'frontend', 'dist', 'redirect.js'));
});

// Serve frontend files
app.use('/frontend', express.static(path.join(__dirname, 'frontend', 'dist')));

// Fallback to index.html for SPA routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Root server running on port ${port}`);
}); 