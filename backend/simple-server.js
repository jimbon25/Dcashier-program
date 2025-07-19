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
        { id: 'P001', name: 'Beras Premium 5kg', price: 65000, stock: 80, cost_price: 58000, category_id: 'CAT001', barcode: 'B001', category_name: 'Makanan Pokok' },
        { id: 'P002', name: 'Minyak Goreng Tropical 2L', price: 38000, stock: 60, cost_price: 33000, category_id: 'CAT001', barcode: 'B002', category_name: 'Makanan Pokok' },
        { id: 'P003', name: 'Gula Pasir Gulaku 1kg', price: 16000, stock: 150, cost_price: 14000, category_id: 'CAT001', barcode: 'B003', category_name: 'Makanan Pokok' },
        { id: 'P004', name: 'Telur Ayam Segar 1kg', price: 30000, stock: 90, cost_price: 27000, category_id: 'CAT001', barcode: 'B004', category_name: 'Makanan Pokok' },
        { id: 'P005', name: 'Tepung Terigu Cakra 1kg', price: 13000, stock: 120, cost_price: 11000, category_id: 'CAT001', barcode: 'B005', category_name: 'Makanan Pokok' },
        { id: 'P006', name: 'Teh Celup Sosro 25pcs', price: 9500, stock: 100, cost_price: 8000, category_id: 'CAT002', barcode: 'B006', category_name: 'Minuman' },
        { id: 'P007', name: 'Kopi Kapal Api 200gr', price: 14000, stock: 85, cost_price: 12000, category_id: 'CAT002', barcode: 'B007', category_name: 'Minuman' },
        { id: 'P008', name: 'Susu UHT Ultra 1L', price: 19000, stock: 75, cost_price: 17000, category_id: 'CAT002', barcode: 'B008', category_name: 'Minuman' },
        { id: 'P009', name: 'Air Mineral Aqua 600ml', price: 3500, stock: 200, cost_price: 2800, category_id: 'CAT002', barcode: 'B009', category_name: 'Minuman' },
        { id: 'P010', name: 'Jus Buah Sunquick 330ml', price: 7500, stock: 120, cost_price: 6200, category_id: 'CAT002', barcode: 'B010', category_name: 'Minuman' }
      ]
    }));
    return;
  }

  if (path === '/api/categories' && method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'success',
      data: [
        { id: 'CAT001', name: 'Makanan Pokok' },
        { id: 'CAT002', name: 'Minuman' },
        { id: 'CAT003', name: 'Snack & Permen' },
        { id: 'CAT004', name: 'Kebutuhan Rumah' },
        { id: 'CAT005', name: 'Bumbu Dapur' },
        { id: 'CAT006', name: 'Perawatan Tubuh' }
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

  // Top products report endpoint
  if (path.startsWith('/api/reports/top-products') && method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'success',
      data: [
        { id: 1, name: 'Product A', sales_count: 50, total_revenue: 500000 },
        { id: 2, name: 'Product B', sales_count: 30, total_revenue: 300000 },
        { id: 3, name: 'Product C', sales_count: 20, total_revenue: 200000 }
      ]
    }));
    return;
  }

  // Barcode search endpoint
  if (path.startsWith('/api/products/barcode/') && method === 'GET') {
    const barcode = path.split('/').pop();
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'success',
      data: {
        id: '1',
        name: 'Product by Barcode',
        price: 15000,
        stock: 10,
        barcode: barcode,
        category_name: 'Test Category'
      }
    }));
    return;
  }

  // Upload image endpoint
  if (path === '/api/upload/image' && method === 'POST') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'success',
      data: {
        imageUrl: '/uploads/images/mock-image.jpg'
      }
    }));
    return;
  }

  // Update product endpoint
  if (path.startsWith('/api/products/') && path !== '/api/products' && method === 'PUT') {
    const productId = path.split('/').pop();
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'success',
      message: `Product ${productId} updated successfully`
    }));
    return;
  }

  // Update product stock endpoint
  if (path.includes('/stock') && method === 'PUT') {
    const productId = path.split('/')[3];
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'success',
      message: `Stock for product ${productId} updated successfully`
    }));
    return;
  }

  // Reset transactions endpoint
  if (path === '/api/reset-transactions' && method === 'POST') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'success',
      message: 'All transactions have been reset'
    }));
    return;
  }

  // Update category endpoint
  if (path.startsWith('/api/categories/') && path !== '/api/categories' && method === 'PUT') {
    const categoryId = path.split('/').pop();
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'success',
      message: `Category ${categoryId} updated successfully`
    }));
    return;
  }

  // Delete transaction endpoint
  if (path.startsWith('/api/transactions/') && method === 'DELETE') {
    const transactionId = path.split('/').pop();
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'success',
      message: `Transaction ${transactionId} deleted successfully`
    }));
    return;
  }

  // POST transactions endpoint
  if (path === '/api/transactions' && method === 'POST') {
    parseBody(req, (error, body) => {
      if (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ status: 'error', message: 'Invalid JSON' }));
        return;
      }

      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'success',
        data: {
          transactionId: 'TXN-' + Date.now(),
          timestamp: Date.now(),
          message: 'Transaction saved successfully'
        }
      }));
    });
    return;
  }

  // POST products endpoint
  if (path === '/api/products' && method === 'POST') {
    parseBody(req, (error, body) => {
      if (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ status: 'error', message: 'Invalid JSON' }));
        return;
      }

      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'success',
        data: {
          id: Date.now(),
          ...body,
          message: 'Product created successfully'
        }
      }));
    });
    return;
  }

  // POST categories endpoint
  if (path === '/api/categories' && method === 'POST') {
    parseBody(req, (error, body) => {
      if (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ status: 'error', message: 'Invalid JSON' }));
        return;
      }

      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'success',
        data: {
          id: Date.now(),
          ...body,
          message: 'Category created successfully'
        }
      }));
    });
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
