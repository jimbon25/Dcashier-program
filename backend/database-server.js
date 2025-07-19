const http = require('http');
const url = require('url');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const port = parseInt(process.env.PORT) || 8000;

// Database setup
const dbPath = path.join(__dirname, 'dcashier.sqlite');
const db = new sqlite3.Database(dbPath);

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://d-cashier.netlify.app',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-csrf-token',
  'Access-Control-Allow-Credentials': 'true'
};

// Initialize database tables and seed data
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create tables
      db.run(`CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price INTEGER NOT NULL,
        cost_price INTEGER DEFAULT 0,
        stock INTEGER NOT NULL,
        barcode TEXT,
        image_url TEXT,
        category_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories (id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        timestamp INTEGER NOT NULL,
        total_amount INTEGER NOT NULL,
        payment_amount INTEGER NOT NULL,
        change_amount INTEGER NOT NULL,
        discount INTEGER DEFAULT 0,
        payment_method TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS transaction_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        product_name TEXT NOT NULL,
        price_at_sale INTEGER NOT NULL,
        cost_price_at_sale INTEGER DEFAULT 0,
        quantity INTEGER NOT NULL,
        FOREIGN KEY (transaction_id) REFERENCES transactions (id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Check if data already exists
      db.get("SELECT COUNT(*) as count FROM categories", (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        if (row.count === 0) {
          // Seed categories
          const categories = [
            { id: 'CAT001', name: 'Makanan Pokok' },
            { id: 'CAT002', name: 'Minuman' },
            { id: 'CAT003', name: 'Snack & Permen' },
            { id: 'CAT004', name: 'Kebutuhan Rumah' },
            { id: 'CAT005', name: 'Bumbu Dapur' },
            { id: 'CAT006', name: 'Perawatan Tubuh' }
          ];

          const stmt = db.prepare("INSERT INTO categories (id, name) VALUES (?, ?)");
          categories.forEach(cat => {
            stmt.run(cat.id, cat.name);
          });
          stmt.finalize();

          // Seed products
          const products = [
            { id: 'P001', name: 'Beras Premium 5kg', price: 65000, stock: 80, cost_price: 58000, category_id: 'CAT001', barcode: 'B001' },
            { id: 'P002', name: 'Minyak Goreng Tropical 2L', price: 38000, stock: 60, cost_price: 33000, category_id: 'CAT001', barcode: 'B002' },
            { id: 'P003', name: 'Gula Pasir Gulaku 1kg', price: 16000, stock: 150, cost_price: 14000, category_id: 'CAT001', barcode: 'B003' },
            { id: 'P004', name: 'Telur Ayam Segar 1kg', price: 30000, stock: 90, cost_price: 27000, category_id: 'CAT001', barcode: 'B004' },
            { id: 'P005', name: 'Tepung Terigu Cakra 1kg', price: 13000, stock: 120, cost_price: 11000, category_id: 'CAT001', barcode: 'B005' },
            { id: 'P006', name: 'Teh Celup Sosro 25pcs', price: 9500, stock: 100, cost_price: 8000, category_id: 'CAT002', barcode: 'B006' },
            { id: 'P007', name: 'Kopi Kapal Api 200gr', price: 14000, stock: 85, cost_price: 12000, category_id: 'CAT002', barcode: 'B007' },
            { id: 'P008', name: 'Susu UHT Ultra 1L', price: 19000, stock: 75, cost_price: 17000, category_id: 'CAT002', barcode: 'B008' },
            { id: 'P009', name: 'Air Mineral Aqua 600ml', price: 3500, stock: 200, cost_price: 2800, category_id: 'CAT002', barcode: 'B009' },
            { id: 'P010', name: 'Jus Buah Sunquick 330ml', price: 7500, stock: 120, cost_price: 6200, category_id: 'CAT002', barcode: 'B010' }
          ];

          const productStmt = db.prepare("INSERT INTO products (id, name, price, cost_price, stock, barcode, category_id) VALUES (?, ?, ?, ?, ?, ?, ?)");
          products.forEach(product => {
            productStmt.run(product.id, product.name, product.price, product.cost_price, product.stock, product.barcode, product.category_id);
          });
          productStmt.finalize();

          // Seed users
          const users = [
            { username: 'admin', password: 'admin123', role: 'admin' },
            { username: 'cashier1', password: 'cashier123', role: 'cashier' }
          ];

          const userStmt = db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)");
          users.forEach(user => {
            userStmt.run(user.username, user.password, user.role);
          });
          userStmt.finalize();

          console.log('✅ Database initialized with seed data');
        }
        resolve();
      });
    });
  });
}

// Helper functions
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

// Database query helpers
function dbGet(query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function dbAll(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function dbRun(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

// Create server
const server = http.createServer(async (req, res) => {
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

  try {
    // Routes
    if (path === '/' && method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify({
        message: 'DCashier SQLite API Server - Railway v2.1',
        version: '2.1.0',
        health: '/health',
        api: '/api',
        environment: 'production',
        database: 'SQLite',
        timestamp: new Date().toISOString()
      }));
      return;
    }

    if (path === '/health' && method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'OK',
        message: 'SQLite Database Server - Railway Deployment v2.1',
        timestamp: new Date().toISOString(),
        environment: 'production',
        database: 'SQLite',
        version: '2.1.0'
      }));
      return;
    }

    // Auth endpoints
    if (path === '/api/auth/login' && method === 'POST') {
      parseBody(req, async (error, body) => {
        if (error) {
          res.writeHead(400);
          res.end(JSON.stringify({ status: 'error', message: 'Invalid JSON' }));
          return;
        }

        const { username, password } = body;
        console.log('Login attempt:', { username, password: '***' });

        try {
          const user = await dbGet("SELECT * FROM users WHERE username = ? AND password = ?", [username, password]);
          
          if (user) {
            res.writeHead(200);
            res.end(JSON.stringify({
              status: 'success',
              message: 'Login successful',
              data: {
                accessToken: 'sqlite-token-' + Date.now(),
                refreshToken: 'sqlite-refresh-' + Date.now(),
                role: user.role
              }
            }));
          } else {
            res.writeHead(401);
            res.end(JSON.stringify({
              status: 'error',
              message: 'Invalid credentials'
            }));
          }
        } catch (err) {
          res.writeHead(500);
          res.end(JSON.stringify({ status: 'error', message: 'Database error' }));
        }
      });
      return;
    }

    if (path === '/api/auth/register' && method === 'POST') {
      parseBody(req, async (error, body) => {
        if (error) {
          res.writeHead(400);
          res.end(JSON.stringify({ status: 'error', message: 'Invalid JSON' }));
          return;
        }

        const { username, password, role = 'cashier' } = body;

        try {
          await dbRun("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", [username, password, role]);
          
          res.writeHead(200);
          res.end(JSON.stringify({
            status: 'success',
            message: 'Registration successful',
            data: {
              accessToken: 'sqlite-token-' + Date.now(),
              refreshToken: 'sqlite-refresh-' + Date.now(),
              role: role
            }
          }));
        } catch (err) {
          res.writeHead(400);
          res.end(JSON.stringify({ status: 'error', message: 'Username already exists' }));
        }
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

    // Products endpoints
    if (path === '/api/products' && method === 'GET') {
      try {
        const products = await dbAll(`
          SELECT p.*, c.name as category_name 
          FROM products p 
          LEFT JOIN categories c ON p.category_id = c.id
        `);
        
        res.writeHead(200);
        res.end(JSON.stringify({
          status: 'success',
          data: products
        }));
      } catch (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ status: 'error', message: 'Database error' }));
      }
      return;
    }

    if (path === '/api/products' && method === 'POST') {
      parseBody(req, async (error, body) => {
        if (error) {
          res.writeHead(400);
          res.end(JSON.stringify({ status: 'error', message: 'Invalid JSON' }));
          return;
        }

        try {
          // Generate new product ID
          const lastProduct = await dbGet("SELECT id FROM products ORDER BY id DESC LIMIT 1");
          let newIdNum = 1;
          if (lastProduct) {
            const lastNum = parseInt(lastProduct.id.replace('P', ''));
            newIdNum = lastNum + 1;
          }
          const newId = 'P' + String(newIdNum).padStart(3, '0');

          // Get category name
          const category = await dbGet("SELECT name FROM categories WHERE id = ?", [body.category_id]);
          const categoryName = category ? category.name : 'Unknown';

          await dbRun(`
            INSERT INTO products (id, name, price, cost_price, stock, barcode, image_url, category_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [newId, body.name, body.price, body.cost_price || 0, body.stock || 0, body.barcode, body.image_url, body.category_id]);

          const newProduct = {
            id: newId,
            name: body.name,
            price: parseInt(body.price),
            cost_price: parseInt(body.cost_price || 0),
            stock: parseInt(body.stock || 0),
            barcode: body.barcode || null,
            image_url: body.image_url || null,
            category_id: body.category_id,
            category_name: categoryName
          };

          res.writeHead(200);
          res.end(JSON.stringify({
            status: 'success',
            data: newProduct,
            message: 'Product created successfully'
          }));
        } catch (err) {
          res.writeHead(500);
          res.end(JSON.stringify({ status: 'error', message: 'Database error' }));
        }
      });
      return;
    }

    // Categories endpoints
    if (path === '/api/categories' && method === 'GET') {
      try {
        const categories = await dbAll("SELECT * FROM categories ORDER BY id");
        
        res.writeHead(200);
        res.end(JSON.stringify({
          status: 'success',
          data: categories
        }));
      } catch (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ status: 'error', message: 'Database error' }));
      }
      return;
    }

    if (path === '/api/categories' && method === 'POST') {
      parseBody(req, async (error, body) => {
        if (error) {
          res.writeHead(400);
          res.end(JSON.stringify({ status: 'error', message: 'Invalid JSON' }));
          return;
        }

        try {
          // Generate new category ID
          const lastCategory = await dbGet("SELECT id FROM categories ORDER BY id DESC LIMIT 1");
          let newIdNum = 1;
          if (lastCategory) {
            const lastNum = parseInt(lastCategory.id.replace('CAT', ''));
            newIdNum = lastNum + 1;
          }
          const newId = 'CAT' + String(newIdNum).padStart(3, '0');

          await dbRun("INSERT INTO categories (id, name) VALUES (?, ?)", [newId, body.name]);

          const newCategory = {
            id: newId,
            name: body.name
          };

          res.writeHead(200);
          res.end(JSON.stringify({
            status: 'success',
            data: newCategory,
            message: 'Category created successfully'
          }));
        } catch (err) {
          res.writeHead(500);
          res.end(JSON.stringify({ status: 'error', message: 'Database error' }));
        }
      });
      return;
    }

    // Transactions endpoints
    if (path === '/api/transactions' && method === 'GET') {
      try {
        const transactions = await dbAll("SELECT * FROM transactions ORDER BY timestamp DESC");
        
        // Get transaction items for each transaction
        for (let transaction of transactions) {
          const items = await dbAll("SELECT * FROM transaction_items WHERE transaction_id = ?", [transaction.id]);
          transaction.items = items;
        }

        res.writeHead(200);
        res.end(JSON.stringify({
          status: 'success',
          data: transactions
        }));
      } catch (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ status: 'error', message: 'Database error' }));
      }
      return;
    }

    if (path === '/api/transactions' && method === 'POST') {
      parseBody(req, async (error, body) => {
        if (error) {
          res.writeHead(400);
          res.end(JSON.stringify({ status: 'error', message: 'Invalid JSON' }));
          return;
        }

        try {
          // Generate transaction ID
          const transactionId = 'TXN-' + Date.now();

          // Insert transaction
          await dbRun(`
            INSERT INTO transactions (id, timestamp, total_amount, payment_amount, change_amount, discount, payment_method)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [transactionId, Date.now(), body.total_amount, body.payment_amount, body.change_amount, body.discount || 0, body.payment_method]);

          // Insert transaction items and update stock
          if (Array.isArray(body.items)) {
            for (let item of body.items) {
              await dbRun(`
                INSERT INTO transaction_items (transaction_id, product_id, product_name, price_at_sale, cost_price_at_sale, quantity)
                VALUES (?, ?, ?, ?, ?, ?)
              `, [transactionId, item.product_id, item.product_name, item.price_at_sale, item.cost_price_at_sale || 0, item.quantity]);

              // Update product stock
              await dbRun("UPDATE products SET stock = stock - ? WHERE id = ?", [item.quantity, item.product_id]);
            }
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
        } catch (err) {
          res.writeHead(500);
          res.end(JSON.stringify({ status: 'error', message: 'Database error' }));
        }
      });
      return;
    }

    // Reports endpoints
    if (path === '/api/reports/daily-sales' && method === 'GET') {
      try {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
        const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;

        const dailySales = await dbAll(`
          SELECT 
            COUNT(*) as total_transactions,
            COALESCE(SUM(total_amount), 0) as total_sales,
            COALESCE(SUM(discount), 0) as total_discount
          FROM transactions 
          WHERE timestamp BETWEEN ? AND ?
        `, [startOfDay, endOfDay]);

        res.writeHead(200);
        res.end(JSON.stringify({
          status: 'success',
          data: dailySales[0] || { total_transactions: 0, total_sales: 0, total_discount: 0 }
        }));
      } catch (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ status: 'error', message: 'Database error' }));
      }
      return;
    }

    if (path === '/api/reports/top-products' && method === 'GET') {
      try {
        const topProducts = await dbAll(`
          SELECT 
            ti.product_name,
            ti.product_id,
            SUM(ti.quantity) as total_sold,
            SUM(ti.quantity * ti.price_at_sale) as total_revenue
          FROM transaction_items ti
          GROUP BY ti.product_id
          ORDER BY total_sold DESC
          LIMIT 5
        `);

        res.writeHead(200);
        res.end(JSON.stringify({
          status: 'success',
          data: topProducts
        }));
      } catch (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ status: 'error', message: 'Database error' }));
      }
      return;
    }

    if (path === '/api/reports/profit-loss' && method === 'GET') {
      try {
        const profitLoss = await dbAll(`
          SELECT 
            COUNT(DISTINCT t.id) as total_transactions,
            COALESCE(SUM(t.total_amount), 0) as total_revenue,
            COALESCE(SUM(ti.quantity * ti.cost_price_at_sale), 0) as total_cost,
            COALESCE(SUM(t.total_amount) - SUM(ti.quantity * ti.cost_price_at_sale), 0) as profit
          FROM transactions t
          LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
        `);

        const result = profitLoss[0] || { total_transactions: 0, total_revenue: 0, total_cost: 0, profit: 0 };

        res.writeHead(200);
        res.end(JSON.stringify({
          status: 'success',
          data: result
        }));
      } catch (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ status: 'error', message: 'Database error' }));
      }
      return;
    }

    // Users endpoints
    if (path === '/api/users' && method === 'GET') {
      try {
        const users = await dbAll("SELECT id, username, role, created_at FROM users ORDER BY id");
        
        res.writeHead(200);
        res.end(JSON.stringify({
          status: 'success',
          data: users
        }));
      } catch (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ status: 'error', message: 'Database error' }));
      }
      return;
    }

    // Products by barcode search
    if (path.startsWith('/api/products/barcode/') && method === 'GET') {
      const barcode = path.split('/api/products/barcode/')[1];
      
      try {
        const product = await dbGet(`
          SELECT p.*, c.name as category_name 
          FROM products p 
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE p.barcode = ?
        `, [barcode]);

        if (product) {
          res.writeHead(200);
          res.end(JSON.stringify({
            status: 'success',
            data: product
          }));
        } else {
          res.writeHead(404);
          res.end(JSON.stringify({
            status: 'error',
            message: 'Product not found'
          }));
        }
      } catch (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ status: 'error', message: 'Database error' }));
      }
      return;
    }

    // Update product endpoint
    if (path.startsWith('/api/products/') && method === 'PUT') {
      const productId = path.split('/api/products/')[1];
      
      parseBody(req, async (error, body) => {
        if (error) {
          res.writeHead(400);
          res.end(JSON.stringify({ status: 'error', message: 'Invalid JSON' }));
          return;
        }

        try {
          await dbRun(`
            UPDATE products 
            SET name = ?, price = ?, cost_price = ?, stock = ?, barcode = ?, image_url = ?, category_id = ?
            WHERE id = ?
          `, [body.name, body.price, body.cost_price || 0, body.stock || 0, body.barcode, body.image_url, body.category_id, productId]);

          // Get updated product with category name
          const updatedProduct = await dbGet(`
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = ?
          `, [productId]);

          res.writeHead(200);
          res.end(JSON.stringify({
            status: 'success',
            data: updatedProduct,
            message: 'Product updated successfully'
          }));
        } catch (err) {
          res.writeHead(500);
          res.end(JSON.stringify({ status: 'error', message: 'Database error' }));
        }
      });
      return;
    }

    // Delete product endpoint
    if (path.startsWith('/api/products/') && method === 'DELETE') {
      const productId = path.split('/api/products/')[1];
      
      try {
        await dbRun("DELETE FROM products WHERE id = ?", [productId]);
        
        res.writeHead(200);
        res.end(JSON.stringify({
          status: 'success',
          message: 'Product deleted successfully'
        }));
      } catch (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ status: 'error', message: 'Database error' }));
      }
      return;
    }

    // Update category endpoint
    if (path.startsWith('/api/categories/') && method === 'PUT') {
      const categoryId = path.split('/api/categories/')[1];
      
      parseBody(req, async (error, body) => {
        if (error) {
          res.writeHead(400);
          res.end(JSON.stringify({ status: 'error', message: 'Invalid JSON' }));
          return;
        }

        try {
          await dbRun("UPDATE categories SET name = ? WHERE id = ?", [body.name, categoryId]);
          
          const updatedCategory = await dbGet("SELECT * FROM categories WHERE id = ?", [categoryId]);

          res.writeHead(200);
          res.end(JSON.stringify({
            status: 'success',
            data: updatedCategory,
            message: 'Category updated successfully'
          }));
        } catch (err) {
          res.writeHead(500);
          res.end(JSON.stringify({ status: 'error', message: 'Database error' }));
        }
      });
      return;
    }

    // Delete category endpoint
    if (path.startsWith('/api/categories/') && method === 'DELETE') {
      const categoryId = path.split('/api/categories/')[1];
      
      try {
        await dbRun("DELETE FROM categories WHERE id = ?", [categoryId]);
        
        res.writeHead(200);
        res.end(JSON.stringify({
          status: 'success',
          message: 'Category deleted successfully'
        }));
      } catch (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ status: 'error', message: 'Database error' }));
      }
      return;
    }

    // 404 handler
    res.writeHead(404);
    res.end(JSON.stringify({
      error: 'Route not found',
      path: path,
      method: method
    }));

  } catch (error) {
    console.error('Server error:', error);
    res.writeHead(500);
    res.end(JSON.stringify({ status: 'error', message: 'Internal server error' }));
  }
});

// Initialize database and start server
initializeDatabase()
  .then(() => {
    server.listen(port, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${port} with SQLite database`);
      console.log(`📱 Environment: production`);
      console.log(`💾 Database: dcashier.sqlite`);
      console.log(`🔗 Health check: http://localhost:${port}/health`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

// Handle errors
server.on('error', (error) => {
  console.error('Server error:', error);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  db.close();
  server.close(() => {
    process.exit(0);
  });
});
