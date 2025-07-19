const http = require('http');
const url = require('url');
const path = require('path');

let db = null;
let useSQLite = false;

// Try to load SQLite3, fallback to in-memory if fails
try {
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = path.join(__dirname, 'dcashier.sqlite');
  db = new sqlite3.Database(dbPath);
  useSQLite = true;
  console.log('✅ Using SQLite database');
} catch (error) {
  console.log('⚠️ SQLite not available, using in-memory storage');
  useSQLite = false;
}

const port = parseInt(process.env.PORT) || 8000;

// In-memory storage as fallback
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

let transactions = [];
let users = [
  { id: 1, username: 'admin', password: 'admin123', role: 'admin' },
  { id: 2, username: 'cashier1', password: 'cashier123', role: 'cashier' }
];

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://d-cashier.netlify.app',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-csrf-token',
  'Access-Control-Allow-Credentials': 'true'
};

// Initialize SQLite database if available
function initializeSQLiteDatabase() {
  if (!useSQLite) return Promise.resolve();
  
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
          console.log('SQLite error, falling back to in-memory');
          useSQLite = false;
          resolve();
          return;
        }

        if (row.count === 0) {
          // Seed categories
          const stmt = db.prepare("INSERT INTO categories (id, name) VALUES (?, ?)");
          categories.forEach(cat => {
            stmt.run(cat.id, cat.name);
          });
          stmt.finalize();

          // Seed products
          const productStmt = db.prepare("INSERT INTO products (id, name, price, cost_price, stock, barcode, category_id) VALUES (?, ?, ?, ?, ?, ?, ?)");
          products.forEach(product => {
            productStmt.run(product.id, product.name, product.price, product.cost_price, product.stock, product.barcode, product.category_id);
          });
          productStmt.finalize();

          // Seed users
          const userStmt = db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)");
          users.forEach(user => {
            userStmt.run(user.username, user.password, user.role);
          });
          userStmt.finalize();

          console.log('✅ SQLite Database initialized with seed data');
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

// Database query helpers for SQLite
function dbGet(query, params = []) {
  if (!useSQLite) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function dbAll(query, params = []) {
  if (!useSQLite) return Promise.resolve([]);
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function dbRun(query, params = []) {
  if (!useSQLite) return Promise.resolve({ id: null, changes: 0 });
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
        message: 'DCashier API Server - Railway Hybrid',
        version: '2.1.0',
        health: '/health',
        api: '/api',
        environment: 'production',
        database: useSQLite ? 'SQLite' : 'In-Memory',
        timestamp: new Date().toISOString()
      }));
      return;
    }

    if (path === '/health' && method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'OK',
        message: 'Server is running on Railway with hybrid storage',
        timestamp: new Date().toISOString(),
        environment: 'production',
        database: useSQLite ? 'SQLite' : 'In-Memory',
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
          let user = null;
          
          if (useSQLite) {
            user = await dbGet("SELECT * FROM users WHERE username = ? AND password = ?", [username, password]);
          } else {
            user = users.find(u => u.username === username && u.password === password);
          }
          
          if (user) {
            res.writeHead(200);
            res.end(JSON.stringify({
              status: 'success',
              message: 'Login successful',
              data: {
                accessToken: 'hybrid-token-' + Date.now(),
                refreshToken: 'hybrid-refresh-' + Date.now(),
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

    // Categories endpoints
    if (path === '/api/categories' && method === 'GET') {
      try {
        let result = [];
        
        if (useSQLite) {
          result = await dbAll("SELECT * FROM categories ORDER BY id");
        } else {
          result = categories;
        }
        
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

    if (path === '/api/categories' && method === 'POST') {
      parseBody(req, async (error, body) => {
        if (error) {
          res.writeHead(400);
          res.end(JSON.stringify({ status: 'error', message: 'Invalid JSON' }));
          return;
        }

        try {
          // Generate new category ID
          let newIdNum = 1;
          
          if (useSQLite) {
            const lastCategory = await dbGet("SELECT id FROM categories ORDER BY id DESC LIMIT 1");
            if (lastCategory) {
              const lastNum = parseInt(lastCategory.id.replace('CAT', ''));
              newIdNum = lastNum + 1;
            }
            const newId = 'CAT' + String(newIdNum).padStart(3, '0');
            await dbRun("INSERT INTO categories (id, name) VALUES (?, ?)", [newId, body.name]);
          } else {
            const lastCategory = categories[categories.length - 1];
            if (lastCategory) {
              const lastNum = parseInt(lastCategory.id.replace('CAT', ''));
              newIdNum = lastNum + 1;
            }
            const newId = 'CAT' + String(newIdNum).padStart(3, '0');
            categories.push({ id: newId, name: body.name });
          }

          const newId = 'CAT' + String(newIdNum).padStart(3, '0');
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

    // Products endpoints
    if (path === '/api/products' && method === 'GET') {
      try {
        let result = [];
        
        if (useSQLite) {
          result = await dbAll(`
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id
          `);
        } else {
          result = products;
        }
        
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

    // Transactions endpoints
    if (path === '/api/transactions' && method === 'GET') {
      try {
        let result = [];
        
        if (useSQLite) {
          result = await dbAll("SELECT * FROM transactions ORDER BY timestamp DESC");
          // Get transaction items for each transaction
          for (let transaction of result) {
            const items = await dbAll("SELECT * FROM transaction_items WHERE transaction_id = ?", [transaction.id]);
            transaction.items = items;
          }
        } else {
          result = transactions;
        }

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

    if (path === '/api/transactions' && method === 'POST') {
      parseBody(req, async (error, body) => {
        if (error) {
          res.writeHead(400);
          res.end(JSON.stringify({ status: 'error', message: 'Invalid JSON' }));
          return;
        }

        try {
          const transactionId = 'TXN-' + Date.now();
          const timestamp = Date.now();

          if (useSQLite) {
            // SQLite implementation
            await dbRun(`
              INSERT INTO transactions (id, timestamp, total_amount, payment_amount, change_amount, discount, payment_method)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [transactionId, timestamp, body.total_amount, body.payment_amount, body.change_amount, body.discount || 0, body.payment_method]);

            if (Array.isArray(body.items)) {
              for (let item of body.items) {
                await dbRun(`
                  INSERT INTO transaction_items (transaction_id, product_id, product_name, price_at_sale, cost_price_at_sale, quantity)
                  VALUES (?, ?, ?, ?, ?, ?)
                `, [transactionId, item.product_id, item.product_name, item.price_at_sale, item.cost_price_at_sale || 0, item.quantity]);

                await dbRun("UPDATE products SET stock = stock - ? WHERE id = ?", [item.quantity, item.product_id]);
              }
            }
          } else {
            // In-memory implementation
            const transaction = {
              id: transactionId,
              timestamp: timestamp,
              total_amount: body.total_amount,
              payment_amount: body.payment_amount,
              change_amount: body.change_amount,
              discount: body.discount || 0,
              payment_method: body.payment_method,
              items: body.items || []
            };

            transactions.push(transaction);

            // Update stock in memory
            if (Array.isArray(body.items)) {
              body.items.forEach(item => {
                const product = products.find(p => p.id === item.product_id);
                if (product) {
                  product.stock -= item.quantity;
                }
              });
            }
          }

          res.writeHead(200);
          res.end(JSON.stringify({
            status: 'success',
            data: {
              transactionId: transactionId,
              timestamp: timestamp,
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

        let result = { total_transactions: 0, total_sales: 0, total_discount: 0 };

        if (useSQLite) {
          const dailySales = await dbAll(`
            SELECT 
              COUNT(*) as total_transactions,
              COALESCE(SUM(total_amount), 0) as total_sales,
              COALESCE(SUM(discount), 0) as total_discount
            FROM transactions 
            WHERE timestamp BETWEEN ? AND ?
          `, [startOfDay, endOfDay]);
          result = dailySales[0] || result;
        } else {
          const todayTransactions = transactions.filter(t => t.timestamp >= startOfDay && t.timestamp <= endOfDay);
          result = {
            total_transactions: todayTransactions.length,
            total_sales: todayTransactions.reduce((sum, t) => sum + t.total_amount, 0),
            total_discount: todayTransactions.reduce((sum, t) => sum + (t.discount || 0), 0)
          };
        }

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

    if (path === '/api/reports/top-products' && method === 'GET') {
      try {
        let result = [];

        if (useSQLite) {
          result = await dbAll(`
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
        } else {
          const productSales = {};
          transactions.forEach(transaction => {
            if (transaction.items) {
              transaction.items.forEach(item => {
                if (!productSales[item.product_id]) {
                  productSales[item.product_id] = {
                    product_name: item.product_name,
                    product_id: item.product_id,
                    total_sold: 0,
                    total_revenue: 0
                  };
                }
                productSales[item.product_id].total_sold += item.quantity;
                productSales[item.product_id].total_revenue += item.quantity * item.price_at_sale;
              });
            }
          });
          
          result = Object.values(productSales)
            .sort((a, b) => b.total_sold - a.total_sold)
            .slice(0, 5);
        }

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
        let result = [];
        
        if (useSQLite) {
          result = await dbAll("SELECT id, username, role, created_at FROM users ORDER BY id");
        } else {
          result = users.map(u => ({ id: u.id, username: u.username, role: u.role }));
        }
        
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
async function startServer() {
  try {
    if (useSQLite) {
      await initializeSQLiteDatabase();
    }
    
    server.listen(port, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${port} with ${useSQLite ? 'SQLite' : 'In-Memory'} storage`);
      console.log(`📱 Environment: production`);
      console.log(`💾 Database: ${useSQLite ? 'SQLite' : 'In-Memory'}`);
      console.log(`🔗 Health check: http://localhost:${port}/health`);
    });
  } catch (err) {
    console.error('Failed to initialize:', err);
    console.log('Starting with in-memory storage...');
    useSQLite = false;
    
    server.listen(port, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${port} with In-Memory storage (fallback)`);
      console.log(`📱 Environment: production`);
      console.log(`💾 Database: In-Memory`);
      console.log(`🔗 Health check: http://localhost:${port}/health`);
    });
  }
}

// Handle errors
server.on('error', (error) => {
  console.error('Server error:', error);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  if (useSQLite && db) {
    db.close();
  }
  server.close(() => {
    process.exit(0);
  });
});

// Start the server
startServer();
