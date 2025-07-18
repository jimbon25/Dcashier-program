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
// Get all products
router.get('/', (0, errorHandler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
exports.default = router;
