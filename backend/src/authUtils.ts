import { NextFunction, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { getDatabase, runAsync } from './database';
import { AppError } from './errorHandler';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Rate limiting untuk login
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per window
  message: 'Terlalu banyak percobaan login, silakan coba lagi dalam 15 menit',
  standardHeaders: true,
  legacyHeaders: false,
});

const REFRESH_TOKEN_EXPIRES_IN = '7d';

export const generateRefreshToken = (): string => {
  return crypto.randomBytes(40).toString('hex');
};

export const storeRefreshToken = async (userId: number, refreshToken: string) => {
  const db = getDatabase();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await runAsync(
    db,
    "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
    [userId, refreshToken, expiresAt.toISOString()]
  );
};

export const verifyRefreshToken = async (refreshToken: string) => {
  const db = getDatabase();
  const token = await new Promise((resolve, reject) => {
    db.get(
      `SELECT rt.*, u.username, u.role 
       FROM refresh_tokens rt 
       JOIN users u ON rt.user_id = u.id 
       WHERE rt.token = ? AND rt.expires_at > datetime('now')`,
      [refreshToken],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (!token) {
    throw new AppError(401, 'Invalid refresh token');
  }

  return token;
};

export const deleteRefreshToken = async (refreshToken: string) => {
  const db = getDatabase();
  await runAsync(db, "DELETE FROM refresh_tokens WHERE token = ?", [refreshToken]);
};

// Validation middleware
export const validateLogin = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username diperlukan')
    .isLength({ min: 3 }).withMessage('Username minimal 3 karakter')
    .escape(),
  body('password')
    .trim()
    .notEmpty().withMessage('Password diperlukan')
    .isLength({ min: 8 }).withMessage('Password minimal 8 karakter'),
];

export const validateRegister = [
  ...validateLogin,
  body('username')
    .custom(async (value) => {
      const db = getDatabase();
      const user = await new Promise((resolve) => {
        db.get("SELECT id FROM users WHERE username = ?", [value], (_, row) => {
          resolve(row);
        });
      });
      if (user) {
        throw new Error('Username sudah digunakan');
      }
      return true;
    }),
  body('password')
    .matches(/[A-Z]/).withMessage('Password harus mengandung minimal 1 huruf besar')
    .matches(/[a-z]/).withMessage('Password harus mengandung minimal 1 huruf kecil')
    .matches(/[0-9]/).withMessage('Password harus mengandung minimal 1 angka')
    .matches(/[!@#$%^&*?]/).withMessage('Password harus mengandung minimal 1 karakter spesial (!@#$%^&*?)')
];

export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(err => err.msg);
    throw new AppError(400, messages.join(', '));
  }
  next();
};
