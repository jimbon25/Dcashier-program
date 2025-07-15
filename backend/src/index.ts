import express from 'express';
import cors from 'cors';
import { initializeDatabase, getDatabase } from './database';

const app = express();
const port = 3001; // Using 3001 to avoid conflict with React's default 3000

app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Enable JSON body parsing

app.get('/', (req, res) => {
  res.send('Hello from Backend!');
});

app.get('/products', (req, res) => {
  const db = getDatabase();
  db.all("SELECT * FROM products", [], (err, rows) => {
    if (err) {
      console.error("Error fetching products:", err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    console.log("Products fetched:", rows);
    res.json(rows);
  });
});

app.post('/products', (req, res) => {
  const { id, name, price, stock, barcode } = req.body;
  if (!id || !name || !price || !stock) {
    return res.status(400).json({ error: 'All fields (id, name, price, stock) are required.' });
  }

  const db = getDatabase();
  db.run("INSERT INTO products (id, name, price, stock, barcode) VALUES (?, ?, ?, ?, ?)", [id, name, price, stock, barcode], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(201).json({ message: 'Product added successfully', id: this.lastID });
  });
});

app.get('/products/:id', (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  db.get("SELECT * FROM products WHERE id = ?", [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    res.json(row);
  });
});

app.get('/products/barcode/:barcode', (req, res) => {
  const { barcode } = req.params;
  const db = getDatabase();
  db.get("SELECT * FROM products WHERE barcode = ?", [barcode], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    res.json(row);
  });
});

app.put('/products/:id', (req, res) => {
  const { id } = req.params;
  const { name, price, stock, barcode } = req.body;
  if (!name || !price || !stock) {
    return res.status(400).json({ error: 'All fields (name, price, stock) are required.' });
  }

  const db = getDatabase();
  db.run("UPDATE products SET name = ?, price = ?, stock = ?, barcode = ? WHERE id = ?", [name, price, stock, barcode, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Product not found or no changes made.' });
      return;
    }
    res.json({ message: 'Product updated successfully' });
  });
});

app.delete('/products/:id', (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  db.run("DELETE FROM products WHERE id = ?", [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    res.json({ message: 'Product deleted successfully' });
  });
});

app.post('/reset-transactions', (req, res) => {
  const db = getDatabase();
  db.serialize(() => {
    db.run("DELETE FROM transaction_items", function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
    });
    db.run("DELETE FROM transactions", function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'All transactions have been reset.' });
    });
  });
});

app.post('/transactions', (req, res) => {
  const { total_amount, payment_amount, change_amount, cartItems, payment_method } = req.body;
  const db = getDatabase();
  const transactionId = `TRX-${Date.now()}`;
  const timestamp = Date.now();

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    // Insert into transactions table
    db.run(
      "INSERT INTO transactions (id, timestamp, total_amount, payment_amount, change_amount, payment_method) VALUES (?, ?, ?, ?, ?, ?)",
      [transactionId, timestamp, total_amount, payment_amount, change_amount, payment_method || 'Cash'],
      function(err) {
        if (err) {
          db.run("ROLLBACK");
          res.status(500).json({ error: err.message });
          return;
        }

        // Insert into transaction_items table
        const stmt = db.prepare(
          "INSERT INTO transaction_items (transaction_id, product_id, product_name, price_at_sale, quantity) VALUES (?, ?, ?, ?, ?)"
        );
        cartItems.forEach((item: any) => {
          stmt.run(transactionId, item.id, item.name, item.price, item.quantity);
        });
        stmt.finalize(function(err) {
          if (err) {
            db.run("ROLLBACK");
            res.status(500).json({ error: err.message });
            return;
          }
          db.run("COMMIT", (commitErr) => {
            if (commitErr) {
              res.status(500).json({ error: commitErr.message });
              return;
            }
            res.status(201).json({ message: 'Transaction recorded successfully', transactionId });
          });
        });
      }
    );
  });
});

app.put('/products/:id/stock', (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  if (typeof quantity !== 'number' || quantity < 0) {
    return res.status(400).json({ error: 'Quantity must be a non-negative number.' });
  }

  const db = getDatabase();
  db.run("UPDATE products SET stock = stock - ? WHERE id = ?", [quantity, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Product not found or stock not updated.' });
      return;
    }
    res.json({ message: 'Product stock updated successfully' });
  });
});

app.get('/transactions', (req, res) => {
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

  db.all(query, params, (err, transactions: any[]) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    if (transactions.length === 0) {
      res.json([]);
      return;
    }

    const transactionsWithItems: any[] = [];
    let completedQueries = 0;

    transactions.forEach((transaction, index) => {
      db.all("SELECT * FROM transaction_items WHERE transaction_id = ?", [transaction.id], (err, items) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        transactionsWithItems[index] = { ...transaction, items };
        completedQueries++;

        if (completedQueries === transactions.length) {
          res.json(transactionsWithItems);
        }
      });
    });
  });
});

app.get('/reports/daily-sales', (req, res) => {
  const db = getDatabase();
  const { date } = req.query; // Format YYYY-MM-DD

  if (!date) {
    return res.status(400).json({ error: 'Date parameter is required (YYYY-MM-DD).' });
  }

  const startOfDay = new Date(date as string).setHours(0, 0, 0, 0);
  const endOfDay = new Date(date as string).setHours(23, 59, 59, 999);

  db.all(
    `SELECT
       strftime('%Y-%m-%d', timestamp / 1000, 'unixepoch', 'localtime') AS sale_date,
       SUM(total_amount) AS total_sales
     FROM transactions
     WHERE timestamp >= ? AND timestamp <= ?
     GROUP BY sale_date
     ORDER BY sale_date DESC`,
    [startOfDay, endOfDay],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

app.get('/reports/top-products', (req, res) => {
  const db = getDatabase();
  const { limit = 5 } = req.query; // Default limit to 5

  db.all(
    `SELECT
       product_name,
       SUM(quantity) AS total_quantity_sold,
       SUM(price_at_sale * quantity) AS total_revenue
     FROM transaction_items
     GROUP BY product_name
     ORDER BY total_quantity_sold DESC
     LIMIT ?`,
    [limit],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});


initializeDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
  });
}).catch(err => {
  console.error('Failed to initialize database and start server:', err);
});
