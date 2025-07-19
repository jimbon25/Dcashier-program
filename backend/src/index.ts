import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { initializeDatabase } from './database';
import logger from './logger';
import { errorHandler } from './errorHandler';

import { requestLogger } from './middleware/requestLogger';
import { responseTime } from './middleware/responseTime';
import { apiLimiter } from './middleware/rateLimiter';
import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import categoryRoutes from './routes/category.routes';
import transactionRoutes from './routes/transaction.routes';
import uploadRoutes from './routes/upload.routes';
import reportRoutes from './routes/report.routes';
import userRoutes from './routes/user.routes';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const nodeEnv = process.env.NODE_ENV || 'development';
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

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

// CORS configuration
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      frontendUrl,
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ];
    
    // Add production frontend URLs from environment
    if (process.env.PRODUCTION_FRONTEND_URLS) {
      allowedOrigins.push(...process.env.PRODUCTION_FRONTEND_URLS.split(','));
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`Blocked CORS request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
  exposedHeaders: ['x-csrf-token']
};

app.use(cors(corsOptions));

// Response time and logging middleware
app.use(responseTime);
app.use(requestLogger);

// Body parsing middleware with conditional logic for uploads
app.use((req, res, next) => {
  if (req.path.startsWith('/upload/')) {
    next();
  } else {
    express.json({ limit: '10mb' })(req, res, next);
  }
});

app.use((req, res, next) => {
  if (req.path.startsWith('/upload/')) {
    next();
  } else {
    express.urlencoded({ extended: true, limit: '10mb' })(req, res, next);
  }
});

// Security and rate limiting
app.use('/api', apiLimiter);

// Serve static files
app.use('/uploads', express.static('uploads'));

// API documentation (only in development)
if (nodeEnv === 'development') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Dcashier API Documentation'
  }));
}

// API routes
app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/categories', categoryRoutes);
app.use('/transactions', transactionRoutes);
app.use('/upload', uploadRoutes);
app.use('/reports', reportRoutes);
app.use('/users', userRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: nodeEnv,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method 
  });
});

// Global error handler
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    
    app.listen(port, () => {
      logger.info(`🚀 Server running on port ${port}`);
      logger.info(`📱 Environment: ${nodeEnv}`);
      logger.info(`🔗 Health check: http://localhost:${port}/health`);
      
      if (nodeEnv === 'development') {
        logger.info(`📚 API Documentation: http://localhost:${port}/api-docs`);
      }
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  logger.error('💥 Unhandled Rejection:', error);
  process.exit(1);
});

startServer();

export default app;
