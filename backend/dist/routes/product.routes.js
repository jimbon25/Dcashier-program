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
// Middleware autentikasi untuk semua route produk
router.use(auth_middleware_1.authenticate);
// Get all products - accessible by both admin and cashier
router.get('/', auth_middleware_1.requireAuth, (0, errorHandler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const db = (0, database_1.getDatabase)();
    const products = yield new Promise((resolve, reject) => {
        db.all("SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id", [], (err, rows) => {
            if (err)
                reject(new errorHandler_1.AppError(500, 'Database error: ' + err.message));
            else
                resolve(rows);
        });
    });
    res.json(products);
})));
// Get product by ID - accessible by both admin and cashier
router.get('/:id', auth_middleware_1.requireAuth, (0, errorHandler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const db = (0, database_1.getDatabase)();
    const product = yield new Promise((resolve, reject) => {
        db.get("SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?", [req.params.id], (err, row) => {
            if (err)
                reject(new errorHandler_1.AppError(500, 'Database error: ' + err.message));
            else
                resolve(row);
        });
    });
    if (!product) {
        throw new errorHandler_1.AppError(404, 'Product not found');
    }
    res.json(product);
})));
// Get product by barcode - accessible by both admin and cashier
router.get('/barcode/:barcode', auth_middleware_1.requireAuth, (0, errorHandler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const db = (0, database_1.getDatabase)();
    const product = yield new Promise((resolve, reject) => {
        db.get("SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.barcode = ?", [req.params.barcode], (err, row) => {
            if (err)
                reject(new errorHandler_1.AppError(500, 'Database error: ' + err.message));
            else
                resolve(row);
        });
    });
    if (!product) {
        throw new errorHandler_1.AppError(404, 'Product not found');
    }
    res.json(product);
})));
// Create new product - only admin
router.post('/', auth_middleware_1.requireAdmin, (0, errorHandler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, name, price, cost_price, stock, barcode, category_id, image_url } = req.body;
    if (!id || !name || !price || stock === undefined) {
        throw new errorHandler_1.AppError(400, 'Required fields: id, name, price, stock');
    }
    const db = (0, database_1.getDatabase)();
    // Check if product ID already exists
    const existingProduct = yield new Promise((resolve, reject) => {
        db.get("SELECT id FROM products WHERE id = ?", [id], (err, row) => {
            if (err)
                reject(new errorHandler_1.AppError(500, 'Database error: ' + err.message));
            else
                resolve(row);
        });
    });
    if (existingProduct) {
        throw new errorHandler_1.AppError(409, 'Product ID already exists');
    }
    // Insert new product
    yield (0, database_1.runAsync)(db, "INSERT INTO products (id, name, price, cost_price, stock, barcode, category_id, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [id, name, price, cost_price || 0, stock, barcode || null, category_id || null, image_url || null]);
    res.status(201).json({ message: 'Product created successfully', id });
})));
// Update product - only admin
router.put('/:id', auth_middleware_1.requireAdmin, (0, errorHandler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, price, cost_price, stock, barcode, category_id, image_url } = req.body;
    if (!name || !price || stock === undefined) {
        throw new errorHandler_1.AppError(400, 'Required fields: name, price, stock');
    }
    const db = (0, database_1.getDatabase)();
    // Check if product exists
    const existingProduct = yield new Promise((resolve, reject) => {
        db.get("SELECT id FROM products WHERE id = ?", [req.params.id], (err, row) => {
            if (err)
                reject(new errorHandler_1.AppError(500, 'Database error: ' + err.message));
            else
                resolve(row);
        });
    });
    if (!existingProduct) {
        throw new errorHandler_1.AppError(404, 'Product not found');
    }
    // Update product
    yield (0, database_1.runAsync)(db, "UPDATE products SET name = ?, price = ?, cost_price = ?, stock = ?, barcode = ?, category_id = ?, image_url = ? WHERE id = ?", [name, price, cost_price || 0, stock, barcode || null, category_id || null, image_url || null, req.params.id]);
    res.json({ message: 'Product updated successfully' });
})));
// Delete product - only admin
router.delete('/:id', auth_middleware_1.requireAdmin, (0, errorHandler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const db = (0, database_1.getDatabase)();
    // Check if product exists
    const existingProduct = yield new Promise((resolve, reject) => {
        db.get("SELECT id FROM products WHERE id = ?", [req.params.id], (err, row) => {
            if (err)
                reject(new errorHandler_1.AppError(500, 'Database error: ' + err.message));
            else
                resolve(row);
        });
    });
    if (!existingProduct) {
        throw new errorHandler_1.AppError(404, 'Product not found');
    }
    // Delete product
    yield (0, database_1.runAsync)(db, "DELETE FROM products WHERE id = ?", [req.params.id]);
    res.json({ message: 'Product deleted successfully' });
})));
exports.default = router;
