import React from 'react';
import { Card, Col } from 'react-bootstrap';

const ProductSkeleton = () => {
  return (
    <Col sm={6} md={4} lg={3} className="mb-4">
      <Card className="skeleton-card">
        <Card.Body>
          <div className="skeleton-line short"></div>
          <div className="skeleton-line medium"></div>
          <div className="skeleton-line long"></div>
          <div className="skeleton-button"></div>
        </Card.Body>
      </Card>
    </Col>
  );
};

export default ProductSkeleton;
