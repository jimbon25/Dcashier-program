import express, { Request, Response } from 'express';
import { getDatabase, runAsync } from '../database';
import { catchAsync, AppError } from '../errorHandler';
import { authenticate, requireAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Middleware autentikasi untuk semua route produk
router.use(authenticate);

// Get all products - accessible by both admin and cashier
router.get('/', requireAuth, catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const products = await new Promise((resolve, reject) => {
    db.all("SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id", [], (err, rows) => {
      if (err) reject(new AppError(500, 'Database error: ' + err.message));
      else resolve(rows);
    });
  });
  res.json(products);
}));

// Get product by ID - accessible by both admin and cashier
router.get('/:id', requireAuth, catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const product = await new Promise((resolve, reject) => {
    db.get("SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?", [req.params.id], (err, row) => {
      if (err) reject(new AppError(500, 'Database error: ' + err.message));
      else resolve(row);
    });
  });
  
  if (!product) {
    throw new AppError(404, 'Product not found');
  }
  
  res.json(product);
}));

// Get product by barcode - accessible by both admin and cashier
router.get('/barcode/:barcode', requireAuth, catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const product = await new Promise((resolve, reject) => {
    db.get("SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.barcode = ?", [req.params.barcode], (err, row) => {
      if (err) reject(new AppError(500, 'Database error: ' + err.message));
      else resolve(row);
    });
  });
  
  if (!product) {
    throw new AppError(404, 'Product not found');
  }
  
  res.json(product);
}));

// Create new product - only admin
router.post('/', requireAdmin, catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id, name, price, cost_price, stock, barcode, category_id, image_url } = req.body;
  
  if (!id || !name || !price || stock === undefined) {
    throw new AppError(400, 'Required fields: id, name, price, stock');
  }
  
  const db = getDatabase();
  
  // Check if product ID already exists
  const existingProduct = await new Promise((resolve, reject) => {
    db.get("SELECT id FROM products WHERE id = ?", [id], (err, row) => {
      if (err) reject(new AppError(500, 'Database error: ' + err.message));
      else resolve(row);
    });
  });
  
  if (existingProduct) {
    throw new AppError(409, 'Product ID already exists');
  }
  
  // Insert new product
  await runAsync(
    db,
    "INSERT INTO products (id, name, price, cost_price, stock, barcode, category_id, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [id, name, price, cost_price || 0, stock, barcode || null, category_id || null, image_url || null]
  );
  
  res.status(201).json({ message: 'Product created successfully', id });
}));

// Update product - only admin
router.put('/:id', requireAdmin, catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { name, price, cost_price, stock, barcode, category_id, image_url } = req.body;
  
  if (!name || !price || stock === undefined) {
    throw new AppError(400, 'Required fields: name, price, stock');
  }
  
  const db = getDatabase();
  
  // Check if product exists
  const existingProduct = await new Promise((resolve, reject) => {
    db.get("SELECT id FROM products WHERE id = ?", [req.params.id], (err, row) => {
      if (err) reject(new AppError(500, 'Database error: ' + err.message));
      else resolve(row);
    });
  });
  
  if (!existingProduct) {
    throw new AppError(404, 'Product not found');
  }
  
  // Update product
  await runAsync(
    db,
    "UPDATE products SET name = ?, price = ?, cost_price = ?, stock = ?, barcode = ?, category_id = ?, image_url = ? WHERE id = ?",
    [name, price, cost_price || 0, stock, barcode || null, category_id || null, image_url || null, req.params.id]
  );
  
  res.json({ message: 'Product updated successfully' });
}));

// Delete product - only admin
router.delete('/:id', requireAdmin, catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  
  // Check if product exists
  const existingProduct = await new Promise((resolve, reject) => {
    db.get("SELECT id FROM products WHERE id = ?", [req.params.id], (err, row) => {
      if (err) reject(new AppError(500, 'Database error: ' + err.message));
      else resolve(row);
    });
  });
  
  if (!existingProduct) {
    throw new AppError(404, 'Product not found');
  }
  
  // Delete product
  await runAsync(db, "DELETE FROM products WHERE id = ?", [req.params.id]);
  
  res.json({ message: 'Product deleted successfully' });
}));

export default router;