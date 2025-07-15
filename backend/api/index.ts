import express from 'express';
import cors from 'cors';
import { initializeDatabase, getDatabase } from '../src/database';

const app = express();

app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Enable JSON body parsing

// Initialize database once on cold start
let isDbInitialized = false;
initializeDatabase().then(() => {
  isDbInitialized = true;
  console.log('Database initialized for Vercel function.');
}).catch(err => {
  console.error('Failed to initialize database for Vercel function:', err);
});

app.get('/', (req, res) => {
  res.send('Hello from Vercel Backend!');
});

app.get('/products', (req, res) => {
  if (!isDbInitialized) {
    res.status(503).json({ error: 'Database not yet initialized. Please try again in a moment.' });
    return;
  }
  const db = getDatabase();
  db.all("SELECT * FROM products", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/products', (req, res) => {
  if (!isDbInitialized) {
    res.status(503).json({ error: 'Database not yet initialized. Please try again in a moment.' });
    return;
  }
  const { id, name, price, stock } = req.body;
  if (!id || !name || !price || !stock) {
    return res.status(400).json({ error: 'All fields (id, name, price, stock) are required.' });
  }

  const db = getDatabase();
  db.run("INSERT INTO products (id, name, price, stock) VALUES (?, ?, ?, ?)", [id, name, price, stock], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(201).json({ message: 'Product added successfully', id: this.lastID });
  });
});

app.get('/products/:id', (req, res) => {
  if (!isDbInitialized) {
    res.status(503).json({ error: 'Database not yet initialized. Please try again in a moment.' });
    return;
  }
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

app.put('/products/:id', (req, res) => {
  if (!isDbInitialized) {
    res.status(503).json({ error: 'Database not yet initialized. Please try again in a moment.' });
    return;
  }
  const { id } = req.params;
  const { name, price, stock } = req.body;
  if (!name || !price || !stock) {
    return res.status(400).json({ error: 'All fields (name, price, stock) are required.' });
  }

  const db = getDatabase();
  db.run("UPDATE products SET name = ?, price = ?, stock = ? WHERE id = ?", [name, price, stock, id], function(err) {
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
  if (!isDbInitialized) {
    res.status(503).json({ error: 'Database not yet initialized. Please try again in a moment.' });
    return;
  }
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

app.post('/transactions', (req, res) => {
  if (!isDbInitialized) {
    res.status(503).json({ error: 'Database not yet initialized. Please try again in a moment.' });
    return;
  }
  const { total_amount, payment_amount, change_amount, cartItems } = req.body;
  const db = getDatabase();
  const transactionId = `TRX-${Date.now()}`;
  const timestamp = Date.now();

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    // Insert into transactions table
    db.run(
      "INSERT INTO transactions (id, timestamp, total_amount, payment_amount, change_amount) VALUES (?, ?, ?, ?, ?)",
      [transactionId, timestamp, total_amount, payment_amount, change_amount],
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
  if (!isDbInitialized) {
    res.status(503).json({ error: 'Database not yet initialized. Please try again in a moment.' });
    return;
  }
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
  if (!isDbInitialized) {
    res.status(503).json({ error: 'Database not yet initialized. Please try again in a moment.' });
    return;
  }
  const db = getDatabase();
  db.all("SELECT * FROM transactions ORDER BY timestamp DESC", [], (err, transactions: any[]) => {
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

export default app;
