import rateLimit from 'express-rate-limit';
import { AppError } from '../errorHandler';

// Rate limit options
const defaultOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Terlalu banyak request dari IP ini, silakan coba lagi dalam 15 menit',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
};

// Strict rate limit untuk endpoints sensitif
const strictOptions = {
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Terlalu banyak request untuk operasi sensitif, silakan coba lagi dalam 1 jam',
  standardHeaders: true,
  legacyHeaders: false,
};

// Rate limiter untuk API secara umum
export const apiLimiter = rateLimit({
  ...defaultOptions,
  handler: (req, res, next, options) => {
    throw new AppError(429, options.message);
  },
});

// Rate limiter untuk endpoint login/register
export const authLimiter = rateLimit({
  ...strictOptions,
  handler: (req, res, next, options) => {
    throw new AppError(429, options.message);
  },
});

// Rate limiter untuk operasi sensitif (misal: delete, reset password)
export const strictLimiter = rateLimit({
  ...strictOptions,
  max: 3, // Lebih ketat
  handler: (req, res, next, options) => {
    throw new AppError(429, options.message);
  },
});
