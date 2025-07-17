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
                    yield runAsync(db, `
            CREATE TABLE IF NOT EXISTS categories (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL UNIQUE
            )
          `);
                    console.log('Categories table created or already exists.');
                    // Insert dummy categories if table is empty
                    const categoryCount = yield allAsync(db, "SELECT COUNT(*) AS count FROM categories");
                    if (categoryCount[0].count === 0) {
                        const dummyCategories = [
                            { id: 'CAT001', name: 'Makanan Pokok' },
                            { id: 'CAT002', name: 'Minuman' },
                            { id: 'CAT003', name: 'Kebutuhan Rumah Tangga' },
                            { id: 'CAT004', name: 'Snack' },
                        ];
                        for (const c of dummyCategories) {
                            yield runAsync(db, "INSERT INTO categories (id, name) VALUES (?, ?)", [c.id, c.name]);
                        }
                        console.log('Dummy categories inserted.');
                    }
                    // Create products table
                    yield runAsync(db, `
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
                    // Insert dummy products if products table is empty
                    const productCount = yield allAsync(db, "SELECT COUNT(*) AS count FROM products");
                    if (productCount[0].count === 0) {
                        const dummyProducts = [
                            { id: 'P001', name: 'Beras 5kg', price: 60000, stock: 100, cost_price: 55000, category_id: 'CAT001', image_url: 'https://via.placeholder.com/150/FF0000/FFFFFF?text=Beras' },
                            { id: 'P002', name: 'Minyak Goreng 2L', price: 35000, stock: 50, cost_price: 30000, category_id: 'CAT001', image_url: 'https://via.placeholder.com/150/0000FF/FFFFFF?text=Minyak' },
                            { id: 'P003', name: 'Gula Pasir 1kg', price: 15000, stock: 200, cost_price: 13000, category_id: 'CAT001', image_url: 'https://via.placeholder.com/150/FFFF00/000000?text=Gula' },
                            { id: 'P004', name: 'Telur Ayam 1kg', price: 28000, stock: 75, cost_price: 25000, category_id: 'CAT001', image_url: 'https://via.placeholder.com/150/FF00FF/FFFFFF?text=Telur' },
                            { id: 'P005', name: 'Kopi Bubuk 200gr', price: 12000, stock: 150, cost_price: 10000, category_id: 'CAT002', image_url: 'https://via.placeholder.com/150/00FFFF/000000?text=Kopi' },
                        ];
                        for (const p of dummyProducts) {
                            yield runAsync(db, "INSERT INTO products (id, name, price, stock, category_id, cost_price, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)", [p.id, p.name, p.price, p.stock, p.category_id, p.cost_price, p.image_url]);
                        }
                        console.log('Dummy products inserted.');
                    }
                    // Create transactions table
                    yield runAsync(db, `
            CREATE TABLE IF NOT EXISTS transactions (
              id TEXT PRIMARY KEY,
              timestamp INTEGER NOT NULL,
              total_amount INTEGER NOT NULL,
              payment_amount INTEGER NOT NULL,
              change_amount INTEGER NOT NULL,
              payment_method TEXT NOT NULL DEFAULT 'Cash'
            )
          `);
                    console.log('Transactions table created or already exists.');
                    // Create transaction_items table
                    yield runAsync(db, `
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
                    yield runAsync(db, `
            CREATE TABLE IF NOT EXISTS users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              username TEXT NOT NULL UNIQUE,
              password TEXT NOT NULL,
              role TEXT NOT NULL DEFAULT 'cashier'
            )
          `);
                    // Add role column if it doesn't exist (for existing databases)
                    yield runAsync(db, "ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'cashier'").catch(err => {
                        if (err.message.includes('duplicate column name: role')) {
                            console.log('Role column already exists in users table.');
                        }
                        else {
                            throw err;
                        }
                    });
                    console.log('Users table created or already exists.');
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
