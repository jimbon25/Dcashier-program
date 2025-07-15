import express from 'express';
import cors from 'cors';
import { initializeDatabase, getPool } from '../src/database';

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

app.get('/products', async (req, res) => {
  if (!isDbInitialized) {
    res.status(503).json({ error: 'Database not yet initialized. Please try again in a moment.' });
    return;
  }
  try {
    const pool = getPool();
    const result = await pool.query("SELECT * FROM products");
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/products', async (req, res) => {
  if (!isDbInitialized) {
    res.status(503).json({ error: 'Database not yet initialized. Please try again in a moment.' });
    return;
  }
  const { id, name, price, stock } = req.body;
  if (!id || !name || !price || !stock) {
    return res.status(400).json({ error: 'All fields (id, name, price, stock) are required.' });
  }

  try {
    const pool = getPool();
    await pool.query("INSERT INTO products (id, name, price, stock) VALUES ($1, $2, $3, $4)", [id, name, price, stock]);
    res.status(201).json({ message: 'Product added successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/products/:id', async (req, res) => {
  if (!isDbInitialized) {
    res.status(503).json({ error: 'Database not yet initialized. Please try again in a moment.' });
    return;
  }
  const { id } = req.params;
  try {
    const pool = getPool();
    const result = await pool.query("SELECT * FROM products WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/products/:id', async (req, res) => {
  if (!isDbInitialized) {
    res.status(503).json({ error: 'Database not yet initialized. Please try again in a moment.' });
    return;
  }
  const { id } = req.params;
  const { name, price, stock } = req.body;
  if (!name || !price || !stock) {
    return res.status(400).json({ error: 'All fields (name, price, stock) are required.' });
  }

  try {
    const pool = getPool();
    const result = await pool.query("UPDATE products SET name = $1, price = $2, stock = $3 WHERE id = $4", [name, price, stock, id]);
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Product not found or no changes made.' });
      return;
    }
    res.json({ message: 'Product updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/products/:id', async (req, res) => {
  if (!isDbInitialized) {
    res.status(503).json({ error: 'Database not yet initialized. Please try again in a moment.' });
    return;
  }
  const { id } = req.params;
  try {
    const pool = getPool();
    const result = await pool.query("DELETE FROM products WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/transactions', async (req, res) => {
  if (!isDbInitialized) {
    res.status(503).json({ error: 'Database not yet initialized. Please try again in a moment.' });
    return;
  }
  const { total_amount, payment_amount, change_amount, cartItems } = req.body;
  const pool = getPool();
  const transactionId = `TRX-${Date.now()}`;
  const timestamp = Date.now();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Insert into transactions table
    await client.query(
      "INSERT INTO transactions (id, timestamp, total_amount, payment_amount, change_amount) VALUES ($1, $2, $3, $4, $5)",
      [transactionId, timestamp, total_amount, payment_amount, change_amount]
    );

    // Insert into transaction_items table
    for (const item of cartItems) {
      await client.query(
        "INSERT INTO transaction_items (transaction_id, product_id, product_name, price_at_sale, quantity) VALUES ($1, $2, $3, $4, $5)",
        [transactionId, item.id, item.name, item.price, item.quantity]
      );
    }

    await client.query("COMMIT");
    res.status(201).json({ message: 'Transaction recorded successfully', transactionId });
  } catch (err: any) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.put('/products/:id/stock', async (req, res) => {
  if (!isDbInitialized) {
    res.status(503).json({ error: 'Database not yet initialized. Please try again in a moment.' });
    return;
  }
  const { id } = req.params;
  const { quantity } = req.body;
  if (typeof quantity !== 'number' || quantity < 0) {
    return res.status(400).json({ error: 'Quantity must be a non-negative number.' });
  }

  try {
    const pool = getPool();
    const result = await pool.query("UPDATE products SET stock = stock - $1 WHERE id = $2", [quantity, id]);
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Product not found or stock not updated.' });
      return;
    }
    res.json({ message: 'Product stock updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/transactions', async (req, res) => {
  if (!isDbInitialized) {
    res.status(503).json({ error: 'Database not yet initialized. Please try again in a moment.' });
    return;
  }
  try {
    const pool = getPool();
    const transactionsResult = await pool.query("SELECT * FROM transactions ORDER BY timestamp DESC");
    const transactions = transactionsResult.rows;

    if (transactions.length === 0) {
      res.json([]);
      return;
    }

    const transactionsWithItems: any[] = [];
    for (const transaction of transactions) {
      const itemsResult = await pool.query("SELECT * FROM transaction_items WHERE transaction_id = $1", [transaction.id]);
      transactionsWithItems.push({ ...transaction, items: itemsResult.rows });
    }

    res.json(transactionsWithItems);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default app;