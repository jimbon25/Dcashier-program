const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 10000; // Render uses port 10000

// Security middleware
if (process.env.ENABLE_HELMET !== 'false') {
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));
}

// Compression middleware
if (process.env.ENABLE_COMPRESSION !== 'false') {
  app.use(compression());
}

// CORS configuration - SANGAT PENTING untuk frontend-backend komunikasi
const corsOptions = {
  origin: [
    'https://dcashier.netlify.app',
    'http://localhost:3000',
    'https://localhost:3000'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'x-csrf-token',
    'X-Requested-With',
    'Accept',
    'Accept-Version',
    'Content-Length',
    'Content-MD5',
    'Date',
    'X-Api-Version'
  ],
  exposedHeaders: ['x-csrf-token']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Basic routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'DCashier API Server - Render.com',
    version: '1.0.0',
    health: '/health',
    api: '/api',
    environment: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    message: 'Server is running on Render.com',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    version: '1.0.0'
  });
});

// Auth routes
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  console.log('Login attempt:', { username, password: '***' });
  
  if (username === 'admin' && password === 'admin123') {
    res.json({
      status: 'success',
      message: 'Login successful',
      data: {
        accessToken: 'render-token-' + Date.now(),
        refreshToken: 'render-refresh-' + Date.now(),
        role: 'admin'
      }
    });
  } else {
    res.status(401).json({
      status: 'error',
      message: 'Invalid credentials'
    });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;
  
  res.json({
    status: 'success',
    message: 'Registration successful',
    data: {
      accessToken: 'render-token-' + Date.now(),
      refreshToken: 'render-refresh-' + Date.now(),
      role: 'cashier'
    }
  });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({
    status: 'success',
    message: 'Logout successful'
  });
});

// Test endpoints
app.get('/api/products', (req, res) => {
  res.json({
    status: 'success',
    data: [
      { id: 1, name: 'Test Product', price: 10000 }
    ]
  });
});

app.get('/api/categories', (req, res) => {
  res.json({
    status: 'success',
    data: [
      { id: 1, name: 'Test Category' }
    ]
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method 
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
});

module.exports = app;
