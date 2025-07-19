import express, { Request, Response } from 'express';
import { getDatabase } from '../database';
import { catchAsync, AppError } from '../errorHandler';
import { authenticate, requireAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Middleware autentikasi untuk semua route report
router.use(authenticate);

// Get daily sales report - accessible by both admin and cashier
router.get('/daily-sales', requireAuth, catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const { date } = req.query;
  
  if (!date) {
    throw new AppError(400, 'Date parameter is required');
  }

  const startOfDay = new Date(date as string).getTime();
  const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;

  const dailySales = await new Promise<any[]>((resolve, reject) => {
    db.all(`
      SELECT 
        ti.product_name,
        SUM(ti.quantity) as total_quantity_sold,
        SUM(ti.price_at_sale * ti.quantity) as total_revenue,
        SUM(ti.cost_price_at_sale * ti.quantity) as total_cost,
        p.category_id,
        c.name as category_name
      FROM transaction_items ti
      JOIN transactions t ON ti.transaction_id = t.id
      LEFT JOIN products p ON ti.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE t.timestamp BETWEEN ? AND ?
      GROUP BY ti.product_id, ti.product_name
      ORDER BY total_revenue DESC
    `, [startOfDay, endOfDay], (err, rows) => {
      if (err) reject(new AppError(500, 'Database error: ' + err.message));
      else resolve(rows);
    });
  });

  res.json(dailySales);
}));

// Get top products
router.get('/top-products', requireAuth, catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const { limit = 10 } = req.query;

  const topProducts = await new Promise<any[]>((resolve, reject) => {
    db.all(`
      SELECT 
        ti.product_name,
        SUM(ti.quantity) as total_quantity_sold,
        SUM(ti.price_at_sale * ti.quantity) as total_revenue
      FROM transaction_items ti
      JOIN transactions t ON ti.transaction_id = t.id
      GROUP BY ti.product_id, ti.product_name
      ORDER BY total_quantity_sold DESC
      LIMIT ?
    `, [Number(limit)], (err, rows) => {
      if (err) reject(new AppError(500, 'Database error: ' + err.message));
      else resolve(rows);
    });
  });

  res.json(topProducts);
}));

// Get profit/loss report
router.get('/profit-loss', requireAuth, catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const { startDate, endDate, categoryId } = req.query;
  
  let query = `
    SELECT 
      ti.product_name,
      SUM(ti.quantity) as total_quantity_sold,
      SUM(ti.price_at_sale * ti.quantity) as total_revenue,
      COALESCE(SUM(ti.cost_price_at_sale * ti.quantity), 0) as total_cost,
      (SUM(ti.price_at_sale * ti.quantity) - COALESCE(SUM(ti.cost_price_at_sale * ti.quantity), 0)) as total_profit,
      COALESCE(c.name, 'Uncategorized') as category_name
    FROM transaction_items ti
    JOIN transactions t ON ti.transaction_id = t.id
    LEFT JOIN products p ON ti.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE 1=1
  `;
  
  const params: any[] = [];

  if (startDate) {
    query += " AND t.timestamp >= ?";
    params.push(Number(startDate));
  }
  
  if (endDate) {
    query += " AND t.timestamp <= ?";
    params.push(Number(endDate));
  }
  
  if (categoryId && categoryId !== '') {
    query += " AND p.category_id = ?";
    params.push(categoryId);
  }

  query += `
    GROUP BY ti.product_id, ti.product_name, c.name
    ORDER BY total_profit DESC
  `;

  const profitLoss = await new Promise<any[]>((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Profit-loss query error:', err);
        reject(new AppError(500, 'Database error: ' + err.message));
      } else {
        resolve(rows || []);
      }
    });
  });

  res.json(profitLoss);
}));

export default router;
