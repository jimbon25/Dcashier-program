import sqlite3 from 'sqlite3';

const DB_PATH = './sembako-pos.db';

let db: sqlite3.Database;

// Helper function to promisify db.run
const runAsync = (db: sqlite3.Database, sql: string, params: any[] = []): Promise<sqlite3.RunResult> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(this: sqlite3.RunResult, err: Error | null) {
      if (err) {
        reject(err);
      } else {
        resolve(this); // 'this' contains lastID, changes
      }
    });
  });
};

// Helper function to promisify db.all
const allAsync = (db: sqlite3.Database, sql: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err: Error | null, rows: any[]) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

export function initializeDatabase(): Promise<sqlite3.Database> {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, async (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
        reject(err);
      } else {
        console.log('Connected to the SQLite database.');
        try {
          // Create categories table
          await runAsync(db, `
            CREATE TABLE IF NOT EXISTS categories (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL UNIQUE
            )
          `);
          console.log('Categories table created or already exists.');

          // Insert dummy categories if table is empty
          const categoryCount: { count: number }[] = await allAsync(db, "SELECT COUNT(*) AS count FROM categories");
          if (categoryCount[0].count === 0) {
            const dummyCategories = [
              { id: 'CAT001', name: 'Makanan Pokok' },
              { id: 'CAT002', name: 'Minuman' },
              { id: 'CAT003', name: 'Kebutuhan Rumah Tangga' },
              { id: 'CAT004', name: 'Snack' },
            ];
            for (const c of dummyCategories) {
              await runAsync(db, "INSERT INTO categories (id, name) VALUES (?, ?)", [c.id, c.name]);
            }
            console.log('Dummy categories inserted.');
          }

          // Create products table
          await runAsync(db, `
            CREATE TABLE IF NOT EXISTS products (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              price INTEGER NOT NULL,
              cost_price INTEGER NOT NULL DEFAULT 0, -- Added cost_price
              stock INTEGER NOT NULL,
              barcode TEXT UNIQUE,
              category_id TEXT,
              FOREIGN KEY (category_id) REFERENCES categories(id)
            )
          `);
          console.log('Products table created or already exists.');

          // Insert dummy products if products table is empty
          const productCount: { count: number }[] = await allAsync(db, "SELECT COUNT(*) AS count FROM products");
          if (productCount[0].count === 0) {
            const dummyProducts = [
              { id: 'P001', name: 'Beras 5kg', price: 60000, stock: 100, cost_price: 55000, category_id: 'CAT001' },
              { id: 'P002', name: 'Minyak Goreng 2L', price: 35000, stock: 50, cost_price: 30000, category_id: 'CAT001' },
              { id: 'P003', name: 'Gula Pasir 1kg', price: 15000, stock: 200, cost_price: 13000, category_id: 'CAT001' },
              { id: 'P004', name: 'Telur Ayam 1kg', price: 28000, stock: 75, cost_price: 25000, category_id: 'CAT001' },
              { id: 'P005', name: 'Kopi Bubuk 200gr', price: 12000, stock: 150, cost_price: 10000, category_id: 'CAT002' },
            ];
            for (const p of dummyProducts) {
              await runAsync(db, "INSERT INTO products (id, name, price, stock, category_id, cost_price) VALUES (?, ?, ?, ?, ?, ?)", [p.id, p.name, p.price, p.stock, p.category_id, p.cost_price]);
            }
            console.log('Dummy products inserted.');
          }

          // Create transactions table
          await runAsync(db, `
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
          await runAsync(db, `
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
          await runAsync(db, `
            CREATE TABLE IF NOT EXISTS users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              username TEXT NOT NULL UNIQUE,
              password TEXT NOT NULL
            )
          `);
          console.log('Users table created or already exists.');

          resolve(db);
        } catch (initErr: any) {
          console.error('Error during database initialization:', initErr.message);
          reject(initErr);
        }
      }
    });
  });
}

export function getDatabase(): sqlite3.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return db;
}
