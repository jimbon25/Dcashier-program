import React from 'react';
import { Nav, Button } from 'react-bootstrap';
import {
  House,
  Box,
  Tags,
  People,
  Receipt,
  Sun,
  Moon,
  BoxArrowRight,
  CashStack,
  ClipboardData
} from 'react-bootstrap-icons';

export interface SidebarProps {
  activeKey: string;
  onSelect: (key: string | null) => void;
  theme: string;
  toggleTheme: () => void;
  isAuthenticated: boolean;
  handleLogout: () => void;
  userRole: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeKey,
  onSelect,
  theme,
  toggleTheme,
  isAuthenticated,
  handleLogout,
  userRole
}) => {
  return (
    <Nav
      className="flex-column bg-secondary vh-100 p-3 sticky-top"
      style={{ width: '200px', height: '100vh' }}
      activeKey={activeKey}
      onSelect={onSelect}
    >
      <h4 className="text-primary mb-4">D'Cashier</h4>
      
      <Nav.Item>
        <Nav.Link eventKey="dashboard" className="d-flex align-items-center">
          <House className="me-2" /> Dashboard
        </Nav.Link>
      </Nav.Item>

      <Nav.Item>
        <Nav.Link eventKey="cashier" className="d-flex align-items-center">
          <CashStack className="me-2" /> Cashier
        </Nav.Link>
      </Nav.Item>

      {userRole === 'admin' && (
        <Nav.Item>
          <Nav.Link eventKey="product-management" className="d-flex align-items-center">
            <Box className="me-2" /> Products
          </Nav.Link>
        </Nav.Item>
      )}

      {userRole === 'admin' && (
        <Nav.Item>
          <Nav.Link eventKey="category-management" className="d-flex align-items-center">
            <Tags className="me-2" /> Categories
          </Nav.Link>
        </Nav.Item>
      )}

      {userRole === 'admin' && (
        <Nav.Item>
          <Nav.Link eventKey="user-management" className="d-flex align-items-center">
            <People className="me-2" /> Users
          </Nav.Link>
        </Nav.Item>
      )}

      <Nav.Item>
        <Nav.Link eventKey="transactions" className="d-flex align-items-center">
          <ClipboardData className="me-2" /> History
        </Nav.Link>
      </Nav.Item>

      <Nav.Item>
        <Nav.Link eventKey="reports" className="d-flex align-items-center">
          <Receipt className="me-2" /> Reports
        </Nav.Link>
      </Nav.Item>

      <div className="mt-auto">
        <Button
          variant="outline-primary"
          size="sm"
          className="w-100 mb-2"
          onClick={toggleTheme}
        >
          {theme === 'light' ? <Moon className="me-2" /> : <Sun className="me-2" />}
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </Button>

        {isAuthenticated && (
          <Button
            variant="outline-danger"
            size="sm"
            className="w-100"
            onClick={handleLogout}
          >
            <BoxArrowRight className="me-2" /> Logout
          </Button>
        )}
      </div>
    </Nav>
  );
};

export default Sidebar;
