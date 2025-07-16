import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { CheckCircleFill } from 'react-bootstrap-icons'; // Import ikon centang

const ReceiptModal = ({ show, onHide, transaction }: any) => {
  if (!transaction) {
    return null;
  }

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Receipt</Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center">
        <CheckCircleFill size={50} className="text-success mb-3" />
        <h4>Pembayaran Berhasil!</h4>
        <p><strong>Transaction ID:</strong> {transaction.id}</p>
        <p><strong>Total:</strong> Rp{transaction.total_amount.toLocaleString()}</p>
        {transaction.discount > 0 && <p><strong>Diskon:</strong> Rp{transaction.discount.toLocaleString()}</p>}
        <p><strong>Payment:</strong> Rp{transaction.payment_amount.toLocaleString()}</p>
        <p><strong>Change:</strong> Rp{transaction.change_amount.toLocaleString()}</p>
        <p><strong>Metode Pembayaran:</strong> {transaction.payment_method}</p>
        <h5 className="mt-4">Items:</h5>
        <ul className="list-unstyled">
          {transaction.items.map((item: any) => (
            <li key={item.product_id}>
              {item.product_name} - {item.quantity} x Rp{item.price_at_sale.toLocaleString()}
            </li>
          ))}
        </ul>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ReceiptModal;
