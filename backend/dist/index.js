"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const database_1 = require("./database");
const dotenv_1 = __importDefault(require("dotenv"));
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
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
// Basic middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(responseTime_1.responseTime);
app.use(requestLogger_1.requestLogger);
// Security middleware
// Security middleware
app.use('/api', rateLimiter_1.apiLimiter);
// Serve static files
app.use('/uploads', express_1.default.static('uploads'));
// Serve Swagger UI
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Dcashier API Documentation'
}));
// Routes
app.use('/auth', auth_routes_1.default);
app.use('/products', product_routes_1.default);
app.use('/categories', category_routes_1.default);
app.use('/transactions', transaction_routes_1.default);
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});
// Error handling middleware
app.use(errorHandler_1.errorHandler);
// Initialize database and start server
(0, database_1.initializeDatabase)().then(() => {
    app.listen(port, () => {
        logger_1.default.info(`Server is running at http://localhost:${port}`);
        logger_1.default.info(`API Documentation available at http://localhost:${port}/api-docs`);
    });
}).catch(err => {
    logger_1.default.error('Failed to initialize database:', err);
    process.exit(1);
});
