import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { initializeDatabase } from '../backend/src/database';
import logger from '../backend/src/logger';
import { errorHandler } from '../backend/src/errorHandler';

import { requestLogger } from '../backend/src/middleware/requestLogger';
import { responseTime } from '../backend/src/middleware/responseTime';
import { apiLimiter } from '../backend/src/middleware/rateLimiter';
import swaggerUi from 'swagger-ui-express';
import { specs } from '../backend/src/config/swagger';
import authRoutes from '../backend/src/routes/auth.routes';
import productRoutes from '../backend/src/routes/product.routes';
import categoryRoutes from '../backend/src/routes/category.routes';
import transactionRoutes from '../backend/src/routes/transaction.routes';
import uploadRoutes from '../backend/src/routes/upload.routes';
import reportRoutes from '../backend/src/routes/report.routes';
import userRoutes from '../backend/src/routes/user.routes';

// Load environment variables
dotenv.config();

const app = express();
const nodeEnv = process.env.NODE_ENV || 'production';
const frontendUrl = process.env.FRONTEND_URL || 'https://dcashier.netlify.app';

// Security middleware
if (process.env.ENABLE_HELMET !== 'false') {
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));
}

// Compression middleware
if (process.env.ENABLE_COMPRESSION !== 'false') {
  app.use(compression());
}

// Trust proxy
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

// Request logging
app.use(requestLogger);

// Response time tracking
app.use(responseTime);

// CORS configuration
app.use(cors({
  origin: [frontendUrl, 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: nodeEnv
  });
});

// API Documentation
if (nodeEnv === 'development') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'DCashier API Server',
    version: '1.0.0',
    health: '/health',
    documentation: nodeEnv === 'development' ? '/api-docs' : 'API documentation available in development mode'
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(errorHandler);

// Initialize database for Vercel
let isInitialized = false;
async function ensureInitialized() {
  if (!isInitialized) {
    try {
      await initializeDatabase();
      isInitialized = true;
      logger.info('📦 Database initialized for Vercel');
    } catch (error) {
      logger.error('❌ Database initialization failed:', error);
      throw error;
    }
  }
}

// Export handler for Vercel
export default async function handler(req: any, res: any) {
  await ensureInitialized();
  return app(req, res);
}
