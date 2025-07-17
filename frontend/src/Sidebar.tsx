import React from 'react';
import { Nav, Button } from 'react-bootstrap';
import { HouseDoorFill, CartFill, InboxesFill, FileEarmarkBarGraphFill, TagsFill, SunFill, MoonFill, BoxArrowRight, GearFill, PeopleFill } from 'react-bootstrap-icons';

interface SidebarProps {
  activeKey: string;
  onSelect: (eventKey: string | null) => void;
  theme: string;
  toggleTheme: () => void;
  isLoggedIn: boolean;
  handleLogout: () => void;
  userRole: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({ activeKey, onSelect, theme, toggleTheme, isLoggedIn, handleLogout, userRole }) => {
  return (
    <Nav className="flex-column bg-secondary vh-100 p-3 sticky-top" activeKey={activeKey} onSelect={onSelect} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div className="text-center mb-4">
        <h4 className="text-primary fw-bold">Dcashier-Pos</h4>
      </div>
      <div>
        <Nav.Link eventKey="dashboard" className="mb-2 sidebar-nav-link d-flex align-items-center">
          <HouseDoorFill className="me-2" size={20} /><span style={{ whiteSpace: 'nowrap' }}>Dashboard</span>
        </Nav.Link>
        <Nav.Link eventKey="sales" className="mb-2 sidebar-nav-link d-flex align-items-center">
          <CartFill className="me-2" size={20} /><span style={{ whiteSpace: 'nowrap' }}>Penjualan</span>
        </Nav.Link>
        {userRole === 'admin' && (
          <>
            <Nav.Link eventKey="product-management" className="mb-2 sidebar-nav-link d-flex align-items-center">
              <InboxesFill className="me-2" size={20} /><span style={{ whiteSpace: 'nowrap' }}>Manajemen Produk</span>
            </Nav.Link>
            <Nav.Link eventKey="category-management" className="mb-2 sidebar-nav-link d-flex align-items-center">
              <TagsFill className="me-2" size={20} /><span style={{ whiteSpace: 'nowrap' }}>Manajemen Kategori</span>
            </Nav.Link>
            <Nav.Link eventKey="user-management" className="mb-2 sidebar-nav-link d-flex align-items-center">
              <PeopleFill className="me-2" size={20} /><span style={{ whiteSpace: 'nowrap' }}>Manajemen Pengguna</span>
            </Nav.Link>
            <Nav.Link eventKey="reports" className="mb-2 sidebar-nav-link d-flex align-items-center">
              <FileEarmarkBarGraphFill className="me-2" size={20} /><span style={{ whiteSpace: 'nowrap' }}>Laporan</span>
            </Nav.Link>
          </>
        )}
        <Nav.Link eventKey="settings" className="mb-2 sidebar-nav-link d-flex align-items-center">
          <GearFill className="me-2" size={20} /><span style={{ whiteSpace: 'nowrap' }}>Pengaturan</span>
        </Nav.Link>
      </div>
      <div className="mt-auto d-flex flex-row justify-content-center align-items-center">
        <Button variant="light" onClick={toggleTheme} className="rounded-circle p-1 me-2" style={{ width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {theme === 'light' ? <MoonFill size={18} /> : <SunFill size={18} />}
        </Button>
        {isLoggedIn && (
          <Button variant="outline-danger" onClick={handleLogout} className="rounded-circle p-1" style={{ width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BoxArrowRight size={18} />
          </Button>
        )}
      </div>
    </Nav>
  );
};

export default Sidebar;
