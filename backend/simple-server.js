const http = require('http');
const url = require('url');
const querystring = require('querystring');

const port = parseInt(process.env.PORT) || 8000;

// CORS headers - allow both possible Netlify URLs
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://d-cashier.netlify.app',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-csrf-token',
  'Access-Control-Allow-Credentials': 'true'
};

// Parse request body
function parseBody(req, callback) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  req.on('end', () => {
    try {
      const parsed = JSON.parse(body);
      callback(null, parsed);
    } catch (error) {
      callback(error, null);
    }
  });
}

// Create server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  // Set CORS headers
  Object.keys(corsHeaders).forEach(key => {
    res.setHeader(key, corsHeaders[key]);
  });

  // Handle preflight requests
  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Set content type to JSON
  res.setHeader('Content-Type', 'application/json');

  console.log(`${method} ${path}`);

  // Routes
  if (path === '/' && method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      message: 'DCashier API Server - Railway',
      version: '1.0.0',
      health: '/health',
      api: '/api',
      environment: 'production',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  if (path === '/health' && method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'OK',
      message: 'Server is running on Railway',
      timestamp: new Date().toISOString(),
      environment: 'production',
      version: '1.0.0'
    }));
    return;
  }

  if (path === '/api/auth/login' && method === 'POST') {
    parseBody(req, (error, body) => {
      if (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ status: 'error', message: 'Invalid JSON' }));
        return;
      }

      const { username, password } = body;
      console.log('Login attempt:', { username, password: '***' });

      if (username === 'admin' && password === 'admin123') {
        res.writeHead(200);
        res.end(JSON.stringify({
          status: 'success',
          message: 'Login successful',
          data: {
            accessToken: 'render-token-' + Date.now(),
            refreshToken: 'render-refresh-' + Date.now(),
            role: 'admin'
          }
        }));
      } else {
        res.writeHead(401);
        res.end(JSON.stringify({
          status: 'error',
          message: 'Invalid credentials'
        }));
      }
    });
    return;
  }

  if (path === '/api/auth/register' && method === 'POST') {
    parseBody(req, (error, body) => {
      if (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ status: 'error', message: 'Invalid JSON' }));
        return;
      }

      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'success',
        message: 'Registration successful',
        data: {
          accessToken: 'render-token-' + Date.now(),
          refreshToken: 'render-refresh-' + Date.now(),
          role: 'cashier'
        }
      }));
    });
    return;
  }

  if (path === '/api/auth/logout' && method === 'POST') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'success',
      message: 'Logout successful'
    }));
    return;
  }

  if (path === '/api/products' && method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'success',
      data: [
        { id: 1, name: 'Test Product', price: 10000 }
      ]
    }));
    return;
  }

  if (path === '/api/categories' && method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'success',
      data: [
        { id: 1, name: 'Test Category' }
      ]
    }));
    return;
  }

  // Transactions endpoint
  if (path === '/api/transactions' && method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'success',
      data: [
        { 
          id: '1', 
          timestamp: Date.now(),
          total_amount: 25000,
          payment_amount: 30000,
          change_amount: 5000,
          payment_method: 'Cash',
          items: [{ 
            product_id: '1',
            product_name: 'Test Product', 
            price_at_sale: 25000, 
            quantity: 1 
          }]
        }
      ]
    }));
    return;
  }

  // Reports endpoints
  if (path === '/api/reports/daily-sales' && method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'success',
      data: {
        total: 100000,
        count: 5,
        date: new Date().toISOString().split('T')[0]
      }
    }));
    return;
  }

  if (path === '/api/reports/profit-loss' && method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'success',
      data: {
        profit: 50000,
        loss: 10000,
        net: 40000
      }
    }));
    return;
  }

  // Users endpoint
  if (path === '/api/users' && method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'success',
      data: [
        { id: 1, username: 'admin', role: 'admin' },
        { id: 2, username: 'cashier1', role: 'cashier' }
      ]
    }));
    return;
  }

  // 404 handler
  res.writeHead(404);
  res.end(JSON.stringify({
    error: 'Route not found',
    path: path,
    method: method
  }));
});

// Start server
server.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📱 Environment: production`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
});

// Handle errors
server.on('error', (error) => {
  console.error('Server error:', error);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});
