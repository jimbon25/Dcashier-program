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
// Middleware autentikasi untuk semua route report
router.use(auth_middleware_1.authenticate);
// Get daily sales report - accessible by both admin and cashier
router.get('/daily-sales', auth_middleware_1.requireAuth, (0, errorHandler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const db = (0, database_1.getDatabase)();
    const { date } = req.query;
    if (!date) {
        throw new errorHandler_1.AppError(400, 'Date parameter is required');
    }
    const startOfDay = new Date(date).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;
    const dailySales = yield new Promise((resolve, reject) => {
        db.all(`
      SELECT 
        ti.product_name,
        SUM(ti.quantity) as total_quantity_sold,
        SUM(ti.price_at_sale * ti.quantity) as total_revenue,
        SUM(ti.cost_price_at_sale * ti.quantity) as total_cost,
        p.category_id,
        c.name as category_name
      FROM transaction_items ti
      JOIN transactions t ON ti.transaction_id = t.id
      LEFT JOIN products p ON ti.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE t.timestamp BETWEEN ? AND ?
      GROUP BY ti.product_id, ti.product_name
      ORDER BY total_revenue DESC
    `, [startOfDay, endOfDay], (err, rows) => {
            if (err)
                reject(new errorHandler_1.AppError(500, 'Database error: ' + err.message));
            else
                resolve(rows);
        });
    });
    res.json(dailySales);
})));
// Get top products
router.get('/top-products', auth_middleware_1.requireAuth, (0, errorHandler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const db = (0, database_1.getDatabase)();
    const { limit = 10 } = req.query;
    const topProducts = yield new Promise((resolve, reject) => {
        db.all(`
      SELECT 
        ti.product_name,
        SUM(ti.quantity) as total_quantity_sold,
        SUM(ti.price_at_sale * ti.quantity) as total_revenue
      FROM transaction_items ti
      JOIN transactions t ON ti.transaction_id = t.id
      GROUP BY ti.product_id, ti.product_name
      ORDER BY total_quantity_sold DESC
      LIMIT ?
    `, [Number(limit)], (err, rows) => {
            if (err)
                reject(new errorHandler_1.AppError(500, 'Database error: ' + err.message));
            else
                resolve(rows);
        });
    });
    res.json(topProducts);
})));
// Get profit/loss report
router.get('/profit-loss', auth_middleware_1.requireAuth, (0, errorHandler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const db = (0, database_1.getDatabase)();
    const { startDate, endDate, categoryId } = req.query;
    let query = `
    SELECT 
      ti.product_name,
      SUM(ti.quantity) as total_quantity_sold,
      SUM(ti.price_at_sale * ti.quantity) as total_revenue,
      COALESCE(SUM(ti.cost_price_at_sale * ti.quantity), 0) as total_cost,
      (SUM(ti.price_at_sale * ti.quantity) - COALESCE(SUM(ti.cost_price_at_sale * ti.quantity), 0)) as total_profit,
      COALESCE(c.name, 'Uncategorized') as category_name
    FROM transaction_items ti
    JOIN transactions t ON ti.transaction_id = t.id
    LEFT JOIN products p ON ti.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE 1=1
  `;
    const params = [];
    if (startDate) {
        query += " AND t.timestamp >= ?";
        params.push(Number(startDate));
    }
    if (endDate) {
        query += " AND t.timestamp <= ?";
        params.push(Number(endDate));
    }
    if (categoryId && categoryId !== '') {
        query += " AND p.category_id = ?";
        params.push(categoryId);
    }
    query += `
    GROUP BY ti.product_id, ti.product_name, c.name
    ORDER BY total_profit DESC
  `;
    const profitLoss = yield new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) {
                console.error('Profit-loss query error:', err);
                reject(new errorHandler_1.AppError(500, 'Database error: ' + err.message));
            }
            else {
                resolve(rows || []);
            }
        });
    });
    res.json(profitLoss);
})));
exports.default = router;
