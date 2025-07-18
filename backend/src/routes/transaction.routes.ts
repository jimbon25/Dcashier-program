import express, { Request, Response } from 'express';
import { getDatabase, runAsync } from '../database';
import { catchAsync, AppError } from '../errorHandler';

const router = express.Router();

// Get all transactions
router.get('/', catchAsync(async (req: Request, res: Response) => {
  const db = getDatabase();
  const { startDate, endDate } = req.query;
  let query = "SELECT * FROM transactions";
  const params: any[] = [];

  if (startDate && endDate) {
    query += " WHERE timestamp BETWEEN ? AND ?";
    params.push(Number(startDate));
    params.push(Number(endDate));
  } else if (startDate) {
    query += " WHERE timestamp >= ?";
    params.push(Number(startDate));
  } else if (endDate) {
    query += " WHERE timestamp <= ?";
    params.push(Number(endDate));
  }

  query += " ORDER BY timestamp DESC";

  const transactions = await new Promise<any[]>((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(new AppError(500, 'Database error: ' + err.message));
      else resolve(rows);
    });
  });

  // Fetch transaction items for each transaction
  const transactionsWithItems = await Promise.all(transactions.map(async (trx: any) => {
    const items = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM transaction_items WHERE transaction_id = ?", [trx.id], (err, rows) => {
        if (err) reject(new AppError(500, 'Database error: ' + err.message));
        else resolve(rows);
      });
    });
    return { ...trx, items };
  }));

  res.json(transactionsWithItems);
}));

// Get transaction by ID
router.get('/:id', catchAsync(async (req: Request, res: Response) => {
  const db = getDatabase();
  const transaction = await new Promise((resolve, reject) => {
    db.get("SELECT * FROM transactions WHERE id = ?", [req.params.id], (err, row) => {
      if (err) reject(new AppError(500, 'Database error: ' + err.message));
      else resolve(row);
    });
  });

  if (!transaction) {
    throw new AppError(404, 'Transaction not found');
  }

  // Fetch transaction items
  const items = await new Promise((resolve, reject) => {
    db.all("SELECT * FROM transaction_items WHERE transaction_id = ?", [req.params.id], (err, rows) => {
      if (err) reject(new AppError(500, 'Database error: ' + err.message));
      else resolve(rows);
    });
  });

  res.json({ ...transaction, items });
}));

// Create new transaction
router.post('/', catchAsync(async (req: Request, res: Response) => {
  const { total_amount, payment_amount, change_amount, discount, items, payment_method } = req.body;
  
  if (!total_amount || !payment_amount || !items || !Array.isArray(items)) {
    throw new AppError(400, 'Required fields: total_amount, payment_amount, items');
  }

  const db = getDatabase();
  const transactionId = 'TXN' + Date.now();
  const timestamp = Date.now();

  // Insert transaction
  await runAsync(
    db,
    "INSERT INTO transactions (id, timestamp, total_amount, payment_amount, change_amount, discount, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [transactionId, timestamp, total_amount, payment_amount, change_amount || 0, discount || 0, payment_method || 'Cash']
  );

  // Insert transaction items
  for (const item of items) {
    await runAsync(
      db,
      "INSERT INTO transaction_items (transaction_id, product_id, product_name, price_at_sale, cost_price_at_sale, quantity) VALUES (?, ?, ?, ?, ?, ?)",
      [transactionId, item.product_id, item.product_name, item.price_at_sale, item.cost_price_at_sale || 0, item.quantity]
    );

    // Update product stock
    await runAsync(
      db,
      "UPDATE products SET stock = stock - ? WHERE id = ?",
      [item.quantity, item.product_id]
    );
  }

  res.status(201).json({ 
    message: 'Transaction created successfully', 
    transactionId,
    timestamp
  });
}));

// Delete transaction (for admin only)
router.delete('/:id', catchAsync(async (req: Request, res: Response) => {
  const db = getDatabase();
  
  // Check if transaction exists
  const existingTransaction = await new Promise((resolve, reject) => {
    db.get("SELECT id FROM transactions WHERE id = ?", [req.params.id], (err, row) => {
      if (err) reject(new AppError(500, 'Database error: ' + err.message));
      else resolve(row);
    });
  });
  
  if (!existingTransaction) {
    throw new AppError(404, 'Transaction not found');
  }
  
  // Delete transaction items first
  await runAsync(db, "DELETE FROM transaction_items WHERE transaction_id = ?", [req.params.id]);
  
  // Delete transaction
  await runAsync(db, "DELETE FROM transactions WHERE id = ?", [req.params.id]);
  
  res.json({ message: 'Transaction deleted successfully' });
}));

// Reset all transactions (for admin only)
router.post('/reset', catchAsync(async (req: Request, res: Response) => {
  const db = getDatabase();
  
  // Delete all transaction items
  await runAsync(db, "DELETE FROM transaction_items");
  
  // Delete all transactions
  await runAsync(db, "DELETE FROM transactions");
  
  res.json({ message: 'All transactions have been reset' });
}));

export default router;