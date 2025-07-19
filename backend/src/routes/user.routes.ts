import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../database';
import { catchAsync, AppError } from '../errorHandler';
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Middleware autentikasi untuk semua route user - hanya admin yang dapat mengakses user management
router.use(authenticate);
router.use(requireAdmin);

// GET /users - Get all users (admin only)
router.get('/', catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  
  // Check if user is admin
  if ((req as any).user.role !== 'admin') {
    throw new AppError(403, 'Access denied. Admin role required.');
  }

  const users = await new Promise<any[]>((resolve, reject) => {
    db.all("SELECT id, username, role FROM users ORDER BY id", [], (err, rows) => {
      if (err) reject(new AppError(500, 'Database error: ' + err.message));
      else resolve(rows);
    });
  });

  res.json(users);
}));

// POST /users - Create new user (admin only)
router.post('/', catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const { username, password, role } = req.body;
  
  // Check if user is admin
  if ((req as any).user.role !== 'admin') {
    throw new AppError(403, 'Access denied. Admin role required.');
  }

  if (!username || !password) {
    throw new AppError(400, 'Username and password are required');
  }

  if (!['admin', 'cashier'].includes(role)) {
    throw new AppError(400, 'Invalid role. Must be admin or cashier');
  }

  // Check if username already exists
  const existingUser = await new Promise<any>((resolve, reject) => {
    db.get("SELECT id FROM users WHERE username = ?", [username], (err, row) => {
      if (err) reject(new AppError(500, 'Database error: ' + err.message));
      else resolve(row);
    });
  });

  if (existingUser) {
    throw new AppError(400, 'Username already exists');
  }

  // Hash password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create user
  await new Promise<void>((resolve, reject) => {
    db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", 
      [username, hashedPassword, role], function(err) {
      if (err) reject(new AppError(500, 'Database error: ' + err.message));
      else resolve();
    });
  });

  res.status(201).json({ message: 'User created successfully' });
}));

// PUT /users/:id - Update user (admin only)
router.put('/:id', catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  const { username, password, role } = req.body;
  
  // Check if user is admin
  if ((req as any).user.role !== 'admin') {
    throw new AppError(403, 'Access denied. Admin role required.');
  }

  if (!username) {
    throw new AppError(400, 'Username is required');
  }

  if (role && !['admin', 'cashier'].includes(role)) {
    throw new AppError(400, 'Invalid role. Must be admin or cashier');
  }

  // Check if user exists
  const existingUser = await new Promise<any>((resolve, reject) => {
    db.get("SELECT id FROM users WHERE id = ?", [id], (err, row) => {
      if (err) reject(new AppError(500, 'Database error: ' + err.message));
      else resolve(row);
    });
  });

  if (!existingUser) {
    throw new AppError(404, 'User not found');
  }

  // Check if username is taken by another user
  const usernameCheck = await new Promise<any>((resolve, reject) => {
    db.get("SELECT id FROM users WHERE username = ? AND id != ?", [username, id], (err, row) => {
      if (err) reject(new AppError(500, 'Database error: ' + err.message));
      else resolve(row);
    });
  });

  if (usernameCheck) {
    throw new AppError(400, 'Username already exists');
  }

  // Update user
  let query = "UPDATE users SET username = ?, role = ? WHERE id = ?";
  let params = [username, role || 'cashier', id];

  if (password) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    query = "UPDATE users SET username = ?, password = ?, role = ? WHERE id = ?";
    params = [username, hashedPassword, role || 'cashier', id];
  }

  await new Promise<void>((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(new AppError(500, 'Database error: ' + err.message));
      else resolve();
    });
  });

  res.json({ message: 'User updated successfully' });
}));

// DELETE /users/:id - Delete user (admin only)
router.delete('/:id', catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  
  // Check if user is admin
  if ((req as any).user.role !== 'admin') {
    throw new AppError(403, 'Access denied. Admin role required.');
  }

  // Check if user exists
  const existingUser = await new Promise<any>((resolve, reject) => {
    db.get("SELECT id FROM users WHERE id = ?", [id], (err, row) => {
      if (err) reject(new AppError(500, 'Database error: ' + err.message));
      else resolve(row);
    });
  });

  if (!existingUser) {
    throw new AppError(404, 'User not found');
  }

  // Don't allow deleting self
  if (id === String((req as any).user.id)) {
    throw new AppError(400, 'Cannot delete your own account');
  }

  // Delete user
  await new Promise<void>((resolve, reject) => {
    db.run("DELETE FROM users WHERE id = ?", [id], function(err) {
      if (err) reject(new AppError(500, 'Database error: ' + err.message));
      else resolve();
    });
  });

  res.json({ message: 'User deleted successfully' });
}));

export default router;
