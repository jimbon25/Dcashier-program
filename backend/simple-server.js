const http = require('http');
const url = require('url');
const querystring = require('querystring');

const port = parseInt(process.env.PORT) || 8000;

// In-memory storage
let categories = [
  { id: 'CAT001', name: 'Makanan Pokok' },
  { id: 'CAT002', name: 'Minuman' },
  { id: 'CAT003', name: 'Snack & Permen' },
  { id: 'CAT004', name: 'Kebutuhan Rumah' },
  { id: 'CAT005', name: 'Bumbu Dapur' },
  { id: 'CAT006', name: 'Perawatan Tubuh' }
];

let products = [
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
];

// Transaction storage
let transactions = [];

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
      data: products
    }));
    return;
  }

  if (path === '/api/categories' && method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'success',
      data: categories
    }));
    return;
  }

  // Transactions endpoint
  if (path === '/api/transactions' && method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'success',
      data: transactions
    }));
    return;
  }

  // Reports endpoints
  if (path === '/api/reports/daily-sales' && method === 'GET') {
    const parsedUrl = url.parse(req.url, true);
    const targetDate = parsedUrl.query.date || new Date().toISOString().split('T')[0];
    
    // Filter transactions by date
    const targetTimestamp = new Date(targetDate).getTime();
    const nextDayTimestamp = targetTimestamp + (24 * 60 * 60 * 1000);
    
    const dailyTransactions = transactions.filter(t => 
      t.timestamp >= targetTimestamp && t.timestamp < nextDayTimestamp
    );
    
    // Calculate daily sales
    const dailySales = [];
    const productSales = {};
    
    dailyTransactions.forEach(transaction => {
      transaction.items.forEach(item => {
        if (!productSales[item.product_id]) {
          productSales[item.product_id] = {
            product_name: item.product_name,
            total_quantity_sold: 0,
            total_revenue: 0
          };
        }
        productSales[item.product_id].total_quantity_sold += item.quantity;
        productSales[item.product_id].total_revenue += item.price_at_sale * item.quantity;
      });
    });
    
    Object.values(productSales).forEach(item => dailySales.push(item));
    
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'success',
      data: dailySales
    }));
    return;
  }

  if (path === '/api/reports/profit-loss' && method === 'GET') {
    // Calculate profit/loss from transactions
    let totalRevenue = 0;
    let totalCost = 0;
    
    transactions.forEach(transaction => {
      totalRevenue += transaction.total_amount;
      transaction.items.forEach(item => {
        totalCost += (item.cost_price_at_sale || 0) * item.quantity;
      });
    });
    
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'success',
      data: {
        profit: totalRevenue - totalCost,
        loss: 0,
        net: totalRevenue - totalCost,
        total_revenue: totalRevenue,
        total_cost: totalCost
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
    const parsedUrl = url.parse(req.url, true);
    const limit = parseInt(parsedUrl.query.limit) || 10;
    
    // Calculate top products from transactions
    const productSales = {};
    
    transactions.forEach(transaction => {
      transaction.items.forEach(item => {
        if (!productSales[item.product_id]) {
          productSales[item.product_id] = {
            product_name: item.product_name,
            total_quantity_sold: 0,
            total_revenue: 0
          };
        }
        productSales[item.product_id].total_quantity_sold += item.quantity;
        productSales[item.product_id].total_revenue += item.price_at_sale * item.quantity;
      });
    });
    
    // Sort by quantity sold and take top N
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.total_quantity_sold - a.total_quantity_sold)
      .slice(0, limit);
    
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'success',
      data: topProducts
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
    parseBody(req, (error, body) => {
      if (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ status: 'error', message: 'Invalid JSON' }));
        return;
      }

      const productIndex = products.findIndex(p => p.id === productId);
      if (productIndex === -1) {
        res.writeHead(404);
        res.end(JSON.stringify({ status: 'error', message: 'Product not found' }));
        return;
      }

      // Find category name if category_id provided
      let categoryName = products[productIndex].category_name;
      if (body.category_id) {
        const category = categories.find(c => c.id === body.category_id);
        categoryName = category ? category.name : 'Unknown';
      }

      // Update product
      products[productIndex] = {
        ...products[productIndex],
        name: body.name || products[productIndex].name,
        price: body.price !== undefined ? parseInt(body.price) : products[productIndex].price,
        cost_price: body.cost_price !== undefined ? parseInt(body.cost_price) : products[productIndex].cost_price,
        stock: body.stock !== undefined ? parseInt(body.stock) : products[productIndex].stock,
        barcode: body.barcode !== undefined ? body.barcode : products[productIndex].barcode,
        category_id: body.category_id || products[productIndex].category_id,
        category_name: categoryName,
        image_url: body.image_url !== undefined ? body.image_url : products[productIndex].image_url
      };

      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'success',
        message: `Product ${productId} updated successfully`
      }));
    });
    return;
  }

  // Update product stock endpoint
  if (path.includes('/stock') && method === 'PUT') {
    const productId = path.split('/')[3];
    parseBody(req, (error, body) => {
      if (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ status: 'error', message: 'Invalid JSON' }));
        return;
      }

      const productIndex = products.findIndex(p => p.id === productId);
      if (productIndex === -1) {
        res.writeHead(404);
        res.end(JSON.stringify({ status: 'error', message: 'Product not found' }));
        return;
      }

      // Update stock
      products[productIndex].stock = Math.max(0, products[productIndex].stock - (body.quantity || 0));

      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'success',
        message: `Stock for product ${productId} updated successfully`
      }));
    });
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

      // Generate transaction ID
      const transactionId = 'TXN-' + Date.now();
      
      // Create transaction object
      const newTransaction = {
        id: transactionId,
        timestamp: Date.now(),
        total_amount: parseInt(body.total_amount),
        payment_amount: parseInt(body.payment_amount),
        change_amount: parseInt(body.change_amount),
        discount: parseInt(body.discount || 0),
        payment_method: body.payment_method,
        items: body.items || []
      };

      // Store transaction
      transactions.push(newTransaction);

      // Update product stock
      if (Array.isArray(body.items)) {
        body.items.forEach(item => {
          const product = products.find(p => p.id === item.product_id);
          if (product) {
            product.stock = Math.max(0, product.stock - item.quantity);
          }
        });
      }

      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'success',
        data: {
          transactionId: transactionId,
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

      // Generate new product ID
      const newId = 'P' + String(products.length + 1).padStart(3, '0');
      
      // Find category name
      const category = categories.find(c => c.id === body.category_id);
      const categoryName = category ? category.name : 'Unknown';

      const newProduct = {
        id: newId,
        name: body.name,
        price: parseInt(body.price),
        stock: parseInt(body.stock || 0),
        cost_price: parseInt(body.cost_price || 0),
        category_id: body.category_id,
        barcode: body.barcode || null,
        image_url: body.image_url || null,
        category_name: categoryName
      };

      // Add to products array
      products.push(newProduct);

      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'success',
        data: newProduct,
        message: 'Product created successfully'
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

      // Generate new category ID
      const newId = 'CAT' + String(categories.length + 1).padStart(3, '0');
      const newCategory = {
        id: newId,
        name: body.name
      };

      // Add to categories array
      categories.push(newCategory);

      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'success',
        data: newCategory,
        message: 'Category created successfully'
      }));
    });
    return;
  }

  // PUT categories endpoint
  if (path.startsWith('/api/categories/') && method === 'PUT') {
    const categoryId = path.split('/').pop();
    parseBody(req, (error, body) => {
      if (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ status: 'error', message: 'Invalid JSON' }));
        return;
      }

      const categoryIndex = categories.findIndex(c => c.id === categoryId);
      if (categoryIndex === -1) {
        res.writeHead(404);
        res.end(JSON.stringify({ status: 'error', message: 'Category not found' }));
        return;
      }

      // Update category
      categories[categoryIndex].name = body.name;

      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'success',
        message: 'Category updated successfully'
      }));
    });
    return;
  }

  // DELETE categories endpoint
  if (path.startsWith('/api/categories/') && method === 'DELETE') {
    const categoryId = path.split('/').pop();
    const categoryIndex = categories.findIndex(c => c.id === categoryId);
    
    if (categoryIndex === -1) {
      res.writeHead(404);
      res.end(JSON.stringify({ status: 'error', message: 'Category not found' }));
      return;
    }

    // Remove category
    categories.splice(categoryIndex, 1);

    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'success',
      message: 'Category deleted successfully'
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
