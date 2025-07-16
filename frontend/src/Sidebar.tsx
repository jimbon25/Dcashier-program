import React from 'react';
import { Nav } from 'react-bootstrap';
import { HouseDoorFill, CartFill, InboxesFill, FileEarmarkBarGraphFill } from 'react-bootstrap-icons';

interface SidebarProps {
  activeKey: string;
  onSelect: (eventKey: string | null) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeKey, onSelect }) => {
  return (
    <Nav className="flex-column bg-light vh-100 p-3 sticky-top" activeKey={activeKey} onSelect={onSelect}>
      <Nav.Link eventKey="dashboard" className="d-flex align-items-center mb-2">
        <HouseDoorFill className="me-2" /> Dashboard
      </Nav.Link>
      <Nav.Link eventKey="sales" className="d-flex align-items-center mb-2">
        <CartFill className="me-2" /> Penjualan
      </Nav.Link>
      <Nav.Link eventKey="product-management" className="d-flex align-items-center mb-2">
        <InboxesFill className="me-2" /> Manajemen Produk
      </Nav.Link>
      <Nav.Link eventKey="reports" className="d-flex align-items-center mb-2">
        <FileEarmarkBarGraphFill className="me-2" /> Laporan
      </Nav.Link>
    </Nav>
  );
};

export default Sidebar;
