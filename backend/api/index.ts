import { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { initializeDatabase } from '../src/database';
import logger from '../src/logger';
import { errorHandler } from '../src/errorHandler';

import { requestLogger } from '../src/middleware/requestLogger';
import { responseTime } from '../src/middleware/responseTime';
import { apiLimiter } from '../src/middleware/rateLimiter';
import authRoutes from '../src/routes/auth.routes';
import productRoutes from '../src/routes/product.routes';
import categoryRoutes from '../src/routes/category.routes';
import transactionRoutes from '../src/routes/transaction.routes';
import uploadRoutes from '../src/routes/upload.routes';
import reportRoutes from '../src/routes/report.routes';
import userRoutes from '../src/routes/user.routes';

// Load environment variables
dotenv.config();

const app = express();
const nodeEnv = process.env.NODE_ENV || 'production';

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

// CORS configuration - SANGAT PENTING untuk frontend-backend komunikasi
const corsOptions = {
  origin: [
    'https://dcashier.netlify.app',
    'http://localhost:3000',
    'https://localhost:3000'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'x-csrf-token',
    'X-Requested-With',
    'Accept',
    'Accept-Version',
    'Content-Length',
    'Content-MD5',
    'Date',
    'X-Api-Version'
  ],
  exposedHeaders: ['x-csrf-token']
};

app.use(cors(corsOptions));

// Handle preflight requests untuk semua routes
app.options('*', cors(corsOptions));

// Response time and logging middleware
app.use(responseTime);
app.use(requestLogger);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security and rate limiting
app.use('/api', apiLimiter);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'DCashier API Server',
    version: '1.0.0',
    health: '/health',
    api: '/api',
    environment: nodeEnv,
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: nodeEnv,
    version: '1.0.0'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method 
  });
});

// Global error handler
app.use(errorHandler);

// Initialize database
let dbInitialized = false;
async function initDb() {
  if (!dbInitialized) {
    try {
      await initializeDatabase();
      dbInitialized = true;
      logger.info('✅ Database initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize database:', error);
    }
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await initDb();
  return app(req, res);
}
