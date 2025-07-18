import React from 'react';
import { Card, Placeholder } from 'react-bootstrap';

const ProductSkeleton: React.FC = () => {
  return (
    <Card className="h-100">
      <Placeholder as={Card.Img} variant="top" style={{ height: '200px' }} />
      <Card.Body>
        <Placeholder as={Card.Title} animation="glow">
          <Placeholder xs={6} />
        </Placeholder>
        <Placeholder as={Card.Text} animation="glow">
          <Placeholder xs={7} /> <Placeholder xs={4} /> <Placeholder xs={4} />{' '}
          <Placeholder xs={6} /> <Placeholder xs={8} />
        </Placeholder>
        <div className="d-flex justify-content-between mt-3">
          <Placeholder.Button variant="primary" xs={4} />
          <Placeholder.Button variant="secondary" xs={4} />
        </div>
      </Card.Body>
    </Card>
  );
};

export default ProductSkeleton;
