"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./database");
const logger_1 = __importDefault(require("./logger"));
const errorHandler_1 = require("./errorHandler");
const requestLogger_1 = require("./middleware/requestLogger");
const responseTime_1 = require("./middleware/responseTime");
const rateLimiter_1 = require("./middleware/rateLimiter");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("./config/swagger");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
const transaction_routes_1 = __importDefault(require("./routes/transaction.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const report_routes_1 = __importDefault(require("./routes/report.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
const nodeEnv = process.env.NODE_ENV || 'development';
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
// Security middleware
if (process.env.ENABLE_HELMET !== 'false') {
    app.use((0, helmet_1.default)({
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
    app.use((0, compression_1.default)());
}
// CORS configuration
const corsOptions = {
    origin: '*', // Allow all origins for now
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
    exposedHeaders: ['x-csrf-token']
};
app.use((0, cors_1.default)(corsOptions));
// Response time and logging middleware
app.use(responseTime_1.responseTime);
app.use(requestLogger_1.requestLogger);
// Body parsing middleware with conditional logic for uploads
app.use((req, res, next) => {
    if (req.path.startsWith('/upload/')) {
        next();
    }
    else {
        express_1.default.json({ limit: '10mb' })(req, res, next);
    }
});
app.use((req, res, next) => {
    if (req.path.startsWith('/upload/')) {
        next();
    }
    else {
        express_1.default.urlencoded({ extended: true, limit: '10mb' })(req, res, next);
    }
});
// Security and rate limiting
app.use('/api', rateLimiter_1.apiLimiter);
// Serve static files
app.use('/uploads', express_1.default.static('uploads'));
// API documentation (only in development)
if (nodeEnv === 'development') {
    app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.specs, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Dcashier API Documentation'
    }));
}
// API routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/products', product_routes_1.default);
app.use('/api/categories', category_routes_1.default);
app.use('/api/transactions', transaction_routes_1.default);
app.use('/api/upload', upload_routes_1.default);
app.use('/api/reports', report_routes_1.default);
app.use('/api/users', user_routes_1.default);
// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'DCashier API Server',
        version: '1.0.0',
        health: '/health',
        api: '/api',
        documentation: nodeEnv === 'development' ? '/api-docs' : 'API documentation available in development mode'
    });
});
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: nodeEnv,
        version: process.env.npm_package_version || '1.0.0'
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
app.use(errorHandler_1.errorHandler);
// Initialize database
function initApp() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, database_1.initializeDatabase)();
            logger_1.default.info('✅ Database initialized successfully');
        }
        catch (error) {
            logger_1.default.error('❌ Failed to initialize database:', error);
        }
    });
}
// Initialize database and start server (only if not in Vercel)
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, database_1.initializeDatabase)();
            app.listen(port, () => {
                logger_1.default.info(`🚀 Server running on port ${port}`);
                logger_1.default.info(`📱 Environment: ${nodeEnv}`);
                logger_1.default.info(`🔗 Health check: http://localhost:${port}/health`);
                if (nodeEnv === 'development') {
                    logger_1.default.info(`📚 API Documentation: http://localhost:${port}/api-docs`);
                }
            });
        }
        catch (error) {
            logger_1.default.error('❌ Failed to start server:', error);
            process.exit(1);
        }
    });
}
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger_1.default.error('💥 Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (error) => {
    logger_1.default.error('💥 Unhandled Rejection:', error);
    process.exit(1);
});
// Initialize database for Vercel
initApp();
// Only start server if not in Vercel (when there's no VERCEL env var)
if (!process.env.VERCEL) {
    startServer();
}
exports.default = app;
