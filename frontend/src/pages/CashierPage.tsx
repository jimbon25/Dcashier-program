import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Modal, Table, InputGroup } from 'react-bootstrap';
import { CartPlus, Trash, Search, Calculator, CreditCard } from 'react-bootstrap-icons';
import { toast } from 'react-toastify';
import { buildApiUrl } from '../config/api';

interface Product {
  id: string;
  name: string;
  price: number;
  cost_price?: number;
  stock: number;
  barcode?: string;
  category_id?: string;
  category_name?: string;
  image_url?: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface Transaction {
  id: string;
  timestamp: number;
  total_amount: number;
  payment_amount: number;
  change_amount: number;
  discount?: number;
  items: {
    product_id: string;
    product_name: string;
    price_at_sale: number;
    cost_price_at_sale?: number;
    quantity: number;
  }[];
  payment_method: string;
}

const CashierPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  
  // Payment states
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);

  // Load products
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(buildApiUrl('/products'));
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      const productsList = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      setProducts(productsList);
    } catch (error: any) {
      toast.error('Gagal memuat produk: ' + error.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      toast.error('Stok produk tidak tersedia');
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          toast.error('Stok tidak mencukupi');
          return prevCart;
        }
        return prevCart.map(item =>
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
    toast.success(`${product.name} ditambahkan ke keranjang`);
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find(p => p.id === productId);
    if (product && newQuantity > product.stock) {
      toast.error('Stok tidak mencukupi');
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const handleBarcodeSearch = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && barcodeInput.trim()) {
      try {
        const response = await fetch(buildApiUrl(`/products/barcode/${barcodeInput}`));
        if (!response.ok) throw new Error('Produk tidak ditemukan');
        const product = await response.json();
        addToCart(product);
        setBarcodeInput('');
      } catch (error: any) {
        toast.error('Produk dengan barcode tersebut tidak ditemukan');
      }
    }
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = (subtotal * discount) / 100;
    return subtotal - discountAmount;
  };

  const handlePayment = async () => {
    const total = calculateTotal();
    if (paymentAmount < total) {
      toast.error('Jumlah pembayaran kurang');
      return;
    }

    const changeAmount = paymentAmount - total;
    const transactionData = {
      total_amount: total,
      payment_amount: paymentAmount,
      change_amount: changeAmount,
      discount: discount,
      payment_method: paymentMethod,
      items: cart.map(item => ({
        product_id: item.id,
        product_name: item.name,
        price_at_sale: item.price,
        cost_price_at_sale: item.cost_price || 0,
        quantity: item.quantity
      }))
    };

    try {
      const response = await fetch(buildApiUrl('/transactions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData)
      });

      if (!response.ok) throw new Error('Gagal menyimpan transaksi');

      const result = await response.json();
      
      // Create transaction object for receipt
      const transaction: Transaction = {
        id: result.transactionId,
        timestamp: result.timestamp,
        total_amount: total,
        payment_amount: paymentAmount,
        change_amount: changeAmount,
        discount: discount,
        items: transactionData.items,
        payment_method: paymentMethod
      };

      setCurrentTransaction(transaction);
      setShowPaymentModal(false);
      setShowReceiptModal(true);
      
      // Reset cart and forms
      setCart([]);
      setPaymentAmount(0);
      setDiscount(0);
      
      toast.success('Transaksi berhasil disimpan!');
      
      // Refresh products to update stock
      fetchProducts();
      
    } catch (error: any) {
      toast.error('Gagal menyimpan transaksi: ' + error.message);
    }
  };

  const filteredProducts = Array.isArray(products) ? products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.includes(searchTerm)
  ) : [];

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal - discountAmount;

  return (
    <Container fluid className="p-4">
      <Row>
        <Col md={8}>
          <Card>
            <Card.Header>
              <h4>Daftar Produk</h4>
              <Row className="mt-3">
                <Col md={6}>
                  <InputGroup>
                    <InputGroup.Text><Search /></InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Cari produk..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                </Col>
                <Col md={6}>
                  <InputGroup>
                    <InputGroup.Text><Search /></InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Scan barcode..."
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      onKeyDown={handleBarcodeSearch}
                    />
                  </InputGroup>
                </Col>
              </Row>
            </Card.Header>
            <Card.Body style={{ height: '70vh', overflowY: 'auto' }}>
              {loading ? (
                <div className="text-center">Loading...</div>
              ) : (
                <Row>
                  {filteredProducts.map(product => (
                    <Col md={4} key={product.id} className="mb-3">
                      <Card 
                        className="h-100 product-card"
                        style={{ cursor: 'pointer' }}
                        onClick={() => addToCart(product)}
                      >
                        {product.image_url && (
                          <Card.Img 
                            variant="top" 
                            src={`http://localhost:3001${product.image_url}`} 
                            style={{ height: '120px', objectFit: 'cover' }}
                          />
                        )}
                        <Card.Body>
                          <Card.Title className="text-truncate">{product.name}</Card.Title>
                          <Card.Text>
                            <strong>Rp {product.price.toLocaleString()}</strong><br />
                            <small className="text-muted">Stok: {product.stock}</small><br />
                            <small className="text-muted">{product.category_name}</small>
                          </Card.Text>
                          <Button 
                            variant="primary" 
                            size="sm"
                            disabled={product.stock <= 0}
                          >
                            <CartPlus /> Tambah
                          </Button>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card>
            <Card.Header>
              <h4>Keranjang Belanja</h4>
            </Card.Header>
            <Card.Body>
              {cart.length === 0 ? (
                <Alert variant="info">Keranjang kosong</Alert>
              ) : (
                <>
                  <div style={{ maxHeight: '40vh', overflowY: 'auto' }}>
                    {cart.map(item => (
                      <div key={item.id} className="d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
                        <div>
                          <div className="fw-bold">{item.name}</div>
                          <small>Rp {item.price.toLocaleString()}</small>
                        </div>
                        <div className="d-flex align-items-center">
                          <Button 
                            variant="outline-secondary" 
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            -
                          </Button>
                          <span className="mx-2">{item.quantity}</span>
                          <Button 
                            variant="outline-secondary" 
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            +
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm" 
                            className="ms-2"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <hr />
                  
                  <div className="mb-3">
                    <Form.Group>
                      <Form.Label>Diskon (%)</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        max="100"
                        value={discount}
                        onChange={(e) => setDiscount(Number(e.target.value))}
                      />
                    </Form.Group>
                  </div>

                  <div className="border-top pt-3">
                    <div className="d-flex justify-content-between">
                      <span>Subtotal:</span>
                      <span>Rp {subtotal.toLocaleString()}</span>
                    </div>
                    {discount > 0 && (
                      <div className="d-flex justify-content-between text-success">
                        <span>Diskon ({discount}%):</span>
                        <span>-Rp {discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="d-flex justify-content-between fw-bold fs-5">
                      <span>Total:</span>
                      <span>Rp {total.toLocaleString()}</span>
                    </div>
                  </div>

                  <Button 
                    variant="success" 
                    className="w-100 mt-3"
                    onClick={() => setShowPaymentModal(true)}
                  >
                    <Calculator /> Bayar
                  </Button>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Payment Modal */}
      <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Pembayaran</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <strong>Total: Rp {total.toLocaleString()}</strong>
          </div>
          
          <Form.Group className="mb-3">
            <Form.Label>Metode Pembayaran</Form.Label>
            <Form.Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="Cash">Tunai</option>
              <option value="Credit Card">Kartu Kredit</option>
              <option value="Debit Card">Kartu Debit</option>
              <option value="E-Wallet">E-Wallet</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Jumlah Pembayaran</Form.Label>
            <Form.Control
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(Number(e.target.value))}
              min={total}
            />
          </Form.Group>

          {paymentAmount > 0 && (
            <div className="mb-3">
              <strong>Kembalian: Rp {Math.max(0, paymentAmount - total).toLocaleString()}</strong>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
            Batal
          </Button>
          <Button 
            variant="primary" 
            onClick={handlePayment}
            disabled={paymentAmount < total}
          >
            <CreditCard /> Proses Pembayaran
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Receipt Modal */}
      <Modal show={showReceiptModal} onHide={() => setShowReceiptModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Struk Pembayaran</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentTransaction && (
            <div>
              <div className="text-center mb-3">
                <h5>D'Cashier</h5>
                <p>ID: {currentTransaction.id}</p>
                <p>{new Date(currentTransaction.timestamp).toLocaleString()}</p>
              </div>
              
              <Table size="sm">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Harga</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTransaction.items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.product_name}</td>
                      <td>{item.quantity}</td>
                      <td>Rp {item.price_at_sale.toLocaleString()}</td>
                      <td>Rp {(item.price_at_sale * item.quantity).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              <div className="border-top pt-2">
                <div className="d-flex justify-content-between">
                  <span>Total:</span>
                  <span>Rp {currentTransaction.total_amount.toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Bayar:</span>
                  <span>Rp {currentTransaction.payment_amount.toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between fw-bold">
                  <span>Kembalian:</span>
                  <span>Rp {currentTransaction.change_amount.toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Metode:</span>
                  <span>{currentTransaction.payment_method}</span>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReceiptModal(false)}>
            Tutup
          </Button>
          <Button variant="primary" onClick={() => window.print()}>
            Cetak
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default CashierPage;
