import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Toast, ToastContainer } from 'react-bootstrap';
import ReceiptModal from './ReceiptModal';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface CartItem extends Product {
  quantity: number;
}

interface TransactionItem {
  id: number;
  transaction_id: string;
  product_id: string;
  product_name: string;
  price_at_sale: number;
  quantity: number;
}

interface Transaction {
  id: string;
  timestamp: number;
  total_amount: number;
  payment_amount: number;
  change_amount: number;
  items: TransactionItem[];
}

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [change, setChange] = useState<number | null>(null);

  // Receipt Modal State
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);

  // Discount State
  const [discount, setDiscount] = useState<number>(0); // In percentage or fixed amount

  // Notification State
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastVariant, setToastVariant] = useState<string>('success'); // success, danger, info

  // Product Search State
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Product Management States
  const [newProductId, setNewProductId] = useState<string>('');
  const [newProductName, setNewProductName] = useState<string>('');
  const [newProductPrice, setNewProductPrice] = useState<number>(0);
  const [newProductStock, setNewProductStock] = useState<number>(0);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Low Stock Products State
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const LOW_STOCK_THRESHOLD = 10; // Define your low stock threshold here

  const showNotification = (message: string, variant: string = 'success') => {
    setToastMessage(message);
    setToastVariant(variant);
    setShowToast(true);
  };

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  // Transaction History States
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    fetch('http://localhost:3001/transactions')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        setTransactions(data);
      })
      .catch(error => {
        console.error("Error fetching transactions:", error);
      });
  }, []);

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setNewProductId(product.id);
    setNewProductName(product.name);
    setNewProductPrice(product.price);
    setNewProductStock(product.stock);
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setNewProductId('');
    setNewProductName('');
    setNewProductPrice(0);
    setNewProductStock(0);
  };

  const handleAddProduct = async () => {
    if (editingProduct) return; // Prevent adding if in edit mode
    try {
      const response = await fetch('http://localhost:3001/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: newProductId,
          name: newProductName,
          price: newProductPrice,
          stock: newProductStock,
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      showNotification(data.message, 'success');
      // Refresh product list
      fetch('http://localhost:3001/products')
        .then(res => res.json())
        .then(setProducts);
      // Clear form
      setNewProductId('');
      setNewProductName('');
      setNewProductPrice(0);
      setNewProductStock(0);
    } catch (error: any) {
      console.error("Error adding product:", error);
      showNotification(`Failed to add product: ${error.message}`, 'danger');
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return; // Only update if in edit mode
    try {
      const response = await fetch(`http://localhost:3001/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newProductName,
          price: newProductPrice,
          stock: newProductStock,
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      showNotification(data.message, 'success');
      // Refresh product list
      fetch('http://localhost:3001/products')
        .then(res => res.json())
        .then(setProducts);
      // Clear form and exit edit mode
      handleCancelEdit();
    } catch (error: any) {
      console.error("Error updating product:", error);
      showNotification(`Failed to update product: ${error.message}`, 'danger');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      try {
        const response = await fetch(`http://localhost:3001/products/${productId}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        showNotification(data.message, 'success');
        // Refresh product list
        fetch('http://localhost:3001/products')
          .then(res => res.json())
          .then(setProducts);
      } catch (error: any) {
        console.error("Error deleting product:", error);
        showNotification(`Failed to delete product: ${error.message}`, 'danger');
      }
    }
  };

  const totalBeforeDiscount = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const total = totalBeforeDiscount - (totalBeforeDiscount * (discount / 100));

  const handlePayment = async () => {
    if (paymentAmount < total) {
      showNotification(`Pembayaran Gagal! Uang yang dibayarkan kurang Rp${(total - paymentAmount).toLocaleString()}`, 'danger');
      return;
    }

    try {
      // 1. Record the transaction
      const transactionResponse = await fetch('http://localhost:3001/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          total_amount: total,
          payment_amount: paymentAmount,
          change_amount: paymentAmount - total,
          cartItems: cart,
        }),
      });

      if (!transactionResponse.ok) {
        throw new Error(`Failed to record transaction: ${transactionResponse.status}`);
      }
      const transactionData = await transactionResponse.json();
      console.log('Transaction recorded:', transactionData);

      // 2. Update product stock for each item in the cart
      for (const item of cart) {
        const stockUpdateResponse = await fetch(`http://localhost:3001/products/${item.id}/stock`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ quantity: item.quantity }),
        });

        if (!stockUpdateResponse.ok) {
          throw new Error(`Failed to update stock for ${item.name}: ${stockUpdateResponse.status}`);
        }
      }

      // If all successful
      const calculatedChange = paymentAmount - total;
      setChange(calculatedChange);
      setCart([]); // Clear the cart
      setPaymentAmount(0); // Reset payment amount
      showNotification(`Pembayaran Berhasil! Kembalian: Rp${calculatedChange.toLocaleString()}`, 'success');

      // Set current transaction for receipt modal
      setCurrentTransaction({
        id: transactionData.transactionId,
        timestamp: Date.now(), // Use current time for receipt
        total_amount: total,
        payment_amount: paymentAmount,
        change_amount: calculatedChange,
        items: cart.map(item => ({ // Map cart items to ReceiptItem format
          product_name: item.name,
          price_at_sale: item.price,
          quantity: item.quantity,
          id: 0, // Dummy ID, not used for display
          transaction_id: transactionData.transactionId, // Dummy, not used for display
          product_id: item.id // Dummy, not used for display
        }))
      });
      setShowReceiptModal(true); // Show the receipt modal

      // Refresh product list to show updated stock
      fetch('http://localhost:3001/products')
        .then(res => res.json())
        .then(setProducts);

      // Refresh transaction history
      fetch('http://localhost:3001/transactions')
        .then(res => res.json())
        .then(setTransactions);

    } catch (error: any) {
      console.error("Error during payment process:", error);
      showNotification(`Terjadi kesalahan saat memproses pembayaran: ${error.message}`, 'danger');
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === productId);
      if (existingItem) {
        if (existingItem.quantity > 1) {
          return prevCart.map(item =>
            item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
          );
        } else {
          return prevCart.filter(item => item.id !== productId);
        }
      }
      return prevCart; // Should not happen if button is only shown for existing items
    });
  };

  useEffect(() => {
    fetch('http://localhost:3001/products')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        setProducts(data);
        setLoading(false);
        // Identify low stock products
        const lowStock = data.filter((p: Product) => p.stock <= LOW_STOCK_THRESHOLD);
        setLowStockProducts(lowStock);
      })
      .catch(error => {
        console.error("Error fetching products:", error);
        setError(error.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <Container className="mt-5">Loading products...</Container>;
  }

  if (error) {
    return <Container className="mt-5">Error: {error}</Container>;
  }

  return (
    <Container className="mt-5">
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1 }}>
        <Toast onClose={() => setShowToast(false)} show={showToast} delay={3000} autohide bg={toastVariant}>
          <Toast.Body className={toastVariant === 'danger' ? 'text-white' : ''}>
            {toastMessage}
          </Toast.Body>
        </Toast>
      </ToastContainer>
      <h1 className="mb-4">Daftar Produk Toko Dyka Akbar</h1>
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Cari produk berdasarkan nama atau ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <Row>
        {products
          .filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.id.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map(product => (
          <Col key={product.id} sm={6} md={4} lg={3} className="mb-4">
            <Card>
              <Card.Body>
                <Card.Title>{product.name}</Card.Title>
                <Card.Text>
                  Harga: Rp{product.price.toLocaleString()}
                  <br />
                  Stok: {product.stock}
                </Card.Text>
                <Button variant="primary" onClick={() => addToCart(product)}>Tambah ke Keranjang</Button>
                <Button variant="danger" className="ms-2" onClick={() => handleDeleteProduct(product.id)}>Hapus</Button>
                <Button variant="info" className="ms-2" onClick={() => handleEditClick(product)}>Edit</Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <h2 className="mt-5 mb-3">Produk Stok Rendah</h2>
      {lowStockProducts.length === 0 ? (
        <p>Tidak ada produk dengan stok rendah.</p>
      ) : (
        <Row>
          <Col>
            <table className="table table-striped table-danger">
              <thead>
                <tr>
                  <th>ID Produk</th>
                  <th>Nama Produk</th>
                  <th>Stok</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map(product => (
                  <tr key={product.id}>
                    <td>{product.id}</td>
                    <td>{product.name}</td>
                    <td>{product.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Col>
        </Row>
      )}

      <h2 className="mt-5 mb-3">Manajemen Produk</h2>
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <Card.Title>Tambah Produk Baru</Card.Title>
              <div className="mb-3">
                <label htmlFor="productId" className="form-label">ID Produk</label>
                <input type="text" className="form-control" id="productId" value={newProductId} onChange={(e) => setNewProductId(e.target.value)} placeholder="Contoh: P006" disabled={!!editingProduct} />
              </div>
              <div className="mb-3">
                <label htmlFor="productName" className="form-label">Nama Produk</label>
                <input type="text" className="form-control" id="productName" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} placeholder="Contoh: Sabun Mandi" />
              </div>
              <div className="mb-3">
                <label htmlFor="productPrice" className="form-label">Harga</label>
                <input type="number" className="form-control" id="productPrice" value={newProductPrice === 0 ? '' : newProductPrice} onChange={(e) => setNewProductPrice(Number(e.target.value))} placeholder="Contoh: 5000" />
              </div>
              <div className="mb-3">
                <label htmlFor="productStock" className="form-label">Stok</label>
                <input type="number" className="form-control" id="productStock" value={newProductStock === 0 ? '' : newProductStock} onChange={(e) => setNewProductStock(Number(e.target.value))} placeholder="Contoh: 100" />
              </div>
              {editingProduct ? (
                <>
                  <Button variant="warning" onClick={handleUpdateProduct}>Update Produk</Button>
                  <Button variant="secondary" className="ms-2" onClick={handleCancelEdit}>Batal Edit</Button>
                </>
              ) : (
                <Button variant="success" onClick={handleAddProduct}>Tambah Produk</Button>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <h2 className="mt-5 mb-3">Keranjang Belanja</h2>
      {cart.length === 0 ? (
        <p>Keranjang kosong.</p>
      ) : (
        <Row>
          <Col>
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Produk</th>
                  <th>Harga</th>
                  <th>Kuantitas</th>
                  <th>Subtotal</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {cart.map(item => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>Rp{item.price.toLocaleString()}</td>
                    <td>{item.quantity}</td>
                    <td>Rp{(item.price * item.quantity).toLocaleString()}</td>
                    <td>
                      <Button variant="danger" size="sm" onClick={() => removeFromCart(item.id)}>Kurangi</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h4 className="text-end mt-3">Total: Rp{total.toLocaleString()}</h4>
            <div className="d-flex justify-content-end mt-2">
              <label htmlFor="discountInput" className="form-label me-2">Diskon (%):</label>
              <input
                type="number"
                id="discountInput"
                className="form-control w-25"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                min="0"
                max="100"
              />
            </div>
            <div className="d-flex justify-content-end mt-3">
              <input
                type="number"
                placeholder="Jumlah Bayar"
                className="form-control w-25 me-2"
                value={paymentAmount === 0 ? '' : paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
              />
              <Button variant="success" onClick={handlePayment}>Bayar</Button>
            </div>
            {change !== null && (
              <h4 className="text-end mt-3 text-success">Kembalian: Rp{change.toLocaleString()}</h4>
            )}
          </Col>
        </Row>
      )}

      <h2 className="mt-5 mb-3">Laporan Penjualan</h2>
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <Card.Title>Ringkasan Penjualan</Card.Title>
              <p>Total Pendapatan: Rp{transactions.reduce((acc, trx) => acc + trx.total_amount, 0).toLocaleString()}</p>
              {/* Nanti bisa ditambahkan filter tanggal atau detail lainnya */}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <h2 className="mt-5 mb-3">Riwayat Transaksi</h2>
      {transactions.length === 0 ? (
        <p>Belum ada transaksi.</p>
      ) : (
        <Row>
          <Col>
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>ID Transaksi</th>
                  <th>Waktu</th>
                  <th>Total</th>
                  <th>Dibayar</th>
                  <th>Kembalian</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(transaction => (
                  <tr key={transaction.id}>
                    <td>{transaction.id}</td>
                    <td>{new Date(transaction.timestamp).toLocaleString()}</td>
                    <td>Rp{transaction.total_amount.toLocaleString()}</td>
                    <td>Rp{transaction.payment_amount.toLocaleString()}</td>
                    <td>Rp{transaction.change_amount.toLocaleString()}</td>
                    <td>
                      <ul>
                        {transaction.items.map(item => (
                          <li key={item.id}>
                            {item.product_name} ({item.quantity} x Rp{item.price_at_sale.toLocaleString()})
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Col>
        </Row>
      )}

      <ReceiptModal
        show={showReceiptModal}
        onHide={() => setShowReceiptModal(false)}
        transaction={currentTransaction}
      />
    </Container>
  );
}

export default App;