import sqlite3 from 'sqlite3';

const DB_PATH = './sembako-pos.db';

let db: sqlite3.Database;

export function initializeDatabase(): Promise<sqlite3.Database> {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
        reject(err);
      } else {
        console.log('Connected to the SQLite database.');
        db.run(`
          CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            price INTEGER NOT NULL,
            stock INTEGER NOT NULL,
            barcode TEXT UNIQUE,
            category_id TEXT,
            FOREIGN KEY (category_id) REFERENCES categories(id)
          )
        `, (err) => {
          if (err) {
            console.error('Error creating products table:', err.message);
            reject(err);
          } else {
            console.log('Products table created or already exists.');
            db.run(`
              CREATE TABLE IF NOT EXISTS categories (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL UNIQUE
              )
            `, (err) => {
              if (err) {
                console.error('Error creating categories table:', err.message);
                reject(err);
              } else {
                console.log('Categories table created or already exists.');
                // Insert dummy categories if table is empty
                db.get("SELECT COUNT(*) AS count FROM categories", (err, row: { count: number }) => {
                  if (err) {
                    console.error('Error checking category count:', err.message);
                    reject(err);
                  } else if (row.count === 0) {
                    const stmt = db.prepare("INSERT INTO categories (id, name) VALUES (?, ?)");
                    const dummyCategories = [
                      { id: 'CAT001', name: 'Makanan Pokok' },
                      { id: 'CAT002', name: 'Minuman' },
                      { id: 'CAT003', name: 'Kebutuhan Rumah Tangga' },
                      { id: 'CAT004', name: 'Snack' },
                    ];
                    dummyCategories.forEach(c => {
                      stmt.run(c.id, c.name);
                    });
                    stmt.finalize(() => {
                      console.log('Dummy categories inserted.');
                      db.run(`
                        CREATE TABLE IF NOT EXISTS transactions (
                          id TEXT PRIMARY KEY,
                          timestamp INTEGER NOT NULL,
                          total_amount INTEGER NOT NULL,
                          payment_amount INTEGER NOT NULL,
                          change_amount INTEGER NOT NULL,
                          payment_method TEXT NOT NULL DEFAULT 'Cash'
                        )
                      `, (err) => {
                        if (err) {
                          console.error('Error creating transactions table:', err.message);
                          reject(err);
                        } else {
                          console.log('Transactions table created or already exists.');
                          db.run(`
                            CREATE TABLE IF NOT EXISTS transaction_items (
                              id INTEGER PRIMARY KEY AUTOINCREMENT,
                              transaction_id TEXT NOT NULL,
                              product_id TEXT NOT NULL,
                              product_name TEXT NOT NULL,
                              price_at_sale INTEGER NOT NULL,
                              quantity INTEGER NOT NULL,
                              FOREIGN KEY (transaction_id) REFERENCES transactions(id)
                            )
                          `, (err) => {
                            if (err) {
                              console.error('Error creating transaction_items table:', err.message);
                              reject(err);
                            } else {
                              console.log('Transaction items table created or already exists.');
                              // Insert dummy data if products table is empty
                              db.get("SELECT COUNT(*) AS count FROM products", (err, row: { count: number }) => {
                                if (err) {
                                  console.error('Error checking product count:', err.message);
                                  reject(err);
                                } else if (row.count === 0) {
                                  const stmt = db.prepare("INSERT INTO products (id, name, price, stock, category_id) VALUES (?, ?, ?, ?, ?)");
                                  const dummyProducts = [
                                    { id: 'P001', name: 'Beras 5kg', price: 60000, stock: 100, category_id: 'CAT001' },
                                    { id: 'P002', name: 'Minyak Goreng 2L', price: 35000, stock: 50, category_id: 'CAT001' },
                                    { id: 'P003', name: 'Gula Pasir 1kg', price: 15000, stock: 200, category_id: 'CAT001' },
                                    { id: 'P004', name: 'Telur Ayam 1kg', price: 28000, stock: 75, category_id: 'CAT001' },
                                    { id: 'P005', name: 'Kopi Bubuk 200gr', price: 12000, stock: 150, category_id: 'CAT002' },
                                  ];
                                  dummyProducts.forEach(p => {
                                    stmt.run(p.id, p.name, p.price, p.stock, p.category_id);
                                  });
                                  stmt.finalize(() => {
                                    console.log('Dummy products inserted.');
                                    resolve(db);
                                  });
                                } else {
                                  console.log('Products table already populated.');
                                  resolve(db);
                                }
                              });
                            }
                          });
                        }
                      });
                    });
                  } else {
                    console.log('Categories table already populated.');
                    db.run(`
                      CREATE TABLE IF NOT EXISTS transactions (
                        id TEXT PRIMARY KEY,
                        timestamp INTEGER NOT NULL,
                        total_amount INTEGER NOT NULL,
                        payment_amount INTEGER NOT NULL,
                        change_amount INTEGER NOT NULL,
                        payment_method TEXT NOT NULL DEFAULT 'Cash'
                      )
                    `, (err) => {
                      if (err) {
                        console.error('Error creating transactions table:', err.message);
                        reject(err);
                      } else {
                        console.log('Transactions table created or already exists.');
                        db.run(`
                          CREATE TABLE IF NOT EXISTS transaction_items (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            transaction_id TEXT NOT NULL,
                            product_id TEXT NOT NULL,
                            product_name TEXT NOT NULL,
                            price_at_sale INTEGER NOT NULL,
                            quantity INTEGER NOT NULL,
                            FOREIGN KEY (transaction_id) REFERENCES transactions(id)
                          )
                        `, (err) => {
                          if (err) {
                            console.error('Error creating transaction_items table:', err.message);
                            reject(err);
                          } else {
                            console.log('Transaction items table created or already exists.');
                            // Insert dummy data if products table is empty
                            db.get("SELECT COUNT(*) AS count FROM products", (err, row: { count: number }) => {
                              if (err) {
                                console.error('Error checking product count:', err.message);
                                reject(err);
                              } else if (row.count === 0) {
                                const stmt = db.prepare("INSERT INTO products (id, name, price, stock, category_id) VALUES (?, ?, ?, ?, ?)");
                                const dummyProducts = [
                                  { id: 'P001', name: 'Beras 5kg', price: 60000, stock: 100, category_id: 'CAT001' },
                                  { id: 'P002', name: 'Minyak Goreng 2L', price: 35000, stock: 50, category_id: 'CAT001' },
                                  { id: 'P003', name: 'Gula Pasir 1kg', price: 15000, stock: 200, category_id: 'CAT001' },
                                  { id: 'P004', name: 'Telur Ayam 1kg', price: 28000, stock: 75, category_id: 'CAT001' },
                                  { id: 'P005', name: 'Kopi Bubuk 200gr', price: 12000, stock: 150, category_id: 'CAT002' },
                                ];
                                dummyProducts.forEach(p => {
                                  stmt.run(p.id, p.name, p.price, p.stock, p.category_id);
                                });
                                stmt.finalize(() => {
                                  console.log('Dummy products inserted.');
                                  resolve(db);
                                });
                              } else {
                                console.log('Products table already populated.');
                                resolve(db);
                              }
                            });
                          }
                        });
                      }
                    });
                  }
                });
              }
            });
          }
        });
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
