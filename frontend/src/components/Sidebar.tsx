import React, { useState } from 'react';
import { Nav, Button, Offcanvas } from 'react-bootstrap';
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
  ClipboardData,
  List
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleMobileMenuToggle = () => setShowMobileMenu(!showMobileMenu);
  const handleMobileMenuClose = () => setShowMobileMenu(false);

  const handleNavItemClick = (key: string | null) => {
    onSelect(key);
    handleMobileMenuClose(); // Close mobile menu when item is selected
  };

  // Desktop Sidebar
  const DesktopSidebar = () => (
    <Nav
      className="flex-column bg-secondary vh-100 p-3 sticky-top d-none d-lg-flex"
      style={{ width: '240px', height: '100vh' }}
      activeKey={activeKey}
      onSelect={handleNavItemClick}
    >
      <h4 className="text-primary mb-4 text-center">D'Cashier</h4>
      
      <Nav.Item className="mb-2">
        <Nav.Link 
          eventKey="dashboard" 
          className={`d-flex align-items-center py-3 px-3 rounded ${activeKey === 'dashboard' ? 'bg-primary text-white' : ''}`}
        >
          <House className="me-3" size={18} /> Dashboard
        </Nav.Link>
      </Nav.Item>

      <Nav.Item className="mb-2">
        <Nav.Link 
          eventKey="cashier" 
          className={`d-flex align-items-center py-3 px-3 rounded ${activeKey === 'cashier' ? 'bg-primary text-white' : ''}`}
        >
          <CashStack className="me-3" size={18} /> Kasir
        </Nav.Link>
      </Nav.Item>

      {userRole === 'admin' && (
        <Nav.Item className="mb-2">
          <Nav.Link 
            eventKey="product-management" 
            className={`d-flex align-items-center py-3 px-3 rounded ${activeKey === 'product-management' ? 'bg-primary text-white' : ''}`}
          >
            <Box className="me-3" size={18} /> Produk
          </Nav.Link>
        </Nav.Item>
      )}

      {userRole === 'admin' && (
        <Nav.Item className="mb-2">
          <Nav.Link 
            eventKey="category-management" 
            className={`d-flex align-items-center py-3 px-3 rounded ${activeKey === 'category-management' ? 'bg-primary text-white' : ''}`}
          >
            <Tags className="me-3" size={18} /> Kategori
          </Nav.Link>
        </Nav.Item>
      )}

      {userRole === 'admin' && (
        <Nav.Item className="mb-2">
          <Nav.Link 
            eventKey="user-management" 
            className={`d-flex align-items-center py-3 px-3 rounded ${activeKey === 'user-management' ? 'bg-primary text-white' : ''}`}
          >
            <People className="me-3" size={18} /> Pengguna
          </Nav.Link>
        </Nav.Item>
      )}

      <Nav.Item className="mb-2">
        <Nav.Link 
          eventKey="transactions" 
          className={`d-flex align-items-center py-3 px-3 rounded ${activeKey === 'transactions' ? 'bg-primary text-white' : ''}`}
        >
          <ClipboardData className="me-3" size={18} /> Riwayat
        </Nav.Link>
      </Nav.Item>

      <Nav.Item className="mb-2">
        <Nav.Link 
          eventKey="reports" 
          className={`d-flex align-items-center py-3 px-3 rounded ${activeKey === 'reports' ? 'bg-primary text-white' : ''}`}
        >
          <Receipt className="me-3" size={18} /> Laporan
        </Nav.Link>
      </Nav.Item>

      <div className="mt-auto pt-3">
        <Button
          variant="outline-primary"
          size="sm"
          className="w-100 mb-3 d-flex align-items-center justify-content-center"
          onClick={toggleTheme}
        >
          {theme === 'light' ? <Moon className="me-2" size={16} /> : <Sun className="me-2" size={16} />}
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </Button>
        
        <Button
          variant="outline-danger"
          size="sm"
          className="w-100 d-flex align-items-center justify-content-center"
          onClick={handleLogout}
        >
          <BoxArrowRight className="me-2" size={16} />
          Logout
        </Button>
      </div>
    </Nav>
  );

  // Mobile Top Bar and Offcanvas Menu
  const MobileNavigation = () => (
    <>
      {/* Mobile Top Bar */}
      <div className="d-flex d-lg-none bg-secondary p-3 justify-content-between align-items-center position-sticky top-0" style={{ zIndex: 1000 }}>
        <h5 className="text-primary mb-0">D'Cashier</h5>
        <Button
          variant="outline-primary"
          size="sm"
          onClick={handleMobileMenuToggle}
          className="d-flex align-items-center"
        >
          <List size={20} />
        </Button>
      </div>

      {/* Mobile Offcanvas Menu */}
      <Offcanvas 
        show={showMobileMenu} 
        onHide={handleMobileMenuClose} 
        placement="start"
        className="bg-secondary"
      >
        <Offcanvas.Header closeButton className="border-bottom">
          <Offcanvas.Title className="text-primary">D'Cashier Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">
          <Nav className="flex-column" activeKey={activeKey} onSelect={handleNavItemClick}>
            <Nav.Item>
              <Nav.Link 
                eventKey="dashboard" 
                className={`d-flex align-items-center py-3 px-4 border-bottom mobile-nav-link ${activeKey === 'dashboard' ? 'bg-primary text-white' : ''}`}
              >
                <House className="me-3" size={20} /> Dashboard
              </Nav.Link>
            </Nav.Item>

            <Nav.Item>
              <Nav.Link 
                eventKey="cashier" 
                className={`d-flex align-items-center py-3 px-4 border-bottom mobile-nav-link ${activeKey === 'cashier' ? 'bg-primary text-white' : ''}`}
              >
                <CashStack className="me-3" size={20} /> Kasir
              </Nav.Link>
            </Nav.Item>

            {userRole === 'admin' && (
              <Nav.Item>
                <Nav.Link 
                  eventKey="product-management" 
                  className={`d-flex align-items-center py-3 px-4 border-bottom mobile-nav-link ${activeKey === 'product-management' ? 'bg-primary text-white' : ''}`}
                >
                  <Box className="me-3" size={20} /> Produk
                </Nav.Link>
              </Nav.Item>
            )}

            {userRole === 'admin' && (
              <Nav.Item>
                <Nav.Link 
                  eventKey="category-management" 
                  className={`d-flex align-items-center py-3 px-4 border-bottom mobile-nav-link ${activeKey === 'category-management' ? 'bg-primary text-white' : ''}`}
                >
                  <Tags className="me-3" size={20} /> Kategori
                </Nav.Link>
              </Nav.Item>
            )}

            {userRole === 'admin' && (
              <Nav.Item>
                <Nav.Link 
                  eventKey="user-management" 
                  className={`d-flex align-items-center py-3 px-4 border-bottom mobile-nav-link ${activeKey === 'user-management' ? 'bg-primary text-white' : ''}`}
                >
                  <People className="me-3" size={20} /> Pengguna
                </Nav.Link>
              </Nav.Item>
            )}

            <Nav.Item>
              <Nav.Link 
                eventKey="transactions" 
                className={`d-flex align-items-center py-3 px-4 border-bottom mobile-nav-link ${activeKey === 'transactions' ? 'bg-primary text-white' : ''}`}
              >
                <ClipboardData className="me-3" size={20} /> Riwayat
              </Nav.Link>
            </Nav.Item>

            <Nav.Item>
              <Nav.Link 
                eventKey="reports" 
                className={`d-flex align-items-center py-3 px-4 border-bottom mobile-nav-link ${activeKey === 'reports' ? 'bg-primary text-white' : ''}`}
              >
                <Receipt className="me-3" size={20} /> Laporan
              </Nav.Link>
            </Nav.Item>
          </Nav>

          <div className="mt-auto p-3 border-top">
            <Button
              variant="outline-primary"
              size="sm"
              className="w-100 mb-3 d-flex align-items-center justify-content-center"
              onClick={toggleTheme}
              style={{ minHeight: '44px', fontSize: '16px' }}
            >
              {theme === 'light' ? <Moon className="me-2" size={18} /> : <Sun className="me-2" size={18} />}
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </Button>
            
            <Button
              variant="outline-danger"
              size="sm"
              className="w-100 d-flex align-items-center justify-content-center"
              onClick={handleLogout}
              style={{ minHeight: '44px', fontSize: '16px' }}
            >
              <BoxArrowRight className="me-2" size={18} />
              Logout
            </Button>
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );

  return (
    <>
      <DesktopSidebar />
      <MobileNavigation />
    </>
  );
};

export default Sidebar;
