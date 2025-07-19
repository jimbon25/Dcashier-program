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
exports.AuthController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../database");
const errorHandler_1 = require("../errorHandler");
const logger_1 = __importDefault(require("../logger"));
const authUtils_1 = require("../authUtils");
class AuthController {
    static register(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { username, password } = req.body;
            const db = (0, database_1.getDatabase)();
            const hashedPassword = yield bcryptjs_1.default.hash(password, 12);
            yield (0, database_1.runAsync)(db, "INSERT INTO users (username, password, role) VALUES (?, ?, 'cashier')", [username, hashedPassword]);
            logger_1.default.info(`New user registered: ${username}`);
            res.status(201).json({
                status: 'success',
                message: 'Registrasi berhasil'
            });
        });
    }
    static login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { username, password } = req.body;
            if (!username || !password) {
                throw new errorHandler_1.AppError(400, 'Username dan password harus diisi');
            }
            const db = (0, database_1.getDatabase)();
            const user = yield new Promise((resolve, reject) => {
                db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
                    if (err) {
                        logger_1.default.error('Database error during login:', err);
                        reject(new errorHandler_1.AppError(500, 'Database error'));
                    }
                    else {
                        resolve(row);
                    }
                });
            });
            if (!user) {
                logger_1.default.warn(`Login attempt with non-existent username: ${username}`);
                throw new errorHandler_1.AppError(401, 'Username atau password salah');
            }
            const isPasswordValid = yield bcryptjs_1.default.compare(password, user.password);
            if (!isPasswordValid) {
                logger_1.default.warn(`Invalid password attempt for user: ${username}`);
                throw new errorHandler_1.AppError(401, 'Username atau password salah');
            }
            // Generate tokens with longer expiration for better UX
            const jwtSecret = process.env.JWT_SECRET || 'supersecretjwtkey';
            const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
            const payload = {
                id: user.id,
                username: user.username,
                role: user.role
            };
            const options = { expiresIn };
            const accessToken = jsonwebtoken_1.default.sign(payload, jwtSecret, options);
            const refreshToken = (0, authUtils_1.generateRefreshToken)();
            yield (0, authUtils_1.storeRefreshToken)(user.id, refreshToken);
            logger_1.default.info(`User logged in successfully: ${username}, role: ${user.role}`);
            res.json({
                status: 'success',
                message: 'Login berhasil',
                data: {
                    user: {
                        id: user.id,
                        username: user.username,
                        role: user.role
                    },
                    accessToken,
                    refreshToken,
                    expiresIn
                }
            });
        });
    }
    static refreshToken(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                throw new errorHandler_1.AppError(400, 'Refresh token diperlukan');
            }
            try {
                const tokenData = yield (0, authUtils_1.verifyRefreshToken)(refreshToken);
                const jwtSecret = process.env.JWT_SECRET || 'supersecretjwtkey';
                const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
                const payload = {
                    id: tokenData.user_id,
                    username: tokenData.username,
                    role: tokenData.role
                };
                const options = { expiresIn };
                const accessToken = jsonwebtoken_1.default.sign(payload, jwtSecret, options);
                res.json({
                    status: 'success',
                    data: {
                        accessToken,
                        expiresIn
                    }
                });
            }
            catch (error) {
                logger_1.default.error('Error refreshing token:', error);
                throw new errorHandler_1.AppError(401, 'Invalid refresh token');
            }
        });
    }
    static logout(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { refreshToken } = req.body;
            if (refreshToken) {
                yield (0, authUtils_1.deleteRefreshToken)(refreshToken);
            }
            res.json({
                status: 'success',
                message: 'Logout berhasil'
            });
        });
    }
}
exports.AuthController = AuthController;
