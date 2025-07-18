"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.strictLimiter = exports.authLimiter = exports.apiLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const errorHandler_1 = require("../errorHandler");
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
exports.apiLimiter = (0, express_rate_limit_1.default)(Object.assign(Object.assign({}, defaultOptions), { handler: (req, res, next, options) => {
        throw new errorHandler_1.AppError(429, options.message);
    } }));
// Rate limiter untuk endpoint login/register
exports.authLimiter = (0, express_rate_limit_1.default)(Object.assign(Object.assign({}, strictOptions), { handler: (req, res, next, options) => {
        throw new errorHandler_1.AppError(429, options.message);
    } }));
// Rate limiter untuk operasi sensitif (misal: delete, reset password)
exports.strictLimiter = (0, express_rate_limit_1.default)(Object.assign(Object.assign({}, strictOptions), { max: 3, handler: (req, res, next, options) => {
        throw new errorHandler_1.AppError(429, options.message);
    } }));
