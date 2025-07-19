"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitConfig = exports.config = void 0;
// Environment Configuration
exports.config = {
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET || 'supersecretjwtkey-change-in-production',
    // Database configuration
    database: {
        filename: process.env.DATABASE_URL || './sembako-pos.db',
        // For production, we might want to use a cloud database
        useCloudDB: process.env.USE_CLOUD_DB === 'true',
    },
    // CORS configuration
    cors: {
        origin: process.env.NODE_ENV === 'production'
            ? ['https://dcashier.netlify.app']
            : ['http://localhost:3000', 'http://127.0.0.1:3000'],
        credentials: true,
    },
    // File upload configuration
    upload: {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    },
};
// Rate limiting configuration
exports.rateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Stricter in production
    message: {
        error: 'Too many requests from this IP, please try again later.',
    },
};
exports.default = exports.config;
