import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './database';
import dotenv from 'dotenv';
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

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for file uploads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(responseTime);
app.use(requestLogger);

// Security middleware
// Security middleware
app.use('/api', apiLimiter);

// Serve static files
app.use('/uploads', express.static('uploads'));

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Dcashier API Documentation'
}));

// Routes
app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/categories', categoryRoutes);
app.use('/transactions', transactionRoutes);
app.use('/upload', uploadRoutes);
app.use('/reports', reportRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(errorHandler);

// Initialize database and start server
initializeDatabase().then(() => {
  app.listen(port, () => {
    logger.info(`Server is running at http://localhost:${port}`);
    logger.info(`API Documentation available at http://localhost:${port}/api-docs`);
  });
}).catch(err => {
  logger.error('Failed to initialize database:', err);
  process.exit(1);
});
