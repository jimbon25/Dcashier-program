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
// Middleware autentikasi untuk semua route transaksi
router.use(auth_middleware_1.authenticate);
// Get all transactions - accessible by both admin and cashier
router.get('/', auth_middleware_1.requireAuth, (0, errorHandler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const db = (0, database_1.getDatabase)();
    const { startDate, endDate } = req.query;
    let query = "SELECT * FROM transactions";
    const params = [];
    if (startDate && endDate) {
        query += " WHERE timestamp BETWEEN ? AND ?";
        params.push(Number(startDate));
        params.push(Number(endDate));
    }
    else if (startDate) {
        query += " WHERE timestamp >= ?";
        params.push(Number(startDate));
    }
    else if (endDate) {
        query += " WHERE timestamp <= ?";
        params.push(Number(endDate));
    }
    query += " ORDER BY timestamp DESC";
    const transactions = yield new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err)
                reject(new errorHandler_1.AppError(500, 'Database error: ' + err.message));
            else
                resolve(rows);
        });
    });
    // Fetch transaction items for each transaction
    const transactionsWithItems = yield Promise.all(transactions.map((trx) => __awaiter(void 0, void 0, void 0, function* () {
        const items = yield new Promise((resolve, reject) => {
            db.all("SELECT * FROM transaction_items WHERE transaction_id = ?", [trx.id], (err, rows) => {
                if (err)
                    reject(new errorHandler_1.AppError(500, 'Database error: ' + err.message));
                else
                    resolve(rows);
            });
        });
        return Object.assign(Object.assign({}, trx), { items });
    })));
    res.json(transactionsWithItems);
})));
// Get transaction by ID
router.get('/:id', auth_middleware_1.requireAuth, (0, errorHandler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const db = (0, database_1.getDatabase)();
    const transaction = yield new Promise((resolve, reject) => {
        db.get("SELECT * FROM transactions WHERE id = ?", [req.params.id], (err, row) => {
            if (err)
                reject(new errorHandler_1.AppError(500, 'Database error: ' + err.message));
            else
                resolve(row);
        });
    });
    if (!transaction) {
        throw new errorHandler_1.AppError(404, 'Transaction not found');
    }
    // Fetch transaction items
    const items = yield new Promise((resolve, reject) => {
        db.all("SELECT * FROM transaction_items WHERE transaction_id = ?", [req.params.id], (err, rows) => {
            if (err)
                reject(new errorHandler_1.AppError(500, 'Database error: ' + err.message));
            else
                resolve(rows);
        });
    });
    res.json(Object.assign(Object.assign({}, transaction), { items }));
})));
// Create new transaction
router.post('/', auth_middleware_1.requireAuth, (0, errorHandler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { total_amount, payment_amount, change_amount, discount, items, payment_method } = req.body;
    if (!total_amount || !payment_amount || !items || !Array.isArray(items)) {
        throw new errorHandler_1.AppError(400, 'Required fields: total_amount, payment_amount, items');
    }
    const db = (0, database_1.getDatabase)();
    const transactionId = 'TXN' + Date.now();
    const timestamp = Date.now();
    // Insert transaction
    yield (0, database_1.runAsync)(db, "INSERT INTO transactions (id, timestamp, total_amount, payment_amount, change_amount, discount, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?)", [transactionId, timestamp, total_amount, payment_amount, change_amount || 0, discount || 0, payment_method || 'Cash']);
    // Insert transaction items
    for (const item of items) {
        yield (0, database_1.runAsync)(db, "INSERT INTO transaction_items (transaction_id, product_id, product_name, price_at_sale, cost_price_at_sale, quantity) VALUES (?, ?, ?, ?, ?, ?)", [transactionId, item.product_id, item.product_name, item.price_at_sale, item.cost_price_at_sale || 0, item.quantity]);
        // Update product stock
        yield (0, database_1.runAsync)(db, "UPDATE products SET stock = stock - ? WHERE id = ?", [item.quantity, item.product_id]);
    }
    res.status(201).json({
        message: 'Transaction created successfully',
        transactionId,
        timestamp
    });
})));
// Delete transaction (for admin only)
router.delete('/:id', (0, errorHandler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const db = (0, database_1.getDatabase)();
    // Check if transaction exists
    const existingTransaction = yield new Promise((resolve, reject) => {
        db.get("SELECT id FROM transactions WHERE id = ?", [req.params.id], (err, row) => {
            if (err)
                reject(new errorHandler_1.AppError(500, 'Database error: ' + err.message));
            else
                resolve(row);
        });
    });
    if (!existingTransaction) {
        throw new errorHandler_1.AppError(404, 'Transaction not found');
    }
    // Delete transaction items first
    yield (0, database_1.runAsync)(db, "DELETE FROM transaction_items WHERE transaction_id = ?", [req.params.id]);
    // Delete transaction
    yield (0, database_1.runAsync)(db, "DELETE FROM transactions WHERE id = ?", [req.params.id]);
    res.json({ message: 'Transaction deleted successfully' });
})));
// Reset all transactions (for admin only)
router.post('/reset', auth_middleware_1.requireAdmin, (0, errorHandler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const db = (0, database_1.getDatabase)();
    // Delete all transaction items
    yield (0, database_1.runAsync)(db, "DELETE FROM transaction_items");
    // Delete all transactions
    yield (0, database_1.runAsync)(db, "DELETE FROM transactions");
    res.json({ message: 'All transactions have been reset' });
})));
exports.default = router;
