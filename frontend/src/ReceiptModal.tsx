import React from 'react';
import { Modal, Button } from 'react-bootstrap';

interface ReceiptItem {
  product_name: string;
  price_at_sale: number;
  quantity: number;
}

interface ReceiptModalProps {
  show: boolean;
  onHide: () => void;
  transaction: {
    id: string;
    timestamp: number;
    total_amount: number;
    payment_amount: number;
    change_amount: number;
    items: ReceiptItem[];
  } | null;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ show, onHide, transaction }) => {
  if (!transaction) {
    return null;
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Struk Belanja - {transaction.id}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="receipt-content">
          <p><strong>Toko Dyka Akbar</strong></p>
          <p>Tanggal: {new Date(transaction.timestamp).toLocaleString()}</p>
          <hr />
          <h6>Detail Belanja:</h6>
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Produk</th>
                <th className="text-end">Harga</th>
                <th className="text-end">Qty</th>
                <th className="text-end">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {transaction.items.map((item, index) => (
                <tr key={index}>
                  <td>{item.product_name}</td>
                  <td className="text-end">Rp{item.price_at_sale.toLocaleString()}</td>
                  <td className="text-end">{item.quantity}</td>
                  <td className="text-end">Rp{(item.price_at_sale * item.quantity).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <hr />
          <p className="text-end">Total Belanja: <strong>Rp{transaction.total_amount.toLocaleString()}</strong></p>
          <p className="text-end">Jumlah Bayar: <strong>Rp{transaction.payment_amount.toLocaleString()}</strong></p>
          <p className="text-end">Kembalian: <strong>Rp{transaction.change_amount.toLocaleString()}</strong></p>
          <hr />
          <p className="text-center">Terima Kasih Telah Berbelanja!</p>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Tutup</Button>
        <Button variant="primary" onClick={handlePrint}>Cetak Struk</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ReceiptModal;
