import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Table, Badge, Button, Row, Col, Form, Alert, Modal } from 'react-bootstrap';
import { Eye, Calendar, Receipt, Trash } from 'react-bootstrap-icons';
import { toast } from 'react-toastify';
import { buildApiUrl } from '../config/api';

interface TransactionItem {
  id: number;
  transaction_id: string;
  product_id: string;
  product_name: string;
  price_at_sale: number;
  cost_price_at_sale?: number;
  quantity: number;
}

interface Transaction {
  id: string;
  timestamp: number;
  total_amount: number;
  payment_amount: number;
  change_amount: number;
  discount?: number;
  payment_method: string;
  items: TransactionItem[];
}

const TransactionHistoryPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      let url = buildApiUrl('/transactions');
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
      if (!response.ok) throw new Error('Failed to fetch transactions');
      
      const data = await response.json();
      const transactionsList = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      setTransactions(transactionsList);
    } catch (error: any) {
      toast.error('Gagal memuat riwayat transaksi: ' + error.message);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [filterStartDate, filterEndDate]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleFilter = () => {
    fetchTransactions();
  };

  const handleResetFilter = () => {
    setFilterStartDate('');
    setFilterEndDate('');
    setTimeout(() => {
      fetchTransactions();
    }, 100);
  };

  const showTransactionDetail = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailModal(true);
  };

  const deleteTransaction = async (transactionId: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
      return;
    }

    try {
      const response = await fetch(buildApiUrl(`/transactions/${transactionId}`), {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete transaction');

      toast.success('Transaksi berhasil dihapus');
      fetchTransactions();
    } catch (error: any) {
      toast.error('Gagal menghapus transaksi: ' + error.message);
    }
  };

  const resetAllTransactions = async () => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus SEMUA transaksi? Tindakan ini tidak dapat dibatalkan!')) {
      return;
    }

    try {
      const response = await fetch(buildApiUrl('/transactions/reset'), {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to reset transactions');

      toast.success('Semua transaksi berhasil dihapus');
      fetchTransactions();
    } catch (error: any) {
      toast.error('Gagal menghapus semua transaksi: ' + error.message);
    }
  };

  const totalRevenue = transactions.reduce((sum, trx) => sum + trx.total_amount, 0);
  const totalTransactions = transactions.length;

  return (
    <Container fluid className="p-4">
      <Card>
        <Card.Header>
          <Row className="align-items-center">
            <Col>
              <h4><Receipt /> Riwayat Transaksi</h4>
            </Col>
            <Col xs="auto">
              <Button 
                variant="danger" 
                size="sm"
                onClick={resetAllTransactions}
              >
                <Trash /> Reset Semua
              </Button>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body>
          {/* Filter Section */}
          <Card className="mb-4">
            <Card.Body>
              <Row className="align-items-end">
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Dari Tanggal</Form.Label>
                    <Form.Control
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Sampai Tanggal</Form.Label>
                    <Form.Control
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Button variant="primary" onClick={handleFilter}>
                    <Calendar /> Filter
                  </Button>
                  <Button variant="secondary" className="ms-2" onClick={handleResetFilter}>
                    Reset
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Summary Cards */}
          <Row className="mb-4">
            <Col md={6}>
              <Card className="bg-primary text-white">
                <Card.Body>
                  <h5>Total Transaksi</h5>
                  <h3>{totalTransactions}</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="bg-success text-white">
                <Card.Body>
                  <h5>Total Pendapatan</h5>
                  <h3>Rp {totalRevenue.toLocaleString()}</h3>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Transactions Table */}
          {loading ? (
            <div className="text-center">Loading...</div>
          ) : transactions.length === 0 ? (
            <Alert variant="info">Tidak ada transaksi ditemukan</Alert>
          ) : (
            <Table responsive striped hover>
              <thead>
                <tr>
                  <th>ID Transaksi</th>
                  <th>Tanggal</th>
                  <th>Total</th>
                  <th>Pembayaran</th>
                  <th>Kembalian</th>
                  <th>Metode</th>
                  <th>Items</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>
                      <code>{transaction.id}</code>
                    </td>
                    <td>
                      {new Date(transaction.timestamp).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td>
                      <strong>Rp {transaction.total_amount.toLocaleString()}</strong>
                    </td>
                    <td>
                      Rp {transaction.payment_amount.toLocaleString()}
                    </td>
                    <td>
                      Rp {transaction.change_amount.toLocaleString()}
                    </td>
                    <td>
                      <Badge bg="secondary">{transaction.payment_method}</Badge>
                    </td>
                    <td>
                      <Badge bg="info">{transaction.items.length} item(s)</Badge>
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => showTransactionDetail(transaction)}
                      >
                        <Eye />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => deleteTransaction(transaction.id)}
                      >
                        <Trash />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Transaction Detail Modal */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Detail Transaksi</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTransaction && (
            <div>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>ID Transaksi:</strong> {selectedTransaction.id}
                </Col>
                <Col md={6}>
                  <strong>Tanggal:</strong> {new Date(selectedTransaction.timestamp).toLocaleString('id-ID')}
                </Col>
              </Row>
              
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Metode Pembayaran:</strong> {selectedTransaction.payment_method}
                </Col>
                <Col md={6}>
                  <strong>Diskon:</strong> {selectedTransaction.discount || 0}%
                </Col>
              </Row>

              <h5>Detail Item:</h5>
              <Table striped>
                <thead>
                  <tr>
                    <th>Produk</th>
                    <th>Harga</th>
                    <th>Qty</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTransaction.items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.product_name}</td>
                      <td>Rp {item.price_at_sale.toLocaleString()}</td>
                      <td>{item.quantity}</td>
                      <td>Rp {(item.price_at_sale * item.quantity).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              <div className="border-top pt-3">
                <Row>
                  <Col md={6}>
                    <strong>Total:</strong> Rp {selectedTransaction.total_amount.toLocaleString()}
                  </Col>
                  <Col md={6}>
                    <strong>Pembayaran:</strong> Rp {selectedTransaction.payment_amount.toLocaleString()}
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <strong>Kembalian:</strong> Rp {selectedTransaction.change_amount.toLocaleString()}
                  </Col>
                </Row>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
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

export default TransactionHistoryPage;
