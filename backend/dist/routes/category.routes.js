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
const database_1 = require("../database");
const errorHandler_1 = require("../errorHandler");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
// Middleware autentikasi untuk semua route kategori
router.use(auth_middleware_1.authenticate);
// Get all categories - accessible by both admin and cashier
router.get('/', auth_middleware_1.requireAuth, (0, errorHandler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const db = (0, database_1.getDatabase)();
    const categories = yield new Promise((resolve, reject) => {
        db.all("SELECT * FROM categories", [], (err, rows) => {
            if (err)
                reject(new errorHandler_1.AppError(500, 'Database error: ' + err.message));
            else
                resolve(rows);
        });
    });
    res.json(categories);
})));
// Get category by ID - accessible by both admin and cashier
router.get('/:id', auth_middleware_1.requireAuth, (0, errorHandler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const db = (0, database_1.getDatabase)();
    const category = yield new Promise((resolve, reject) => {
        db.get("SELECT * FROM categories WHERE id = ?", [req.params.id], (err, row) => {
            if (err)
                reject(new errorHandler_1.AppError(500, 'Database error: ' + err.message));
            else
                resolve(row);
        });
    });
    if (!category) {
        throw new errorHandler_1.AppError(404, 'Category not found');
    }
    res.json(category);
})));
// Create new category
router.post('/', auth_middleware_1.requireAdmin, (0, errorHandler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, name } = req.body;
    if (!id || !name) {
        throw new errorHandler_1.AppError(400, 'Required fields: id, name');
    }
    const db = (0, database_1.getDatabase)();
    // Check if category ID already exists
    const existingCategory = yield new Promise((resolve, reject) => {
        db.get("SELECT id FROM categories WHERE id = ?", [id], (err, row) => {
            if (err)
                reject(new errorHandler_1.AppError(500, 'Database error: ' + err.message));
            else
                resolve(row);
        });
    });
    if (existingCategory) {
        throw new errorHandler_1.AppError(409, 'Category ID already exists');
    }
    // Insert new category
    yield (0, database_1.runAsync)(db, "INSERT INTO categories (id, name) VALUES (?, ?)", [id, name]);
    res.status(201).json({ message: 'Category created successfully', id });
})));
// Update category
router.put('/:id', auth_middleware_1.requireAdmin, (0, errorHandler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name } = req.body;
    if (!name) {
        throw new errorHandler_1.AppError(400, 'Required field: name');
    }
    const db = (0, database_1.getDatabase)();
    // Check if category exists
    const existingCategory = yield new Promise((resolve, reject) => {
        db.get("SELECT id FROM categories WHERE id = ?", [req.params.id], (err, row) => {
            if (err)
                reject(new errorHandler_1.AppError(500, 'Database error: ' + err.message));
            else
                resolve(row);
        });
    });
    if (!existingCategory) {
        throw new errorHandler_1.AppError(404, 'Category not found');
    }
    // Update category
    yield (0, database_1.runAsync)(db, "UPDATE categories SET name = ? WHERE id = ?", [name, req.params.id]);
    res.json({ message: 'Category updated successfully' });
})));
// Delete category
router.delete('/:id', auth_middleware_1.requireAdmin, (0, errorHandler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const db = (0, database_1.getDatabase)();
    // Check if category exists
    const existingCategory = yield new Promise((resolve, reject) => {
        db.get("SELECT id FROM categories WHERE id = ?", [req.params.id], (err, row) => {
            if (err)
                reject(new errorHandler_1.AppError(500, 'Database error: ' + err.message));
            else
                resolve(row);
        });
    });
    if (!existingCategory) {
        throw new errorHandler_1.AppError(404, 'Category not found');
    }
    // Delete category
    yield (0, database_1.runAsync)(db, "DELETE FROM categories WHERE id = ?", [req.params.id]);
    res.json({ message: 'Category deleted successfully' });
})));
exports.default = router;
