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
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("../database");
const errorHandler_1 = require("../errorHandler");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
// Middleware autentikasi untuk semua route user - hanya admin yang dapat mengakses user management
router.use(auth_middleware_1.authenticate);
router.use(auth_middleware_1.requireAdmin);
// GET /users - Get all users (admin only)
router.get('/', (0, errorHandler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const db = (0, database_1.getDatabase)();
    // Check if user is admin
    if (req.user.role !== 'admin') {
        throw new errorHandler_1.AppError(403, 'Access denied. Admin role required.');
    }
    const users = yield new Promise((resolve, reject) => {
        db.all("SELECT id, username, role FROM users ORDER BY id", [], (err, rows) => {
            if (err)
                reject(new errorHandler_1.AppError(500, 'Database error: ' + err.message));
            else
                resolve(rows);
        });
    });
    res.json(users);
})));
// POST /users - Create new user (admin only)
router.post('/', (0, errorHandler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const db = (0, database_1.getDatabase)();
    const { username, password, role } = req.body;
    // Check if user is admin
    if (req.user.role !== 'admin') {
        throw new errorHandler_1.AppError(403, 'Access denied. Admin role required.');
    }
    if (!username || !password) {
        throw new errorHandler_1.AppError(400, 'Username and password are required');
    }
    if (!['admin', 'cashier'].includes(role)) {
        throw new errorHandler_1.AppError(400, 'Invalid role. Must be admin or cashier');
    }
    // Check if username already exists
    const existingUser = yield new Promise((resolve, reject) => {
        db.get("SELECT id FROM users WHERE username = ?", [username], (err, row) => {
            if (err)
                reject(new errorHandler_1.AppError(500, 'Database error: ' + err.message));
            else
                resolve(row);
        });
    });
    if (existingUser) {
        throw new errorHandler_1.AppError(400, 'Username already exists');
    }
    // Hash password
    const saltRounds = 10;
    const hashedPassword = yield bcryptjs_1.default.hash(password, saltRounds);
    // Create user
    yield new Promise((resolve, reject) => {
        db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", [username, hashedPassword, role], function (err) {
            if (err)
                reject(new errorHandler_1.AppError(500, 'Database error: ' + err.message));
            else
                resolve();
        });
    });
    res.status(201).json({ message: 'User created successfully' });
})));
// PUT /users/:id - Update user (admin only)
router.put('/:id', (0, errorHandler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const db = (0, database_1.getDatabase)();
    const { id } = req.params;
    const { username, password, role } = req.body;
    // Check if user is admin
    if (req.user.role !== 'admin') {
        throw new errorHandler_1.AppError(403, 'Access denied. Admin role required.');
    }
    if (!username) {
        throw new errorHandler_1.AppError(400, 'Username is required');
    }
    if (role && !['admin', 'cashier'].includes(role)) {
        throw new errorHandler_1.AppError(400, 'Invalid role. Must be admin or cashier');
    }
    // Check if user exists
    const existingUser = yield new Promise((resolve, reject) => {
        db.get("SELECT id FROM users WHERE id = ?", [id], (err, row) => {
            if (err)
                reject(new errorHandler_1.AppError(500, 'Database error: ' + err.message));
            else
                resolve(row);
        });
    });
    if (!existingUser) {
        throw new errorHandler_1.AppError(404, 'User not found');
    }
    // Check if username is taken by another user
    const usernameCheck = yield new Promise((resolve, reject) => {
        db.get("SELECT id FROM users WHERE username = ? AND id != ?", [username, id], (err, row) => {
            if (err)
                reject(new errorHandler_1.AppError(500, 'Database error: ' + err.message));
            else
                resolve(row);
        });
    });
    if (usernameCheck) {
        throw new errorHandler_1.AppError(400, 'Username already exists');
    }
    // Update user
    let query = "UPDATE users SET username = ?, role = ? WHERE id = ?";
    let params = [username, role || 'cashier', id];
    if (password) {
        const saltRounds = 10;
        const hashedPassword = yield bcryptjs_1.default.hash(password, saltRounds);
        query = "UPDATE users SET username = ?, password = ?, role = ? WHERE id = ?";
        params = [username, hashedPassword, role || 'cashier', id];
    }
    yield new Promise((resolve, reject) => {
        db.run(query, params, function (err) {
            if (err)
                reject(new errorHandler_1.AppError(500, 'Database error: ' + err.message));
            else
                resolve();
        });
    });
    res.json({ message: 'User updated successfully' });
})));
// DELETE /users/:id - Delete user (admin only)
router.delete('/:id', (0, errorHandler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const db = (0, database_1.getDatabase)();
    const { id } = req.params;
    // Check if user is admin
    if (req.user.role !== 'admin') {
        throw new errorHandler_1.AppError(403, 'Access denied. Admin role required.');
    }
    // Check if user exists
    const existingUser = yield new Promise((resolve, reject) => {
        db.get("SELECT id FROM users WHERE id = ?", [id], (err, row) => {
            if (err)
                reject(new errorHandler_1.AppError(500, 'Database error: ' + err.message));
            else
                resolve(row);
        });
    });
    if (!existingUser) {
        throw new errorHandler_1.AppError(404, 'User not found');
    }
    // Don't allow deleting self
    if (id === String(req.user.id)) {
        throw new errorHandler_1.AppError(400, 'Cannot delete your own account');
    }
    // Delete user
    yield new Promise((resolve, reject) => {
        db.run("DELETE FROM users WHERE id = ?", [id], function (err) {
            if (err)
                reject(new errorHandler_1.AppError(500, 'Database error: ' + err.message));
            else
                resolve();
        });
    });
    res.json({ message: 'User deleted successfully' });
})));
exports.default = router;
