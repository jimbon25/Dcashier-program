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
const router = express_1.default.Router();
// Get all transactions
router.get('/', (0, errorHandler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
exports.default = router;
