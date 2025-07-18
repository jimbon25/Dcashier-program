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
  Gear,
  BoxArrowRight
} from 'react-bootstrap-icons';
import { useDashboard } from '../context/DashboardContext';

interface SidebarProps {
  userRole?: string;
  onLogout?: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  userRole = 'cashier',
  onLogout,
  isDarkMode = false,
  onToggleDarkMode
}) => {
  const { activeTab, setActiveTab } = useDashboard();

  const menuItems = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: <House size={20} />,
      roles: ['admin', 'cashier']
    },
    {
      key: 'sales',
      label: 'Penjualan',
      icon: <Receipt size={20} />,
      roles: ['admin', 'cashier']
    },
    {
      key: 'product-management',
      label: 'Kelola Produk',
      icon: <Box size={20} />,
      roles: ['admin']
    },
    {
      key: 'category-management',
      label: 'Kelola Kategori',
      icon: <Tags size={20} />,
      roles: ['admin']
    },
    {
      key: 'user-management',
      label: 'Kelola Pengguna',
      icon: <People size={20} />,
      roles: ['admin']
    },
    {
      key: 'reports',
      label: 'Laporan',
      icon: <Receipt size={20} />,
      roles: ['admin']
    },
    {
      key: 'settings',
      label: 'Pengaturan',
      icon: <Gear size={20} />,
      roles: ['admin']
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(userRole)
  );

  return (
    <div className="sidebar bg-dark text-light p-3" style={{ minHeight: '100vh', width: '250px' }}>
      <div className="sidebar-header mb-4">
        <h4 className="text-center">D'Cashier</h4>
        <hr className="text-light" />
      </div>

      <Nav className="flex-column">
        {filteredMenuItems.map(item => (
          <Nav.Item key={item.key} className="mb-2">
            <Nav.Link
              className={`text-light d-flex align-items-center p-3 rounded ${
                activeTab === item.key ? 'bg-primary' : ''
              }`}
              onClick={() => setActiveTab(item.key)}
              style={{ cursor: 'pointer' }}
            >
              <span className="me-3">{item.icon}</span>
              {item.label}
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>

      <div className="mt-auto pt-4">
        <hr className="text-light" />
        
        <div className="d-flex align-items-center justify-content-between mb-3">
          <span className="small">Dark Mode</span>
          <Button
            variant={isDarkMode ? 'warning' : 'outline-warning'}
            size="sm"
            onClick={onToggleDarkMode}
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </Button>
        </div>

        <Button
          variant="outline-danger"
          className="w-100 d-flex align-items-center justify-content-center"
          onClick={onLogout}
        >
          <BoxArrowRight size={16} className="me-2" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
