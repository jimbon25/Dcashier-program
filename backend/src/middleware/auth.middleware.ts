import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../errorHandler';
import logger from '../logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: 'admin' | 'cashier';
  };
}

// Middleware untuk autentikasi
export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      logger.warn(`Authentication failed: No authorization header - ${req.method} ${req.path}`);
      throw new AppError(401, 'Token akses diperlukan');
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    if (!token || token === 'Bearer') {
      logger.warn(`Authentication failed: Invalid token format - ${req.method} ${req.path}`);
      throw new AppError(401, 'Format token tidak valid');
    }
    
    const jwtSecret = process.env.JWT_SECRET || 'supersecretjwtkey';
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    // Validate token payload
    if (!decoded.id || !decoded.username || !decoded.role) {
      logger.warn(`Authentication failed: Invalid token payload - ${req.method} ${req.path}`);
      throw new AppError(401, 'Token tidak valid - payload incomplete');
    }
    
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role
    };
    
    logger.debug(`User authenticated: ${decoded.username} (${decoded.role}) - ${req.method} ${req.path}`);
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn(`Authentication failed: Token expired - ${req.method} ${req.path}`);
      throw new AppError(401, 'Token telah kedaluwarsa');
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.warn(`Authentication failed: Invalid token - ${req.method} ${req.path}`);
      throw new AppError(401, 'Token tidak valid');
    } else if (error instanceof AppError) {
      throw error;
    } else {
      logger.error(`Authentication error: ${error} - ${req.method} ${req.path}`);
      throw new AppError(401, 'Authentication failed');
    }
  }
};

// Middleware untuk otorisasi berdasarkan role
export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        logger.warn(`Authorization failed: No user in request - ${req.method} ${req.path}`);
        throw new AppError(401, 'Token akses diperlukan');
      }
      
      if (!roles.includes(req.user.role)) {
        logger.warn(`Authorization failed: User ${req.user.username} with role ${req.user.role} tried to access ${req.method} ${req.path}, required roles: ${roles.join(', ')}`);
        throw new AppError(403, `Akses ditolak. Diperlukan role: ${roles.join(' atau ')}`);
      }
      
      logger.debug(`Authorization successful: ${req.user.username} (${req.user.role}) - ${req.method} ${req.path}`);
      next();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      } else {
        logger.error(`Authorization error: ${error} - ${req.method} ${req.path}`);
        throw new AppError(403, 'Authorization failed');
      }
    }
  };
};

// Middleware khusus untuk admin
export const requireAdmin = requireRole(['admin']);

// Middleware untuk admin atau cashier
export const requireAuth = requireRole(['admin', 'cashier']);

// Middleware untuk cashier only
export const requireCashier = requireRole(['cashier']);

// Optional authentication - doesn't fail if no token
export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return next();
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    if (!token || token === 'Bearer') {
      return next();
    }
    
    const jwtSecret = process.env.JWT_SECRET || 'supersecretjwtkey';
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    if (decoded.id && decoded.username && decoded.role) {
      req.user = {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role
      };
    }
    
    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};
