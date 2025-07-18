# D'Cashier - Point of Sale System

## 🚀 Fitur Utama

### 1. **Cashier Page** - Halaman Kasir
- **Barcode Scanner**: Scan barcode produk untuk menambahkan ke keranjang
- **Product Browser**: Telusuri produk berdasarkan kategori
- **Shopping Cart**: Tambah, kurangi, dan hapus item dari keranjang
- **Payment Processing**: Mendukung berbagai metode pembayaran (cash, card, e-wallet)
- **Receipt Generation**: Cetak struk otomatis setelah transaksi

### 2. **Transaction History** - Riwayat Transaksi
- **Filter Transaksi**: Filter berdasarkan tanggal, status, dan metode pembayaran
- **Detail Transaksi**: Lihat detail lengkap setiap transaksi
- **Export Data**: Export transaksi ke CSV/Excel
- **Admin Controls**: Void atau refund transaksi (admin only)

### 3. **Product Management** - Manajemen Produk
- **CRUD Operations**: Create, Read, Update, Delete produk
- **Image Upload**: Upload gambar produk
- **Barcode Generation**: Generate barcode otomatis
- **Category Management**: Kelola kategori produk

### 4. **User Management** - Manajemen Pengguna
- **Role-based Access**: Admin dan Cashier roles
- **JWT Authentication**: Secure authentication system
- **User Profile**: Kelola profile pengguna

## 🛠️ Teknologi yang Digunakan

### Backend
- **Node.js** dengan Express.js
- **TypeScript** untuk type safety
- **SQLite** database
- **JWT** untuk authentication
- **Multer** untuk upload file
- **bcrypt** untuk password hashing

### Frontend
- **React** dengan TypeScript
- **React Router** untuk routing
- **Redux Toolkit** untuk state management
- **React Bootstrap** untuk UI components
- **React Toastify** untuk notifications
- **React Bootstrap Icons** untuk icons

## 📋 Cara Menjalankan

### 1. Setup Backend
```bash
cd backend
npm install
npm start
```
Backend akan berjalan di `http://localhost:3001`

### 2. Setup Frontend
```bash
cd frontend
npm install
npm start
```
Frontend akan berjalan di `http://localhost:3002`

### 3. Login Credentials
- **Username**: admin
- **Password**: admin123
- **Role**: admin

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `POST /api/auth/logout` - Logout

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create transaction
- `GET /api/transactions/:id` - Get transaction details
- `PUT /api/transactions/:id/void` - Void transaction (admin only)

### Reports
- `GET /api/reports/sales` - Sales report
- `GET /api/reports/products` - Product report
- `GET /api/reports/transactions` - Transaction report

## 📱 Penggunaan Aplikasi

### Sebagai Kasir:
1. Login dengan kredensial kasir
2. Buka halaman **Cashier**
3. Scan barcode atau pilih produk manual
4. Tambahkan ke keranjang
5. Pilih metode pembayaran
6. Proses transaksi
7. Cetak struk

### Sebagai Admin:
1. Login dengan kredensial admin
2. Akses semua fitur termasuk:
   - Manajemen produk dan kategori
   - Riwayat transaksi lengkap
   - Laporan penjualan
   - Manajemen pengguna

## 🎯 Workflow Cashier

1. **Scan/Pilih Produk** → Produk masuk ke keranjang
2. **Review Keranjang** → Cek item dan jumlah
3. **Hitung Total** → Sistem menghitung otomatis
4. **Pilih Pembayaran** → Cash, Card, atau E-wallet
5. **Proses Transaksi** → Validasi dan simpan ke database
6. **Cetak Struk** → Generate dan print receipt

## 🔐 Keamanan

- JWT Token authentication
- Role-based access control
- Password hashing dengan bcrypt
- Rate limiting untuk API
- Input validation dan sanitization
- Error handling yang comprehensive

## 📊 Database Schema

### Products
- id, name, price, description, category_id, stock, barcode, image_url

### Categories
- id, name, description

### Transactions
- id, user_id, total_amount, payment_method, status, created_at

### Transaction Items
- id, transaction_id, product_id, quantity, unit_price, subtotal

### Users
- id, username, email, password, role, created_at

## 🚀 Deployment

Aplikasi siap untuk di-deploy ke production dengan konfigurasi:
- Backend: Node.js hosting (Heroku, DigitalOcean, AWS)
- Frontend: Static hosting (Netlify, Vercel, GitHub Pages)
- Database: PostgreSQL untuk production (mudah migrasi dari SQLite)

## 📞 Support

Untuk bantuan dan bug report, silakan buat issue di repository ini.
