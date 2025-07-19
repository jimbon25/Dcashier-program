"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.requireCashier = exports.requireAuth = exports.requireAdmin = exports.requireRole = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errorHandler_1 = require("../errorHandler");
const logger_1 = __importDefault(require("../logger"));
// Middleware untuk autentikasi
const authenticate = (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader) {
            logger_1.default.warn(`Authentication failed: No authorization header - ${req.method} ${req.path}`);
            throw new errorHandler_1.AppError(401, 'Token akses diperlukan');
        }
        const token = authHeader.replace('Bearer ', '');
        if (!token || token === 'Bearer') {
            logger_1.default.warn(`Authentication failed: Invalid token format - ${req.method} ${req.path}`);
            throw new errorHandler_1.AppError(401, 'Format token tidak valid');
        }
        const jwtSecret = process.env.JWT_SECRET || 'supersecretjwtkey';
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        // Validate token payload
        if (!decoded.id || !decoded.username || !decoded.role) {
            logger_1.default.warn(`Authentication failed: Invalid token payload - ${req.method} ${req.path}`);
            throw new errorHandler_1.AppError(401, 'Token tidak valid - payload incomplete');
        }
        req.user = {
            id: decoded.id,
            username: decoded.username,
            role: decoded.role
        };
        logger_1.default.debug(`User authenticated: ${decoded.username} (${decoded.role}) - ${req.method} ${req.path}`);
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            logger_1.default.warn(`Authentication failed: Token expired - ${req.method} ${req.path}`);
            throw new errorHandler_1.AppError(401, 'Token telah kedaluwarsa');
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            logger_1.default.warn(`Authentication failed: Invalid token - ${req.method} ${req.path}`);
            throw new errorHandler_1.AppError(401, 'Token tidak valid');
        }
        else if (error instanceof errorHandler_1.AppError) {
            throw error;
        }
        else {
            logger_1.default.error(`Authentication error: ${error} - ${req.method} ${req.path}`);
            throw new errorHandler_1.AppError(401, 'Authentication failed');
        }
    }
};
exports.authenticate = authenticate;
// Middleware untuk otorisasi berdasarkan role
const requireRole = (roles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                logger_1.default.warn(`Authorization failed: No user in request - ${req.method} ${req.path}`);
                throw new errorHandler_1.AppError(401, 'Token akses diperlukan');
            }
            if (!roles.includes(req.user.role)) {
                logger_1.default.warn(`Authorization failed: User ${req.user.username} with role ${req.user.role} tried to access ${req.method} ${req.path}, required roles: ${roles.join(', ')}`);
                throw new errorHandler_1.AppError(403, `Akses ditolak. Diperlukan role: ${roles.join(' atau ')}`);
            }
            logger_1.default.debug(`Authorization successful: ${req.user.username} (${req.user.role}) - ${req.method} ${req.path}`);
            next();
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError) {
                throw error;
            }
            else {
                logger_1.default.error(`Authorization error: ${error} - ${req.method} ${req.path}`);
                throw new errorHandler_1.AppError(403, 'Authorization failed');
            }
        }
    };
};
exports.requireRole = requireRole;
// Middleware khusus untuk admin
exports.requireAdmin = (0, exports.requireRole)(['admin']);
// Middleware untuk admin atau cashier
exports.requireAuth = (0, exports.requireRole)(['admin', 'cashier']);
// Middleware untuk cashier only
exports.requireCashier = (0, exports.requireRole)(['cashier']);
// Optional authentication - doesn't fail if no token
const optionalAuth = (req, res, next) => {
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
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        if (decoded.id && decoded.username && decoded.role) {
            req.user = {
                id: decoded.id,
                username: decoded.username,
                role: decoded.role
            };
        }
        next();
    }
    catch (error) {
        // Silently fail for optional auth
        next();
    }
};
exports.optionalAuth = optionalAuth;
