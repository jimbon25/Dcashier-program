import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
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
    
    if (!username || !password) {
      throw new AppError(400, 'Username dan password harus diisi');
    }
    
    const db = getDatabase();
    
    const user: any = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
        if (err) {
          logger.error('Database error during login:', err);
          reject(new AppError(500, 'Database error'));
        } else {
          resolve(row);
        }
      });
    });

    if (!user) {
      logger.warn(`Login attempt with non-existent username: ${username}`);
      throw new AppError(401, 'Username atau password salah');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      logger.warn(`Invalid password attempt for user: ${username}`);
      throw new AppError(401, 'Username atau password salah');
    }

    // Generate tokens with longer expiration for better UX
    const jwtSecret = process.env.JWT_SECRET || 'supersecretjwtkey';
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    
    const payload = { 
      id: user.id, 
      username: user.username, 
      role: user.role
    };
    
    const options: SignOptions = { expiresIn };
    const accessToken = jwt.sign(payload, jwtSecret, options);

    const refreshToken = generateRefreshToken();
    await storeRefreshToken(user.id, refreshToken);

    logger.info(`User logged in successfully: ${username}, role: ${user.role}`);
    
    res.json({ 
      status: 'success',
      message: 'Login berhasil',
      data: {
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        },
        accessToken,
        refreshToken,
        expiresIn
      }
    });
  }

  static async refreshToken(req: Request, res: Response) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError(400, 'Refresh token diperlukan');
    }

    try {
      const tokenData: any = await verifyRefreshToken(refreshToken);
      const jwtSecret = process.env.JWT_SECRET || 'supersecretjwtkey';
      const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
      
      const payload = {
        id: tokenData.user_id,
        username: tokenData.username,
        role: tokenData.role
      };
      
      const options: SignOptions = { expiresIn };
      const accessToken = jwt.sign(payload, jwtSecret, options);

      res.json({
        status: 'success',
        data: {
          accessToken,
          expiresIn
        }
      });
    } catch (error) {
      logger.error('Error refreshing token:', error);
      throw new AppError(401, 'Invalid refresh token');
    }
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
