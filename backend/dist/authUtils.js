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
exports.validateRequest = exports.validateRegister = exports.validateLogin = exports.deleteRefreshToken = exports.verifyRefreshToken = exports.storeRefreshToken = exports.generateRefreshToken = exports.loginRateLimiter = void 0;
const express_validator_1 = require("express-validator");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const database_1 = require("./database");
const errorHandler_1 = require("./errorHandler");
const crypto_1 = __importDefault(require("crypto"));
// Rate limiting untuk login
exports.loginRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts per window
    message: 'Terlalu banyak percobaan login, silakan coba lagi dalam 15 menit',
    standardHeaders: true,
    legacyHeaders: false,
});
const REFRESH_TOKEN_EXPIRES_IN = '7d';
const generateRefreshToken = () => {
    return crypto_1.default.randomBytes(40).toString('hex');
};
exports.generateRefreshToken = generateRefreshToken;
const storeRefreshToken = (userId, refreshToken) => __awaiter(void 0, void 0, void 0, function* () {
    const db = (0, database_1.getDatabase)();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    yield (0, database_1.runAsync)(db, "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)", [userId, refreshToken, expiresAt.toISOString()]);
});
exports.storeRefreshToken = storeRefreshToken;
const verifyRefreshToken = (refreshToken) => __awaiter(void 0, void 0, void 0, function* () {
    const db = (0, database_1.getDatabase)();
    const token = yield new Promise((resolve, reject) => {
        db.get(`SELECT rt.*, u.username, u.role 
       FROM refresh_tokens rt 
       JOIN users u ON rt.user_id = u.id 
       WHERE rt.token = ? AND rt.expires_at > datetime('now')`, [refreshToken], (err, row) => {
            if (err)
                reject(err);
            else
                resolve(row);
        });
    });
    if (!token) {
        throw new errorHandler_1.AppError(401, 'Invalid refresh token');
    }
    return token;
});
exports.verifyRefreshToken = verifyRefreshToken;
const deleteRefreshToken = (refreshToken) => __awaiter(void 0, void 0, void 0, function* () {
    const db = (0, database_1.getDatabase)();
    yield (0, database_1.runAsync)(db, "DELETE FROM refresh_tokens WHERE token = ?", [refreshToken]);
});
exports.deleteRefreshToken = deleteRefreshToken;
// Validation middleware
exports.validateLogin = [
    (0, express_validator_1.body)('username')
        .trim()
        .notEmpty().withMessage('Username diperlukan')
        .isLength({ min: 3 }).withMessage('Username minimal 3 karakter')
        .escape(),
    (0, express_validator_1.body)('password')
        .trim()
        .notEmpty().withMessage('Password diperlukan')
        .isLength({ min: 8 }).withMessage('Password minimal 8 karakter'),
];
exports.validateRegister = [
    ...exports.validateLogin,
    (0, express_validator_1.body)('username')
        .custom((value) => __awaiter(void 0, void 0, void 0, function* () {
        const db = (0, database_1.getDatabase)();
        const user = yield new Promise((resolve) => {
            db.get("SELECT id FROM users WHERE username = ?", [value], (_, row) => {
                resolve(row);
            });
        });
        if (user) {
            throw new Error('Username sudah digunakan');
        }
        return true;
    })),
    (0, express_validator_1.body)('password')
        .matches(/[A-Z]/).withMessage('Password harus mengandung minimal 1 huruf besar')
        .matches(/[a-z]/).withMessage('Password harus mengandung minimal 1 huruf kecil')
        .matches(/[0-9]/).withMessage('Password harus mengandung minimal 1 angka')
        .matches(/[!@#$%^&*?]/).withMessage('Password harus mengandung minimal 1 karakter spesial (!@#$%^&*?)')
];
const validateRequest = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const messages = errors.array().map(err => err.msg);
        throw new errorHandler_1.AppError(400, messages.join(', '));
    }
    next();
};
exports.validateRequest = validateRequest;
