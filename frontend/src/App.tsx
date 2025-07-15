import React, { useEffect, useState, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Nav, Tab, Spinner } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ReceiptModal from './ReceiptModal';
import ProductSkeleton from './ProductSkeleton';
import { CartPlus, PencilSquare, Trash, SunFill, MoonFill } from 'react-bootstrap-icons'; // Import ikon dan ikon tema

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  barcode?: string; // Tambahkan properti barcode opsional
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
  payment_method: string; // Tambahkan properti payment_method
}

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [change, setChange] = useState<number | null>(null);
  const [discount, setDiscount] = useState<number>(0);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash'); // State untuk metode pembayaran
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cartAnimationTrigger, setCartAnimationTrigger] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('sales');
  const [theme, setTheme] = useState<string>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    } else {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // Product Search State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [barcodeInput, setBarcodeInput] = useState<string>('');

  // Product Management States
  const [newProductId, setNewProductId] = useState<string>('');
  const [newProductName, setNewProductName] = useState<string>('');
  const [newProductPrice, setNewProductPrice] = useState<number>(0);
  const [newProductStock, setNewProductStock] = useState<number>(0);
  const [newProductBarcode, setNewProductBarcode] = useState<string>('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Report States
  const [reportDate, setReportDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dailySales, setDailySales] = useState<any[]>([]);
  const [dailySalesLoading, setDailySalesLoading] = useState<boolean>(false);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [topProductsLimit, setTopProductsLimit] = useState<number>(5);
  const [topProductsLoading, setTopProductsLoading] = useState<boolean>(false);

  // Low Stock Products State
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const LOW_STOCK_THRESHOLD = 10; // Define your low stock threshold here

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
    setCartAnimationTrigger(true);
  };

  useEffect(() => {
    if (cartAnimationTrigger) {
      const timer = setTimeout(() => {
        setCartAnimationTrigger(false);
      }, 300); // Durasi animasi
      return () => clearTimeout(timer);
    }
  }, [cartAnimationTrigger]);

  const increaseQuantity = (productId: string) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decreaseQuantity = (productId: string) => {
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

  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      let url = 'http://localhost:3001/transactions';
      const params = new URLSearchParams();
      if (filterStartDate) {
        params.append('startDate', String(new Date(filterStartDate).getTime()));
      }
      if (filterEndDate) {
        params.append('endDate', String(new Date(filterEndDate).getTime()));
      }
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTransactions(data);
    } catch (error: any) {
      console.error("Error fetching transactions:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [filterStartDate, filterEndDate]);

  const fetchDailySales = useCallback(async () => {
    setDailySalesLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/reports/daily-sales?date=${reportDate}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setDailySales(data);
    } catch (error: any) {
      console.error("Error fetching daily sales:", error);
      toast.error(`Failed to fetch daily sales: ${error.message}`);
    } finally {
      setDailySalesLoading(false);
    }
  }, [reportDate]);

  const fetchTopProducts = useCallback(async () => {
    setTopProductsLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/reports/top-products?limit=${topProductsLimit}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTopProducts(data);
    } catch (error: any) {
      console.error("Error fetching top products:", error);
      toast.error(`Failed to fetch top products: ${error.message}`);
    } finally {
      setTopProductsLoading(false);
    }
  }, [topProductsLimit]);

  useEffect(() => {
    fetchDailySales();
    fetchTopProducts();
  }, [fetchDailySales, fetchTopProducts]);

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setNewProductId(product.id);
    setNewProductName(product.name);
    setNewProductPrice(product.price);
    setNewProductStock(product.stock);
    setNewProductBarcode(product.barcode || '');
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setNewProductId('');
    setNewProductName('');
    setNewProductPrice(0);
    setNewProductStock(0);
    setNewProductBarcode('');
  };

  const handleAddProduct = async () => {
    if (editingProduct) return; // Prevent adding if in edit mode

    const errors: { [key: string]: string } = {};
    if (!newProductId.trim()) {
      errors.newProductId = 'ID Produk tidak boleh kosong.';
    }
    if (!newProductName.trim()) {
      errors.newProductName = 'Nama Produk tidak boleh kosong.';
    }
    if (newProductPrice <= 0) {
      errors.newProductPrice = 'Harga harus lebih besar dari 0.';
    }
    if (newProductStock < 0) {
      errors.newProductStock = 'Stok tidak boleh negatif.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({}); // Clear errors if validation passes

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
          barcode: newProductBarcode || null, // Kirim barcode, atau null jika kosong
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      toast.success(data.message);
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
      toast.error(`Failed to add product: ${error.message}`);
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return; // Only update if in edit mode

    const errors: { [key: string]: string } = {};
    if (!newProductName.trim()) {
      errors.newProductName = 'Nama Produk tidak boleh kosong.';
    }
    if (newProductPrice <= 0) {
      errors.newProductPrice = 'Harga harus lebih besar dari 0.';
    }
    if (newProductStock < 0) {
      errors.newProductStock = 'Stok tidak boleh negatif.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({}); // Clear errors if validation passes

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
          barcode: newProductBarcode || null,
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      toast.success(data.message);
      // Refresh product list
      fetch('http://localhost:3001/products')
        .then(res => res.json())
        .then(setProducts);
      // Clear form and exit edit mode
      handleCancelEdit();
    } catch (error: any) {
      console.error("Error updating product:", error);
      toast.error(`Failed to update product: ${error.message}`);
    }
  };

  const handleInlineUpdateProduct = async (productId: string, field: string, value: string | number) => {
    try {
      const payload: { [key: string]: string | number } = { [field]: value };
      const response = await fetch(`http://localhost:3001/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      toast.success(data.message);
      setEditingProductId(null);
      setEditingField(null);
      // Refresh product list
      fetch('http://localhost:3001/products')
        .then(res => res.json())
        .then(setProducts);
    } catch (error: any) {
      console.error("Error updating product inline:", error);
      toast.error(`Failed to update product: ${error.message}`);
      setEditingProductId(null);
      setEditingField(null);
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
        toast.success(data.message);
        // Refresh product list
        fetch('http://localhost:3001/products')
          .then(res => res.json())
          .then(setProducts);
      } catch (error: any) {
        console.error("Error deleting product:", error);
        toast.error(`Failed to delete product: ${error.message}`);
      }
    }
  };

  const handlePayment = async () => {
    if (paymentAmount < total) {
      toast.error(`Pembayaran Gagal! Uang yang dibayarkan kurang Rp${(total - paymentAmount).toLocaleString()}`);
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
          payment_method: paymentMethod, // Kirim metode pembayaran
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
      toast.success(`Pembayaran Berhasil! Kembalian: Rp${calculatedChange.toLocaleString()}`);

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
        })),
        payment_method: paymentMethod // Tambahkan payment_method ke currentTransaction
      });
      setShowReceiptModal(true); // Show the receipt modal

      // Refresh product list to show updated stock
      fetch('http://localhost:3001/products')
        .then(res => res.json())
        .then(setProducts);

      // Refresh transaction history
      fetchTransactions();

    } catch (error: any) {
      console.error("Error during payment process:", error);
      toast.error(`Terjadi kesalahan saat memproses pembayaran: ${error.message}`);
    }
  };

  const handleResetTransactions = async () => {
    if (window.confirm('Apakah Anda yakin ingin mereset semua data transaksi? Tindakan ini tidak dapat diurungkan.')) {
      try {
        const response = await fetch('http://localhost:3001/reset-transactions', {
          method: 'POST',
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        toast.info(data.message);
        // Refresh transaction history
        fetchTransactions();
      } catch (error: any) {
        console.error("Error resetting transactions:", error);
        toast.error(`Failed to reset transactions: ${error.message}`);
      }
    }
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
    return (
      <Container className="mt-5">
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading products...</span>
          </Spinner>
          <p className="mt-2">Memuat produk...</p>
        </div>
        <h1 className="mb-4">Daftar Produk Toko Dyka Akbar</h1>
        <div className="mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Cari produk berdasarkan nama atau ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled
          />
        </div>
        <Row>
          {Array.from({ length: 8 }).map((_, index) => (
            <ProductSkeleton key={index} />
          ))}
        </Row>
      </Container>
    );
  }

  if (error) {
    return <Container className="mt-5">Error: {error}</Container>;
  }

  const totalBeforeDiscount = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const total = totalBeforeDiscount - (totalBeforeDiscount * (discount / 100));

  return (
    <Container className="mt-5 py-4">
      <div className="d-flex justify-content-between align-items-center mb-5 pb-2 border-bottom">
        <h1 className="mb-0 text-primary">Daftar Produk Toko Dyka Akbar</h1>
        <Button variant="outline-secondary" onClick={toggleTheme} className="rounded-circle p-2">
          {theme === 'light' ? <MoonFill size={20} /> : <SunFill size={20} />}
        </Button>
      </div>
      <Tab.Container activeKey={activeTab} onSelect={(k: string | null) => setActiveTab(k || 'sales')}>
        <Nav variant="tabs" className="mb-4 border-bottom-0">
          <Nav.Item>
            <Nav.Link eventKey="sales" className="fw-semibold">Penjualan</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="product-management" className="fw-semibold">Manajemen Produk</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="reports" className="fw-semibold">Laporan</Nav.Link>
          </Nav.Item>
        </Nav>

        <Tab.Content>
          <Tab.Pane eventKey="sales" className="p-3 border rounded">
            <div className="mb-4">
              <input
                type="text"
                className="form-control form-control-lg"
                placeholder="Cari produk berdasarkan nama atau ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <input
                type="text"
                className="form-control form-control-lg"
                placeholder="Scan Barcode atau Masukkan Barcode..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyPress={async (e) => {
                  if (e.key === 'Enter' && barcodeInput.trim() !== '') {
                    try {
                      const response = await fetch(`http://localhost:3001/products/barcode/${barcodeInput}`);
                      if (!response.ok) {
                        throw new Error(`Product with barcode ${barcodeInput} not found.`);
                      }
                      const product: Product = await response.json();
                      addToCart(product);
                      setBarcodeInput(''); // Clear input after adding
                    } catch (error: any) {
                      toast.error(error.message);
                    }
                  }
                }}
              />
            </div>
            <Row className="g-4 mb-5"> {/* Add gutter spacing and bottom margin */}
              {loading ? (
                Array.from({ length: 8 }).map((_, index) => (
                  <Col key={index} sm={6} md={4} lg={3}>
                    <ProductSkeleton />
                  </Col>
                ))
              ) : (
                products
                  .filter(product =>
                    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    product.id.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(product => (
                    <Col key={product.id} sm={6} md={4} lg={3}>
                      <Card className={product.stock <= LOW_STOCK_THRESHOLD ? 'border border-danger shadow-sm' : 'shadow-sm'}> {/* Add shadow */}
                        <Card.Body>
                          {product.stock <= LOW_STOCK_THRESHOLD && (
                            <div className="position-absolute top-0 end-0 bg-danger text-white px-2 py-1 rounded-bottom-left small fw-semibold">
                              Stok Rendah!
                            </div>
                          )}
                          <Card.Title
                            className="fw-bold text-primary"
                            onDoubleClick={() => {
                              setEditingProductId(product.id);
                              setEditingField('name');
                            }}
                          >
                            {editingProductId === product.id && editingField === 'name' ? (
                              <input
                                type="text"
                                value={product.name}
                                onChange={(e) => {
                                  const updatedProducts = products.map((p) =>
                                    p.id === product.id ? { ...p, name: e.target.value } : p
                                  );
                                  setProducts(updatedProducts);
                                }}
                                onBlur={() => handleInlineUpdateProduct(product.id, 'name', product.name)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleInlineUpdateProduct(product.id, 'name', product.name);
                                  }
                                }}
                                autoFocus
                                className="form-control form-control-sm"
                              />
                            ) : (
                              product.name
                            )}
                          </Card.Title>
                          <Card.Text className="mb-1">
                            <span className="fw-semibold">Harga:</span> Rp
                            {editingProductId === product.id && editingField === 'price' ? (
                              <input
                                type="number"
                                value={product.price}
                                onChange={(e) => {
                                  const updatedProducts = products.map((p) =>
                                    p.id === product.id ? { ...p, price: Number(e.target.value) } : p
                                  );
                                  setProducts(updatedProducts);
                                }}
                                onBlur={() => handleInlineUpdateProduct(product.id, 'price', product.price)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleInlineUpdateProduct(product.id, 'price', product.price);
                                  }
                                }}
                                autoFocus
                                className="form-control form-control-sm d-inline-block w-50"
                              />
                            ) : (
                              product.price.toLocaleString()
                            )}
                          </Card.Text>
                          <Card.Text className="mb-1">
                            <span className="fw-semibold">Stok:</span>
                            {editingProductId === product.id && editingField === 'stock' ? (
                              <input
                                type="number"
                                value={product.stock}
                                onChange={(e) => {
                                  const updatedProducts = products.map((p) =>
                                    p.id === product.id ? { ...p, stock: Number(e.target.value) } : p
                                  );
                                  setProducts(updatedProducts);
                                }}
                                onBlur={() => handleInlineUpdateProduct(product.id, 'stock', product.stock)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleInlineUpdateProduct(product.id, 'stock', product.stock);
                                  }
                                }}
                                autoFocus
                                className="form-control form-control-sm d-inline-block w-25"
                              />
                            ) : (
                              product.stock
                            )}
                            {product.stock <= LOW_STOCK_THRESHOLD && (
                              <span className="ms-2 badge bg-danger">Stok Rendah!</span>
                            )}
                          </Card.Text>
                          <div className="d-flex justify-content-between mt-3">
                            <Button variant="primary" onClick={() => addToCart(product)}><CartPlus /></Button>
                            <div>
                              <Button variant="warning" className="ms-2" onClick={() => handleEditClick(product)}><PencilSquare /></Button>
                              <Button variant="danger" className="ms-2" onClick={() => handleDeleteProduct(product.id)}><Trash /></Button>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))
              )}
            </Row>

            <h2 className="mt-5 mb-3 text-primary">Keranjang Belanja</h2>
            <div className={`cart-section p-3 border rounded ${cartAnimationTrigger ? 'animate-cart' : ''}`}> {/* Add padding, border, and rounded corners */}
              {cart.length === 0 ? (
                <p className="fade-in text-muted">Keranjang kosong. Tambahkan produk untuk memulai transaksi.</p>
              ) : (
                <Row className="fade-in">
                  <Col>
                    <table className="table table-striped table-hover align-middle"> {/* Add table-hover and align-middle */}
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
                              <Button variant="outline-primary" size="sm" onClick={() => decreaseQuantity(item.id)}>-</Button>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => {
                                  const newQuantity = Number(e.target.value);
                                  if (newQuantity >= 1) {
                                    setCart(prevCart =>
                                      prevCart.map(cartItem =>
                                        cartItem.id === item.id ? { ...cartItem, quantity: newQuantity } : cartItem
                                      )
                                    );
                                  }
                                }}
                                className="form-control d-inline-block mx-2 text-center" style={{ width: '60px' }}
                              />
                              <Button variant="outline-primary" size="sm" onClick={() => increaseQuantity(item.id)}>+</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                      <Button variant="outline-danger" onClick={() => setCart([])}>Bersihkan Keranjang</Button>
                      <h3>Total: <span className="text-success">Rp{total.toLocaleString()}</span></h3>
                    </div>
                    <div className="d-flex justify-content-end mt-3">
                      <label htmlFor="discountInput" className="form-label me-2 fw-semibold">Diskon (%):</label>
                      <input
                        type="number"
                        id="discountInput"
                        className="form-control w-25 me-3"
                        value={discount}
                        onChange={(e) => setDiscount(Number(e.target.value))}
                        min="0"
                        max="100"
                      />
                    </div>
                    <div className="d-flex justify-content-end mt-3">
                      <select
                        className="form-select w-25 me-2"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      >
                        <option value="Cash">Tunai</option>
                        <option value="Credit Card">Kartu Kredit</option>
                        <option value="Debit Card">Kartu Debit</option>
                        <option value="QRIS">QRIS</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Jumlah Bayar"
                        className="form-control w-25 me-2"
                        value={paymentAmount === 0 ? '' : paymentAmount}
                        onChange={(e) => setPaymentAmount(Number(e.target.value))}
                      />
                      <Button variant="success" onClick={handlePayment} disabled={cart.length === 0 || paymentAmount < total}>Bayar</Button>
                    </div>
                    {change !== null && (
                      <h4 className="text-end mt-3 text-success">Kembalian: Rp{change.toLocaleString()}</h4>
                    )}
                  </Col>
                </Row>
              )}
            </div>

            <h2 className="mt-5 mb-3 text-primary">Produk Stok Rendah</h2>
            {lowStockProducts.length === 0 ? (
              <p className="text-muted">Tidak ada produk dengan stok rendah.</p>
            ) : (
              <Row>
                <Col>
                  <table className="table table-striped table-danger table-hover align-middle">
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
          </Tab.Pane>

          <Tab.Pane eventKey="product-management" className="p-3 border rounded">
            <h2 className="mt-3 mb-4 text-primary">Manajemen Produk</h2>
            <Row className="mb-4">
              <Col>
                <Card className="shadow-sm">
                  <Card.Body>
                    <Card.Title className="mb-4 fw-bold">Tambah/Edit Produk</Card.Title>
                    <div className="mb-3">
                      <label htmlFor="productId" className="form-label fw-semibold">ID Produk</label>
                      <input type="text" className={`form-control ${formErrors.newProductId ? 'is-invalid' : ''}`} id="productId" value={newProductId} onChange={(e) => {setNewProductId(e.target.value); setFormErrors(prev => { const { newProductId, ...rest } = prev; return rest; });}} placeholder="Contoh: P006" disabled={!!editingProduct} />
                      {formErrors.newProductId && <div className="invalid-feedback">{formErrors.newProductId}</div>}
                    </div>
                    <div className="mb-3">
                      <label htmlFor="productName" className="form-label fw-semibold">Nama Produk</label>
                      <input type="text" className={`form-control ${formErrors.newProductName ? 'is-invalid' : ''}`} id="productName" value={newProductName} onChange={(e) => {setNewProductName(e.target.value); setFormErrors(prev => { const { newProductName, ...rest } = prev; return rest; });}} placeholder="Contoh: Sabun Mandi" />
                      {formErrors.newProductName && <div className="invalid-feedback">{formErrors.newProductName}</div>}
                    </div>
                    <div className="mb-3">
                      <label htmlFor="productPrice" className="form-label fw-semibold">Harga</label>
                      <input type="number" className={`form-control ${formErrors.newProductPrice ? 'is-invalid' : ''}`} id="productPrice" value={newProductPrice === 0 ? '' : newProductPrice} onChange={(e) => {setNewProductPrice(Number(e.target.value)); setFormErrors(prev => { const { newProductPrice, ...rest } = prev; return rest; });}} placeholder="Contoh: 5000" />
                      {formErrors.newProductPrice && <div className="invalid-feedback">{formErrors.newProductPrice}</div>}
                    </div>
                    <div className="mb-3">
                      <label htmlFor="productStock" className="form-label fw-semibold">Stok</label>
                      <input type="number" className={`form-control ${formErrors.newProductStock ? 'is-invalid' : ''}`} id="productStock" value={newProductStock === 0 ? '' : newProductStock} onChange={(e) => {setNewProductStock(Number(e.target.value)); setFormErrors(prev => { const { newProductStock, ...rest } = prev; return rest; });}} placeholder="Contoh: 100" />
                      {formErrors.newProductStock && <div className="invalid-feedback">{formErrors.newProductStock}</div>}
                    </div>
                    <div className="mb-4">
                      <label htmlFor="productBarcode" className="form-label fw-semibold">Barcode (Opsional)</label>
                      <input type="text" className="form-control" id="productBarcode" value={newProductBarcode} onChange={(e) => setNewProductBarcode(e.target.value)} placeholder="Contoh: 1234567890" />
                    </div>
                    {editingProduct ? (
                      <>
                        <Button variant="warning" onClick={handleUpdateProduct} className="me-2">Update Produk</Button>
                        <Button variant="secondary" onClick={handleCancelEdit}>Batal Edit</Button>
                      </>
                    ) : (
                      <Button variant="success" onClick={handleAddProduct}>Tambah Produk</Button>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Tab.Pane>

          <Tab.Pane eventKey="reports" className="p-3 border rounded">
            <h2 className="mt-3 mb-4 text-primary">Laporan Penjualan</h2>
            <Row className="mb-4">
              <Col>
                <Card className="shadow-sm">
                  <Card.Body>
                    <Card.Title className="mb-3 fw-bold">Ringkasan Penjualan</Card.Title>
                    <p className="lead">Total Pendapatan: <span className="fw-bold text-success">Rp{transactions.reduce((acc, trx) => acc + trx.total_amount, 0).toLocaleString()}</span></p>
                    <Button variant="danger" onClick={handleResetTransactions}>Reset Laporan</Button>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <h2 className="mt-5 mb-4 text-primary">Laporan Penjualan Harian</h2>
            <Row className="mb-4 align-items-end">
              <Col md={4}>
                <label htmlFor="reportDate" className="form-label fw-semibold">Pilih Tanggal:</label>
                <input
                  type="date"
                  id="reportDate"
                  className="form-control"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                />
              </Col>
              <Col md={4}>
                <Button onClick={fetchDailySales} className="w-100">Lihat Laporan Harian</Button>
              </Col>
            </Row>
            {dailySalesLoading ? (
              <div className="text-center my-3">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Memuat...</span>
                </div>
                <p className="mt-2 text-muted">Memuat laporan harian...</p>
              </div>
            ) : (dailySales.length > 0 ? (
              <Row>
                <Col>
                  <table className="table table-striped table-hover align-middle">
                    <thead>
                      <tr>
                        <th>Tanggal</th>
                        <th>Total Penjualan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailySales.map((report, index) => (
                        <tr key={index}>
                          <td>{report.sale_date}</td>
                          <td>Rp{report.total_sales.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Col>
              </Row>
            ) : (
              <p className="text-muted">Tidak ada data penjualan harian untuk tanggal ini.</p>
            ))}

            <h2 className="mt-5 mb-4 text-primary">Produk Terlaris</h2>
            <Row className="mb-4 align-items-end">
              <Col md={4}>
                <label htmlFor="topProductsLimit" className="form-label fw-semibold">Jumlah Produk:</label>
                <input
                  type="number"
                  id="topProductsLimit"
                  className="form-control"
                  value={topProductsLimit}
                  onChange={(e) => setTopProductsLimit(Number(e.target.value))}
                  min="1"
                />
              </Col>
              <Col md={4}>
                <Button onClick={fetchTopProducts} className="w-100">Lihat Produk Terlaris</Button>
              </Col>
            </Row>
            {topProductsLoading ? (
              <div className="text-center my-3">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Memuat...</span>
                </div>
                <p className="mt-2 text-muted">Memuat produk terlaris...</p>
              </div>
            ) : (topProducts.length > 0 ? (
              <Row>
                <Col>
                  <table className="table table-striped table-hover align-middle">
                    <thead>
                      <tr>
                        <th>Nama Produk</th>
                        <th>Total Kuantitas Terjual</th>
                        <th>Total Pendapatan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProducts.map((product, index) => (
                        <tr key={index}>
                          <td>{product.product_name}</td>
                          <td>{product.total_quantity_sold}</td>
                          <td>Rp{product.total_revenue.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Col>
              </Row>
            ) : (
              <p className="text-muted">Tidak ada data produk terlaris.</p>
            ))}

            <h2 className="mt-5 mb-4 text-primary">Riwayat Transaksi</h2>
            <Row className="mb-4 align-items-end">
              <Col md={4}>
                <label htmlFor="startDate" className="form-label fw-semibold">Tanggal Mulai:</label>
                <input
                  type="date"
                  id="startDate"
                  className="form-control"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                />
              </Col>
              <Col md={4}>
                <label htmlFor="endDate" className="form-label fw-semibold">Tanggal Akhir:</label>
                <input
                  type="date"
                  id="endDate"
                  className="form-control"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                />
              </Col>
              <Col md={4}>
                <Button onClick={fetchTransactions} disabled={loading} className="w-100">Filter Transaksi</Button>
              </Col>
            </Row>
            {loading ? (
              <div className="text-center my-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Memuat...</span>
                </div>
                <p className="mt-2 text-muted">Memuat transaksi...</p>
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-muted">Belum ada transaksi.</p>
            ) : (
              <Row>
                <Col>
                  <table className="table table-striped table-hover align-middle">
                    <thead>
                      <tr>
                        <th>ID Transaksi</th>
                        <th>Waktu</th>
                        <th>Total</th>
                        <th>Dibayar</th>
                        <th>Kembalian</th>
                        <th>Metode Pembayaran</th>
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
                          <td>{transaction.payment_method}</td>
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
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>

      <ReceiptModal
        show={showReceiptModal}
        onHide={() => setShowReceiptModal(false)}
        transaction={currentTransaction}
      />
      <ToastContainer />
    </Container>
  );
}

export default App;