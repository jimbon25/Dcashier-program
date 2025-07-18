import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDatabase, runAsync } from '../database';
import { AppError } from '../errorHandler';
import logger from '../logger';
import {
  generateRefreshToken,
  storeRefreshToken,
  verifyRefreshToken,
  deleteRefreshToken
} from '../authUtils';

export class AuthController {
  static async register(req: Request, res: Response) {
    const { username, password } = req.body;
    
    const db = getDatabase();
    const hashedPassword = await bcrypt.hash(password, 12);
    await runAsync(db, "INSERT INTO users (username, password, role) VALUES (?, ?, 'cashier')", [username, hashedPassword]);
    
    logger.info(`New user registered: ${username}`);
    res.status(201).json({ 
      status: 'success',
      message: 'Registrasi berhasil' 
    });
  }

  static async login(req: Request, res: Response) {
    const { username, password } = req.body;
    const db = getDatabase();
    
    const user: any = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
        if (err) reject(new AppError(500, 'Database error'));
        else resolve(row);
      });
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new AppError(401, 'Username atau password salah');
    }

    const accessToken = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'supersecretjwtkey',
      { expiresIn: '15m' }
    );

    const refreshToken = generateRefreshToken();
    await storeRefreshToken(user.id, refreshToken);

    logger.info(`User logged in: ${username}`);
    res.json({ 
      status: 'success',
      message: 'Login berhasil',
      data: {
        accessToken,
        refreshToken,
        role: user.role
      }
    });
  }

  static async refreshToken(req: Request, res: Response) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError(400, 'Refresh token diperlukan');
    }

    const tokenData: any = await verifyRefreshToken(refreshToken);
    const accessToken = jwt.sign(
      { id: tokenData.user_id, username: tokenData.username, role: tokenData.role },
      process.env.JWT_SECRET || 'supersecretjwtkey',
      { expiresIn: '15m' }
    );

    res.json({
      status: 'success',
      data: {
        accessToken
      }
    });
  }

  static async logout(req: Request, res: Response) {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await deleteRefreshToken(refreshToken);
    }

    res.json({
      status: 'success',
      message: 'Logout berhasil'
    });
  }
}
