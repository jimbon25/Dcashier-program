import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { initializeDatabase, getDatabase } from './database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'supersecretjwtkey'; // Use environment variable in production

const app = express();
const port = 3001; // Using 3001 to avoid conflict with React's default 3000

app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Enable JSON body parsing

// Helper function to promisify db.run
const runAsync = (db: sqlite3.Database, sql: string, params: any[] = []): Promise<sqlite3.RunResult> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this); // 'this' contains lastID, changes
      }
    });
  });
};

// Helper function to promisify db.all
const allAsync = (db: sqlite3.Database, sql: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Helper function to promisify db.exec
const execAsync = (db: sqlite3.Database, sql: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

app.get('/', (req, res) => {
  res.send('Hello from Backend!');
});

// User Authentication Endpoints
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const db = getDatabase();
    const hashedPassword = await bcrypt.hash(password, 10);
    await runAsync(db, "INSERT INTO users (username, password) VALUES (?, ?)", [username, hashedPassword]);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err: any) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Username already exists.' });
    }
    console.error("Error registering user:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const db = getDatabase();
    const user: any = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ message: 'Logged in successfully', token });
  } catch (err: any) {
    console.error("Error logging in user:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Category Endpoints
app.get('/categories', async (req, res) => {
  try {
    const db = getDatabase();
    const rows = await allAsync(db, "SELECT * FROM categories");
    res.json(rows);
  } catch (err: any) {
    console.error("Error fetching categories:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/categories', async (req, res) => {
  const { id, name } = req.body;
  if (!id || !name) {
    return res.status(400).json({ error: 'Category ID and name are required.' });
  }
  try {
    const db = getDatabase();
    await runAsync(db, "INSERT INTO categories (id, name) VALUES (?, ?)", [id, name]);
    res.status(201).json({ message: 'Category added successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/categories/:id', async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Category name is required.' });
  }
  try {
    const db = getDatabase();
    const result = await runAsync(db, "UPDATE categories SET name = ? WHERE id = ?", [name, id]);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Category not found or no changes made.' });
      return;
    }
    res.json({ message: 'Category updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/categories/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const db = getDatabase();
    const result = await runAsync(db, "DELETE FROM categories WHERE id = ?", [id]);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Category not found.' });
      return;
    }
    res.json({ message: 'Category deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/products', async (req, res) => {
  try {
    const db = getDatabase();
    const rows = await allAsync(db, "SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id");
    res.json(rows);
  } catch (err: any) {
    console.error("Error fetching products:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/products', async (req, res) => {
  const { id, name, price, stock, barcode, category_id, cost_price } = req.body;
  if (!id || !name || !price || !stock || cost_price === undefined) {
    return res.status(400).json({ error: 'All fields (id, name, price, stock, cost_price) are required.' });
  }

  try {
    const db = getDatabase();
    const result = await runAsync(db, "INSERT INTO products (id, name, price, stock, barcode, category_id, cost_price) VALUES (?, ?, ?, ?, ?, ?, ?)", [id, name, price, stock, barcode, category_id, cost_price]);
    res.status(201).json({ message: 'Product added successfully', id: result.lastID });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const db = getDatabase();
    const row = await new Promise((resolve, reject) => {
      db.get("SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?", [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!row) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    res.json(row);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/products/barcode/:barcode', async (req, res) => {
  const { barcode } = req.params;
  try {
    const db = getDatabase();
    const row = await new Promise((resolve, reject) => {
      db.get("SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.barcode = ?", [barcode], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!row) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    res.json(row);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/products/:id', async (req, res) => {
  const { id } = req.params;
  const { name, price, stock, barcode, category_id, cost_price } = req.body;
  if (!name || !price || !stock || cost_price === undefined) {
    return res.status(400).json({ error: 'All fields (name, price, stock, cost_price) are required.' });
  }

  try {
    const db = getDatabase();
    const result = await runAsync(db, "UPDATE products SET name = ?, price = ?, stock = ?, barcode = ?, category_id = ?, cost_price = ? WHERE id = ?", [name, price, stock, barcode, category_id, cost_price, id]);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Product not found or no changes made.' });
      return;
    }
    res.json({ message: 'Product updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const db = getDatabase();
    const result = await runAsync(db, "DELETE FROM products WHERE id = ?", [id]);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/reset-transactions', async (req, res) => {
  const db = getDatabase();
  try {
    await runAsync(db, "DELETE FROM transaction_items");
    await runAsync(db, "DELETE FROM transactions");
    res.json({ message: 'All transactions have been reset.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/transactions', async (req, res) => {
  const { total_amount, payment_amount, change_amount, cartItems, payment_method } = req.body;
  const db = getDatabase();
  const transactionId = `TRX-${Date.now()}`;
  const timestamp = Date.now();

  try {
    await execAsync(db, "BEGIN TRANSACTION");

    // Insert into transactions table
    await runAsync(
      db,
      "INSERT INTO transactions (id, timestamp, total_amount, payment_amount, change_amount, payment_method) VALUES (?, ?, ?, ?, ?, ?)",
      [transactionId, timestamp, total_amount, payment_amount, change_amount, payment_method || 'Cash']
    );

    // Insert into transaction_items table
    for (const item of cartItems) {
      // Fetch the cost_price for the current product
      const product: any = await new Promise((resolve, reject) => {
        db.get("SELECT cost_price FROM products WHERE id = ?", [item.id], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      const costPriceAtSale = product ? product.cost_price : 0; // Default to 0 if not found

      await runAsync(
        db,
        "INSERT INTO transaction_items (transaction_id, product_id, product_name, price_at_sale, quantity, cost_price_at_sale) VALUES (?, ?, ?, ?, ?, ?)",
        [transactionId, item.id, item.name, item.price, item.quantity, costPriceAtSale]
      );
    }

    await execAsync(db, "COMMIT");
    res.status(201).json({ message: 'Transaction recorded successfully', transactionId });
  } catch (err: any) {
    await execAsync(db, "ROLLBACK");
    console.error("Error recording transaction:", err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/products/:id/stock', async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  if (typeof quantity !== 'number' || quantity < 0) {
    return res.status(400).json({ error: 'Quantity must be a non-negative number.' });
  }

  try {
    const db = getDatabase();
    const result = await runAsync(db, "UPDATE products SET stock = stock - ? WHERE id = ?", [quantity, id]);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Product not found or stock not updated.' });
      return;
    }
    res.json({ message: 'Product stock updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/transactions', async (req, res) => {
  const db = getDatabase();
  const { startDate, endDate } = req.query;
  let query = "SELECT * FROM transactions";
  const params: (number | string)[] = [];

  if (startDate && endDate) {
    query += " WHERE timestamp >= ? AND timestamp <= ?";
    params.push(parseInt(startDate as string));
    params.push(parseInt(endDate as string));
  } else if (startDate) {
    query += " WHERE timestamp >= ?";
    params.push(parseInt(startDate as string));
  } else if (endDate) {
    query += " WHERE timestamp <= ?";
    params.push(parseInt(endDate as string));
  }

  query += " ORDER BY timestamp DESC";

  try {
    const transactions = await allAsync(db, query, params);

    if (transactions.length === 0) {
      res.json([]);
      return;
    }

    const transactionsWithItems: any[] = await Promise.all(
      transactions.map(async (transaction: any) => {
        const items = await allAsync(db, "SELECT * FROM transaction_items WHERE transaction_id = ?", [transaction.id]);
        return { ...transaction, items };
      })
    );

    res.json(transactionsWithItems);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/reports/daily-sales', async (req, res) => {
  const db = getDatabase();
  const { date } = req.query; // Format YYYY-MM-DD

  if (!date) {
    return res.status(400).json({ error: 'Date parameter is required (YYYY-MM-DD).' });
  }

  const startOfDay = new Date(date as string).setHours(0, 0, 0, 0);
  const endOfDay = new Date(date as string).setHours(23, 59, 59, 999);

  try {
    const rows = await allAsync(
      db,
      `SELECT
       strftime('%Y-%m-%d', timestamp / 1000, 'unixepoch', 'localtime') AS sale_date,
       SUM(total_amount) AS total_sales
     FROM transactions
     WHERE timestamp >= ? AND timestamp <= ?
     GROUP BY sale_date
     ORDER BY sale_date DESC`,
      [startOfDay, endOfDay]
    );
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/reports/top-products', async (req, res) => {
  const db = getDatabase();
  const { limit = 5 } = req.query; // Default limit to 5

  try {
    const rows = await allAsync(
      db,
      `SELECT
       product_name,
       SUM(quantity) AS total_quantity_sold,
       SUM(price_at_sale * quantity) AS total_revenue
     FROM transaction_items
     GROUP BY product_name
     ORDER BY total_quantity_sold DESC
     LIMIT ?`,
      [limit]
    );
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/reports/profit-loss', async (req, res) => {
  const db = getDatabase();
  const { startDate, endDate, categoryId } = req.query;

  let query = `
    SELECT
      ti.product_name,
      SUM(ti.quantity) AS total_quantity_sold,
      SUM(ti.price_at_sale * ti.quantity) AS total_revenue,
      SUM(ti.cost_price_at_sale * ti.quantity) AS total_cost,
      (SUM(ti.price_at_sale * ti.quantity) - SUM(ti.cost_price_at_sale * ti.quantity)) AS total_profit,
      c.name AS category_name
    FROM transaction_items ti
    JOIN transactions t ON ti.transaction_id = t.id
    LEFT JOIN products p ON ti.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
  `;

  const params: (number | string)[] = [];
  const conditions: string[] = [];

  if (startDate) {
    conditions.push("t.timestamp >= ?");
    params.push(parseInt(startDate as string));
  }
  if (endDate) {
    conditions.push("t.timestamp <= ?");
    params.push(parseInt(endDate as string));
  }
  if (categoryId) {
    conditions.push("p.category_id = ?");
    params.push(categoryId as string);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  query += `
    GROUP BY ti.product_name, c.name
    ORDER BY total_profit DESC
  `;

  try {
    const rows = await allAsync(db, query, params);
    res.json(rows);
  } catch (err: any) {
    console.error("Error fetching profit/loss report:", err.message);
    res.status(500).json({ error: err.message });
  }
});


initializeDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
  });
}).catch(err => {
  console.error('Failed to initialize database and start server:', err);
});
