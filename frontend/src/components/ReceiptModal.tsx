import React from 'react';
import { Modal, Table, Button } from 'react-bootstrap';

interface ReceiptModalProps {
  show: boolean;
  onHide: () => void;
  transaction: {
    id: string;
    timestamp: number;
    total_amount: number;
    payment_amount: number;
    change_amount: number;
    items: Array<{
      product_name: string;
      quantity: number;
      price_at_sale: number;
    }>;
  } | null;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ show, onHide, transaction }) => {
  if (!transaction) return null;

  return (
    <Modal show={show} onHide={onHide} size="sm">
      <Modal.Header closeButton>
        <Modal.Title>Receipt</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="text-center mb-3">
          <h5>D'Cashier</h5>
          <p className="mb-0">Transaction ID: {transaction.id}</p>
          <p>Date: {new Date(transaction.timestamp).toLocaleString()}</p>
        </div>
        <Table size="sm">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {transaction.items.map((item, index) => (
              <tr key={index}>
                <td>{item.product_name}</td>
                <td>{item.quantity}</td>
                <td>${item.price_at_sale.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
        <div className="mt-3">
          <div className="d-flex justify-content-between">
            <strong>Total:</strong>
            <span>${(transaction.total_amount || 0).toFixed(2)}</span>
          </div>
          <div className="d-flex justify-content-between">
            <strong>Payment:</strong>
            <span>${(transaction.payment_amount || 0).toFixed(2)}</span>
          </div>
          <div className="d-flex justify-content-between">
            <strong>Change:</strong>
            <span>${(transaction.change_amount || 0).toFixed(2)}</span>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
        <Button variant="primary" onClick={() => window.print()}>
          Print
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ReceiptModal;
