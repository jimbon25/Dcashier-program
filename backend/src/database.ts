import { Pool, QueryResult } from 'pg';

let pool: Pool;

export async function initializeDatabase(): Promise<void> {
  if (pool) {
    console.log('Database pool already initialized.');
    return;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set.');
  }

  pool = new Pool({
    connectionString: connectionString,
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
  });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price INTEGER NOT NULL,
        stock INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        timestamp BIGINT NOT NULL,
        total_amount INTEGER NOT NULL,
        payment_amount INTEGER NOT NULL,
        change_amount INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS transaction_items (
        id SERIAL PRIMARY KEY,
        transaction_id TEXT NOT NULL REFERENCES transactions(id),
        product_id TEXT NOT NULL,
        product_name TEXT NOT NULL,
        price_at_sale INTEGER NOT NULL,
        quantity INTEGER NOT NULL
      );
    `);
    console.log('Tables created or already exist.');

    // Insert dummy data if products table is empty
    const { rows } = await pool.query("SELECT COUNT(*) AS count FROM products");
    if (rows[0].count === '0') {
      const dummyProducts = [
        { id: 'P001', name: 'Beras 5kg', price: 60000, stock: 100 },
        { id: 'P002', name: 'Minyak Goreng 2L', price: 35000, stock: 50 },
        { id: 'P003', name: 'Gula Pasir 1kg', price: 15000, stock: 200 },
        { id: 'P004', name: 'Telur Ayam 1kg', price: 28000, stock: 75 },
        { id: 'P005', name: 'Kopi Bubuk 200gr', price: 12000, stock: 150 },
      ];
      for (const p of dummyProducts) {
        await pool.query("INSERT INTO products (id, name, price, stock) VALUES ($1, $2, $3, $4)", [p.id, p.name, p.price, p.stock]);
      }
      console.log('Dummy products inserted.');
    } else {
      console.log('Products table already populated.');
    }
  } catch (err: any) {
    console.error('Error initializing database:', err.message);
    throw err;
  }
}

export function getPool(): Pool {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initializeDatabase first.');
  }
  return pool;
}