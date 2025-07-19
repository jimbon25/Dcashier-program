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
exports.runAsync = void 0;
exports.initializeDatabase = initializeDatabase;
exports.getDatabase = getDatabase;
const sqlite3_1 = __importDefault(require("sqlite3"));
const DB_PATH = './sembako-pos.db';
let db;
// Helper function to promisify db.run
const runAsync = (db, sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) {
                reject(err);
            }
            else {
                resolve(this); // 'this' contains lastID, changes
            }
        });
    });
};
exports.runAsync = runAsync;
// Helper function to promisify db.all
const allAsync = (db, sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(rows);
            }
        });
    });
};
function initializeDatabase() {
    return new Promise((resolve, reject) => {
        db = new sqlite3_1.default.Database(DB_PATH, (err) => __awaiter(this, void 0, void 0, function* () {
            if (err) {
                console.error('Error opening database:', err.message);
                reject(err);
            }
            else {
                console.log('Connected to the SQLite database.');
                try {
                    // Create categories table
                    yield (0, exports.runAsync)(db, `
            CREATE TABLE IF NOT EXISTS categories (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL UNIQUE
            )
          `);
                    console.log('Categories table created or already exists.');
                    // Insert categories if table is empty
                    const categoryCount = yield allAsync(db, "SELECT COUNT(*) AS count FROM categories");
                    if (categoryCount[0].count === 0) {
                        const categories = [
                            { id: 'CAT001', name: 'Makanan Pokok' },
                            { id: 'CAT002', name: 'Minuman' },
                            { id: 'CAT003', name: 'Kebutuhan Rumah Tangga' },
                            { id: 'CAT004', name: 'Snack & Cemilan' },
                            { id: 'CAT005', name: 'Bumbu Dapur' },
                            { id: 'CAT006', name: 'Perawatan Tubuh' },
                        ];
                        for (const c of categories) {
                            yield (0, exports.runAsync)(db, "INSERT INTO categories (id, name) VALUES (?, ?)", [c.id, c.name]);
                        }
                        console.log('Categories inserted.');
                    }
                    // Create products table
                    yield (0, exports.runAsync)(db, `
            CREATE TABLE IF NOT EXISTS products (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              price INTEGER NOT NULL,
              cost_price INTEGER NOT NULL DEFAULT 0, -- Added cost_price
              stock INTEGER NOT NULL,
              barcode TEXT UNIQUE,
              image_url TEXT, -- Added image_url
              category_id TEXT,
              FOREIGN KEY (category_id) REFERENCES categories(id)
            )
          `);
                    console.log('Products table created or already exists.');
                    // Insert real products if products table is empty
                    const productCount = yield allAsync(db, "SELECT COUNT(*) AS count FROM products");
                    if (productCount[0].count === 0) {
                        const realProducts = [
                            // Makanan Pokok (CAT001)
                            { id: 'P001', name: 'Beras Premium 5kg', price: 65000, stock: 80, cost_price: 58000, category_id: 'CAT001', barcode: 'B001', image_url: '/uploads/images/beras-premium.jpg' },
                            { id: 'P002', name: 'Minyak Goreng Tropical 2L', price: 38000, stock: 60, cost_price: 33000, category_id: 'CAT001', barcode: 'B002', image_url: '/uploads/images/minyak-tropical.jpg' },
                            { id: 'P003', name: 'Gula Pasir Gulaku 1kg', price: 16000, stock: 150, cost_price: 14000, category_id: 'CAT001', barcode: 'B003', image_url: '/uploads/images/gula-gulaku.jpg' },
                            { id: 'P004', name: 'Telur Ayam Segar 1kg', price: 30000, stock: 90, cost_price: 27000, category_id: 'CAT001', barcode: 'B004', image_url: '/uploads/images/telur-segar.jpg' },
                            { id: 'P005', name: 'Tepung Terigu Cakra 1kg', price: 13000, stock: 120, cost_price: 11000, category_id: 'CAT001', barcode: 'B005', image_url: '/uploads/images/tepung-cakra.jpg' },
                            // Minuman (CAT002)
                            { id: 'P006', name: 'Teh Celup Sosro 25pcs', price: 9500, stock: 100, cost_price: 8000, category_id: 'CAT002', barcode: 'B006', image_url: '/uploads/images/teh-sosro.jpg' },
                            { id: 'P007', name: 'Kopi Kapal Api 200gr', price: 14000, stock: 85, cost_price: 12000, category_id: 'CAT002', barcode: 'B007', image_url: '/uploads/images/kopi-kapal-api.jpg' },
                            { id: 'P008', name: 'Susu UHT Ultra 1L', price: 19000, stock: 75, cost_price: 17000, category_id: 'CAT002', barcode: 'B008', image_url: '/uploads/images/susu-ultra.jpg' },
                            { id: 'P009', name: 'Air Mineral Aqua 600ml', price: 3500, stock: 200, cost_price: 2800, category_id: 'CAT002', barcode: 'B009', image_url: '/uploads/images/aqua-600ml.jpg' },
                            { id: 'P010', name: 'Jus Buah Sunquick 330ml', price: 7500, stock: 120, cost_price: 6200, category_id: 'CAT002', barcode: 'B010', image_url: '/uploads/images/sunquick.jpg' }
                        ];
                        for (const p of realProducts) {
                            yield (0, exports.runAsync)(db, "INSERT INTO products (id, name, price, stock, category_id, cost_price, barcode, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [p.id, p.name, p.price, p.stock, p.category_id, p.cost_price, p.barcode, p.image_url]);
                        }
                        console.log('Real products inserted.');
                    }
                    // Create transactions table
                    yield (0, exports.runAsync)(db, `
            CREATE TABLE IF NOT EXISTS transactions (
              id TEXT PRIMARY KEY,
              timestamp INTEGER NOT NULL,
              total_amount INTEGER NOT NULL,
              payment_amount INTEGER NOT NULL,
              change_amount INTEGER NOT NULL,
              discount INTEGER NOT NULL DEFAULT 0,
              payment_method TEXT NOT NULL DEFAULT 'Cash'
            )
          `);
                    console.log('Transactions table created or already exists.');
                    // Add discount column if it doesn't exist (for existing databases)
                    yield (0, exports.runAsync)(db, "ALTER TABLE transactions ADD COLUMN discount INTEGER NOT NULL DEFAULT 0").catch(err => {
                        if (err.message.includes('duplicate column name: discount')) {
                            console.log('Discount column already exists in transactions table.');
                        }
                        else {
                            throw err;
                        }
                    });
                    // Create transaction_items table
                    yield (0, exports.runAsync)(db, `
            CREATE TABLE IF NOT EXISTS transaction_items (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              transaction_id TEXT NOT NULL,
              product_id TEXT NOT NULL,
              product_name TEXT NOT NULL,
              price_at_sale INTEGER NOT NULL,
              cost_price_at_sale INTEGER NOT NULL DEFAULT 0, -- Added cost_price_at_sale
              quantity INTEGER NOT NULL,
              FOREIGN KEY (transaction_id) REFERENCES transactions(id)
            )
          `);
                    console.log('Transaction items table created or already exists.');
                    // Create users table
                    yield (0, exports.runAsync)(db, `
            CREATE TABLE IF NOT EXISTS users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              username TEXT NOT NULL UNIQUE,
              password TEXT NOT NULL,
              role TEXT NOT NULL DEFAULT 'cashier'
            )
          `);
                    // Add role column if it doesn't exist (for existing databases)
                    yield (0, exports.runAsync)(db, "ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'cashier'").catch(err => {
                        if (err.message.includes('duplicate column name: role')) {
                            console.log('Role column already exists in users table.');
                        }
                        else {
                            throw err;
                        }
                    });
                    console.log('Users table created or already exists.');
                    // Create refresh tokens table
                    yield (0, exports.runAsync)(db, `
            CREATE TABLE IF NOT EXISTS refresh_tokens (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL,
              token TEXT NOT NULL UNIQUE,
              expires_at DATETIME NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
          `);
                    console.log('Refresh tokens table created or already exists.');
                    resolve(db);
                }
                catch (initErr) {
                    console.error('Error during database initialization:', initErr.message);
                    reject(initErr);
                }
            }
        }));
    });
}
function getDatabase() {
    if (!db) {
        throw new Error('Database not initialized. Call initializeDatabase first.');
    }
    return db;
}
