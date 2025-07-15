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
const cors_1 = __importDefault(require("cors"));
const database_1 = require("./database");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const SECRET_KEY = process.env.JWT_SECRET || 'supersecretjwtkey'; // Use environment variable in production
const app = (0, express_1.default)();
const port = 3001; // Using 3001 to avoid conflict with React's default 3000
app.use((0, cors_1.default)()); // Enable CORS for all routes
app.use(express_1.default.json()); // Enable JSON body parsing
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
// Helper function to promisify db.exec
const execAsync = (db, sql) => {
    return new Promise((resolve, reject) => {
        db.exec(sql, (err) => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
};
app.get('/', (req, res) => {
    res.send('Hello from Backend!');
});
// User Authentication Endpoints
app.post('/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }
    try {
        const db = (0, database_1.getDatabase)();
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        yield runAsync(db, "INSERT INTO users (username, password) VALUES (?, ?)", [username, hashedPassword]);
        res.status(201).json({ message: 'User registered successfully' });
    }
    catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'Username already exists.' });
        }
        console.error("Error registering user:", err.message);
        res.status(500).json({ error: err.message });
    }
}));
app.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }
    try {
        const db = (0, database_1.getDatabase)();
        const user = yield new Promise((resolve, reject) => {
            db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
                if (err)
                    reject(err);
                else
                    resolve(row);
            });
        });
        if (!user) {
            return res.status(400).json({ error: 'Invalid username or password.' });
        }
        const isMatch = yield bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid username or password.' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ message: 'Logged in successfully', token });
    }
    catch (err) {
        console.error("Error logging in user:", err.message);
        res.status(500).json({ error: err.message });
    }
}));
// Category Endpoints
app.get('/categories', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = (0, database_1.getDatabase)();
        const rows = yield allAsync(db, "SELECT * FROM categories");
        res.json(rows);
    }
    catch (err) {
        console.error("Error fetching categories:", err.message);
        res.status(500).json({ error: err.message });
    }
}));
app.post('/categories', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, name } = req.body;
    if (!id || !name) {
        return res.status(400).json({ error: 'Category ID and name are required.' });
    }
    try {
        const db = (0, database_1.getDatabase)();
        yield runAsync(db, "INSERT INTO categories (id, name) VALUES (?, ?)", [id, name]);
        res.status(201).json({ message: 'Category added successfully' });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}));
app.put('/categories/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Category name is required.' });
    }
    try {
        const db = (0, database_1.getDatabase)();
        const result = yield runAsync(db, "UPDATE categories SET name = ? WHERE id = ?", [name, id]);
        if (result.changes === 0) {
            res.status(404).json({ error: 'Category not found or no changes made.' });
            return;
        }
        res.json({ message: 'Category updated successfully' });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}));
app.delete('/categories/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const db = (0, database_1.getDatabase)();
        const result = yield runAsync(db, "DELETE FROM categories WHERE id = ?", [id]);
        if (result.changes === 0) {
            res.status(404).json({ error: 'Category not found.' });
            return;
        }
        res.json({ message: 'Category deleted successfully' });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}));
app.get('/products', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = (0, database_1.getDatabase)();
        const rows = yield allAsync(db, "SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id");
        console.log("Products fetched:", rows);
        res.json(rows);
    }
    catch (err) {
        console.error("Error fetching products:", err.message);
        res.status(500).json({ error: err.message });
    }
}));
app.post('/products', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, name, price, stock, barcode, category_id } = req.body;
    if (!id || !name || !price || !stock) {
        return res.status(400).json({ error: 'All fields (id, name, price, stock) are required.' });
    }
    try {
        const db = (0, database_1.getDatabase)();
        const result = yield runAsync(db, "INSERT INTO products (id, name, price, stock, barcode, category_id) VALUES (?, ?, ?, ?, ?, ?)", [id, name, price, stock, barcode, category_id]);
        res.status(201).json({ message: 'Product added successfully', id: result.lastID });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}));
app.get('/products/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const db = (0, database_1.getDatabase)();
        const row = yield new Promise((resolve, reject) => {
            db.get("SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?", [id], (err, row) => {
                if (err)
                    reject(err);
                else
                    resolve(row);
            });
        });
        if (!row) {
            res.status(404).json({ error: 'Product not found.' });
            return;
        }
        res.json(row);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}));
app.get('/products/barcode/:barcode', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { barcode } = req.params;
    try {
        const db = (0, database_1.getDatabase)();
        const row = yield new Promise((resolve, reject) => {
            db.get("SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.barcode = ?", [barcode], (err, row) => {
                if (err)
                    reject(err);
                else
                    resolve(row);
            });
        });
        if (!row) {
            res.status(404).json({ error: 'Product not found.' });
            return;
        }
        res.json(row);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}));
app.put('/products/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { name, price, stock, barcode, category_id } = req.body;
    if (!name || !price || !stock) {
        return res.status(400).json({ error: 'All fields (name, price, stock) are required.' });
    }
    try {
        const db = (0, database_1.getDatabase)();
        const result = yield runAsync(db, "UPDATE products SET name = ?, price = ?, stock = ?, barcode = ?, category_id = ? WHERE id = ?", [name, price, stock, barcode, category_id, id]);
        if (result.changes === 0) {
            res.status(404).json({ error: 'Product not found or no changes made.' });
            return;
        }
        res.json({ message: 'Product updated successfully' });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}));
app.delete('/products/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const db = (0, database_1.getDatabase)();
        const result = yield runAsync(db, "DELETE FROM products WHERE id = ?", [id]);
        if (result.changes === 0) {
            res.status(404).json({ error: 'Product not found.' });
            return;
        }
        res.json({ message: 'Product deleted successfully' });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}));
app.post('/reset-transactions', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const db = (0, database_1.getDatabase)();
    try {
        yield runAsync(db, "DELETE FROM transaction_items");
        yield runAsync(db, "DELETE FROM transactions");
        res.json({ message: 'All transactions have been reset.' });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}));
app.post('/transactions', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { total_amount, payment_amount, change_amount, cartItems, payment_method } = req.body;
    const db = (0, database_1.getDatabase)();
    const transactionId = `TRX-${Date.now()}`;
    const timestamp = Date.now();
    try {
        yield execAsync(db, "BEGIN TRANSACTION");
        // Insert into transactions table
        yield runAsync(db, "INSERT INTO transactions (id, timestamp, total_amount, payment_amount, change_amount, payment_method) VALUES (?, ?, ?, ?, ?, ?)", [transactionId, timestamp, total_amount, payment_amount, change_amount, payment_method || 'Cash']);
        // Insert into transaction_items table
        for (const item of cartItems) {
            yield runAsync(db, "INSERT INTO transaction_items (transaction_id, product_id, product_name, price_at_sale, quantity) VALUES (?, ?, ?, ?, ?)", [transactionId, item.id, item.name, item.price, item.quantity]);
        }
        yield execAsync(db, "COMMIT");
        res.status(201).json({ message: 'Transaction recorded successfully', transactionId });
    }
    catch (err) {
        yield execAsync(db, "ROLLBACK");
        console.error("Error recording transaction:", err);
        res.status(500).json({ error: err.message });
    }
}));
app.put('/products/:id/stock', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { quantity } = req.body;
    if (typeof quantity !== 'number' || quantity < 0) {
        return res.status(400).json({ error: 'Quantity must be a non-negative number.' });
    }
    try {
        const db = (0, database_1.getDatabase)();
        const result = yield runAsync(db, "UPDATE products SET stock = stock - ? WHERE id = ?", [quantity, id]);
        if (result.changes === 0) {
            res.status(404).json({ error: 'Product not found or stock not updated.' });
            return;
        }
        res.json({ message: 'Product stock updated successfully' });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}));
app.get('/transactions', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const db = (0, database_1.getDatabase)();
    const { startDate, endDate } = req.query;
    let query = "SELECT * FROM transactions";
    const params = [];
    if (startDate && endDate) {
        query += " WHERE timestamp >= ? AND timestamp <= ?";
        params.push(parseInt(startDate));
        params.push(parseInt(endDate));
    }
    else if (startDate) {
        query += " WHERE timestamp >= ?";
        params.push(parseInt(startDate));
    }
    else if (endDate) {
        query += " WHERE timestamp <= ?";
        params.push(parseInt(endDate));
    }
    query += " ORDER BY timestamp DESC";
    try {
        const transactions = yield allAsync(db, query, params);
        if (transactions.length === 0) {
            res.json([]);
            return;
        }
        const transactionsWithItems = yield Promise.all(transactions.map((transaction) => __awaiter(void 0, void 0, void 0, function* () {
            const items = yield allAsync(db, "SELECT * FROM transaction_items WHERE transaction_id = ?", [transaction.id]);
            return Object.assign(Object.assign({}, transaction), { items });
        })));
        res.json(transactionsWithItems);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}));
app.get('/reports/daily-sales', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const db = (0, database_1.getDatabase)();
    const { date } = req.query; // Format YYYY-MM-DD
    if (!date) {
        return res.status(400).json({ error: 'Date parameter is required (YYYY-MM-DD).' });
    }
    const startOfDay = new Date(date).setHours(0, 0, 0, 0);
    const endOfDay = new Date(date).setHours(23, 59, 59, 999);
    try {
        const rows = yield allAsync(db, `SELECT
       strftime('%Y-%m-%d', timestamp / 1000, 'unixepoch', 'localtime') AS sale_date,
       SUM(total_amount) AS total_sales
     FROM transactions
     WHERE timestamp >= ? AND timestamp <= ?
     GROUP BY sale_date
     ORDER BY sale_date DESC`, [startOfDay, endOfDay]);
        res.json(rows);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}));
app.get('/reports/top-products', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const db = (0, database_1.getDatabase)();
    const { limit = 5 } = req.query; // Default limit to 5
    try {
        const rows = yield allAsync(db, `SELECT
       product_name,
       SUM(quantity) AS total_quantity_sold,
       SUM(price_at_sale * quantity) AS total_revenue
     FROM transaction_items
     GROUP BY product_name
     ORDER BY total_quantity_sold DESC
     LIMIT ?`, [limit]);
        res.json(rows);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}));
(0, database_1.initializeDatabase)().then(() => {
    app.listen(port, () => {
        console.log(`Backend server listening at http://localhost:${port}`);
    });
}).catch(err => {
    console.error('Failed to initialize database and start server:', err);
});
