import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { initializeDatabase, getDatabase } from './database';

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

app.get('/products', async (req, res) => {
  try {
    const db = getDatabase();
    const rows = await allAsync(db, "SELECT * FROM products");
    console.log("Products fetched:", rows);
    res.json(rows);
  } catch (err: any) {
    console.error("Error fetching products:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/products', async (req, res) => {
  const { id, name, price, stock, barcode } = req.body;
  if (!id || !name || !price || !stock) {
    return res.status(400).json({ error: 'All fields (id, name, price, stock) are required.' });
  }

  try {
    const db = getDatabase();
    const result = await runAsync(db, "INSERT INTO products (id, name, price, stock, barcode) VALUES (?, ?, ?, ?, ?)", [id, name, price, stock, barcode]);
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
      db.get("SELECT * FROM products WHERE id = ?", [id], (err, row) => {
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
      db.get("SELECT * FROM products WHERE barcode = ?", [barcode], (err, row) => {
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
  const { name, price, stock, barcode } = req.body;
  if (!name || !price || !stock) {
    return res.status(400).json({ error: 'All fields (name, price, stock) are required.' });
  }

  try {
    const db = getDatabase();
    const result = await runAsync(db, "UPDATE products SET name = ?, price = ?, stock = ?, barcode = ? WHERE id = ?", [name, price, stock, barcode, id]);
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
      await runAsync(
        db,
        "INSERT INTO transaction_items (transaction_id, product_id, product_name, price_at_sale, quantity) VALUES (?, ?, ?, ?, ?)",
        [transactionId, item.id, item.name, item.price, item.quantity]
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


initializeDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
  });
}).catch(err => {
  console.error('Failed to initialize database and start server:', err);
});
