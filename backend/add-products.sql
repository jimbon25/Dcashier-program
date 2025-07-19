-- Add 20 more products to the database
INSERT INTO products (id, name, price, cost_price, stock, barcode, image_url, category_id) VALUES
-- Makanan Pokok (CAT001)
('P006', 'Tepung Terigu 1kg', 12000, 10500, 120, 'B006', 'https://via.placeholder.com/150/FF5733/FFFFFF?text=Tepung', 'CAT001'),
('P007', 'Garam Dapur 250gr', 3500, 3000, 200, 'B007', 'https://via.placeholder.com/150/C0392B/FFFFFF?text=Garam', 'CAT001'),
('P008', 'Merica Bubuk 100gr', 8000, 7000, 80, 'B008', 'https://via.placeholder.com/150/E74C3C/FFFFFF?text=Merica', 'CAT001'),
('P009', 'Bawang Merah 1kg', 35000, 32000, 60, 'B009', 'https://via.placeholder.com/150/8E44AD/FFFFFF?text=BawangMerah', 'CAT001'),
('P010', 'Bawang Putih 1kg', 45000, 42000, 45, 'B010', 'https://via.placeholder.com/150/9B59B6/FFFFFF?text=BawangPutih', 'CAT001'),

-- Minuman (CAT002)
('P011', 'Teh Celup 25pcs', 8500, 7500, 100, 'B011', 'https://via.placeholder.com/150/3498DB/FFFFFF?text=Teh', 'CAT002'),
('P012', 'Susu UHT 1L', 18000, 16000, 90, 'B012', 'https://via.placeholder.com/150/2ECC71/FFFFFF?text=Susu', 'CAT002'),
('P013', 'Air Mineral 600ml', 3000, 2500, 300, 'B013', 'https://via.placeholder.com/150/1ABC9C/FFFFFF?text=AirMineral', 'CAT002'),
('P014', 'Kopi Instan 10x20gr', 15000, 13000, 75, 'B014', 'https://via.placeholder.com/150/16A085/FFFFFF?text=KopiInstan', 'CAT002'),
('P015', 'Jus Jeruk 250ml', 6000, 5000, 150, 'B015', 'https://via.placeholder.com/150/F39C12/FFFFFF?text=JusJeruk', 'CAT002'),

-- Kebutuhan Rumah Tangga (CAT003)
('P016', 'Deterjen Cair 1L', 25000, 22000, 50, 'B016', 'https://via.placeholder.com/150/F1C40F/000000?text=Deterjen', 'CAT003'),
('P017', 'Sabun Mandi 85gr', 4500, 4000, 120, 'B017', 'https://via.placeholder.com/150/E67E22/FFFFFF?text=SabunMandi', 'CAT003'),
('P018', 'Shampoo 170ml', 18000, 16000, 80, 'B018', 'https://via.placeholder.com/150/D35400/FFFFFF?text=Shampoo', 'CAT003'),
('P019', 'Tissue 250lbr', 8000, 7000, 100, 'B019', 'https://via.placeholder.com/150/A569BD/FFFFFF?text=Tissue', 'CAT003'),
('P020', 'Pembersih Lantai 1L', 15000, 13000, 60, 'B020', 'https://via.placeholder.com/150/85929E/FFFFFF?text=Pembersih', 'CAT003'),

-- Snack (CAT004)
('P021', 'Keripik Kentang 100gr', 12000, 10000, 200, 'B021', 'https://via.placeholder.com/150/48C9B0/FFFFFF?text=Keripik', 'CAT004'),
('P022', 'Coklat Batang 45gr', 7500, 6500, 150, 'B022', 'https://via.placeholder.com/150/6C3483/FFFFFF?text=Coklat', 'CAT004'),
('P023', 'Biskuit Krackers 125gr', 9000, 8000, 180, 'B023', 'https://via.placeholder.com/150/1B4F72/FFFFFF?text=Biskuit', 'CAT004'),
('P024', 'Permen Mint 50gr', 5000, 4500, 250, 'B024', 'https://via.placeholder.com/150/117A65/FFFFFF?text=Permen', 'CAT004'),
('P025', 'Wafer Coklat 145gr', 8500, 7500, 120, 'B025', 'https://via.placeholder.com/150/B7950B/FFFFFF?text=Wafer', 'CAT004');
