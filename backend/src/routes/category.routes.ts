import express, { Request, Response } from 'express';
import { getDatabase, runAsync } from '../database';
import { catchAsync, AppError } from '../errorHandler';

const router = express.Router();

// Get all categories
router.get('/', catchAsync(async (req: Request, res: Response) => {
  const db = getDatabase();
  const categories = await new Promise((resolve, reject) => {
    db.all("SELECT * FROM categories", [], (err, rows) => {
      if (err) reject(new AppError(500, 'Database error: ' + err.message));
      else resolve(rows);
    });
  });
  res.json(categories);
}));

// Get category by ID
router.get('/:id', catchAsync(async (req: Request, res: Response) => {
  const db = getDatabase();
  const category = await new Promise((resolve, reject) => {
    db.get("SELECT * FROM categories WHERE id = ?", [req.params.id], (err, row) => {
      if (err) reject(new AppError(500, 'Database error: ' + err.message));
      else resolve(row);
    });
  });
  
  if (!category) {
    throw new AppError(404, 'Category not found');
  }
  
  res.json(category);
}));

// Create new category
router.post('/', catchAsync(async (req: Request, res: Response) => {
  const { id, name } = req.body;
  
  if (!id || !name) {
    throw new AppError(400, 'Required fields: id, name');
  }
  
  const db = getDatabase();
  
  // Check if category ID already exists
  const existingCategory = await new Promise((resolve, reject) => {
    db.get("SELECT id FROM categories WHERE id = ?", [id], (err, row) => {
      if (err) reject(new AppError(500, 'Database error: ' + err.message));
      else resolve(row);
    });
  });
  
  if (existingCategory) {
    throw new AppError(409, 'Category ID already exists');
  }
  
  // Insert new category
  await runAsync(db, "INSERT INTO categories (id, name) VALUES (?, ?)", [id, name]);
  
  res.status(201).json({ message: 'Category created successfully', id });
}));

// Update category
router.put('/:id', catchAsync(async (req: Request, res: Response) => {
  const { name } = req.body;
  
  if (!name) {
    throw new AppError(400, 'Required field: name');
  }
  
  const db = getDatabase();
  
  // Check if category exists
  const existingCategory = await new Promise((resolve, reject) => {
    db.get("SELECT id FROM categories WHERE id = ?", [req.params.id], (err, row) => {
      if (err) reject(new AppError(500, 'Database error: ' + err.message));
      else resolve(row);
    });
  });
  
  if (!existingCategory) {
    throw new AppError(404, 'Category not found');
  }
  
  // Update category
  await runAsync(db, "UPDATE categories SET name = ? WHERE id = ?", [name, req.params.id]);
  
  res.json({ message: 'Category updated successfully' });
}));

// Delete category
router.delete('/:id', catchAsync(async (req: Request, res: Response) => {
  const db = getDatabase();
  
  // Check if category exists
  const existingCategory = await new Promise((resolve, reject) => {
    db.get("SELECT id FROM categories WHERE id = ?", [req.params.id], (err, row) => {
      if (err) reject(new AppError(500, 'Database error: ' + err.message));
      else resolve(row);
    });
  });
  
  if (!existingCategory) {
    throw new AppError(404, 'Category not found');
  }
  
  // Delete category
  await runAsync(db, "DELETE FROM categories WHERE id = ?", [req.params.id]);
  
  res.json({ message: 'Category deleted successfully' });
}));

export default router;