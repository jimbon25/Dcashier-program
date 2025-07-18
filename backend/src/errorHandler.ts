import { Request, Response, NextFunction } from 'express';
import logger from './logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    // Operational, trusted error: send message to client
    logger.error(`[${req.method}] ${req.path} >> StatusCode:: ${err.statusCode}, Message:: ${err.message}`);
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message
    });
  }

  // Programming or other unknown error: don't leak error details
  logger.error('ERROR 💥', err);
  return res.status(500).json({
    status: 'error',
    message: 'Terjadi kesalahan pada server.'
  });
};

// Middleware untuk menangani async errors
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};
