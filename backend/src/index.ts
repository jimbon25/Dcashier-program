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
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'DCashier API Server',
    version: '1.0.0',
    health: '/health',
    api: '/api',
    documentation: nodeEnv === 'development' ? '/api-docs' : 'API documentation available in development mode'
  });
});

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

// Initialize database
async function initApp() {
  try {
    await initializeDatabase();
    logger.info('✅ Database initialized successfully');
    return true;
  } catch (error) {
    logger.error('❌ Failed to initialize database:', error);
    return false;
  }
}

// Initialize database and start server (only if not in Vercel)
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
  if (!process.env.VERCEL) {
    process.exit(1);
  }
});

process.on('unhandledRejection', (error) => {
  logger.error('💥 Unhandled Rejection:', error);
  if (!process.env.VERCEL) {
    process.exit(1);
  }
});

// Initialize database untuk Vercel (async)
if (process.env.VERCEL) {
  initApp();
} else {
  // Only start server if not in Vercel
  startServer();
}

export default app;
