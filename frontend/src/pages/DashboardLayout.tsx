import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { Outlet, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Sidebar from '../components/Sidebar';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import ErrorBoundary from '../components/ErrorBoundary';
import 'react-toastify/dist/ReactToastify.css';
import { useDashboard } from '../context/DashboardContext';

const DashboardLayout: React.FC = () => {
  const [theme, setTheme] = useState<string>(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });
  const dispatch = useAppDispatch();
  const { isAuthenticated, role } = useAppSelector((state) => state.auth);

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const navigate = useNavigate();
  const { activeTab, setActiveTab } = useDashboard();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleNavigation = (key: string | null) => {
    if (key) {
      setActiveTab(key);
      
      // Navigate to the appropriate route
      switch (key) {
        case 'dashboard':
          navigate('/');
          break;
        case 'cashier':
          navigate('/cashier');
          break;
        case 'transactions':
          navigate('/transactions');
          break;
        case 'product-management':
          navigate('/');
          break;
        case 'category-management':
          navigate('/');
          break;
        case 'user-management':
          navigate('/');
          break;
        case 'reports':
          navigate('/');
          break;
        default:
          navigate('/');
      }
    }
  };

  return (
    <ErrorBoundary>
      <div className="d-flex">
        <Sidebar
          activeKey={activeTab}
          onSelect={handleNavigation}
          theme={theme}
          toggleTheme={toggleTheme}
          isAuthenticated={isAuthenticated}
          handleLogout={handleLogout}
          userRole={role || 'cashier'}
        />
        <div className="flex-grow-1">
          <Container fluid className="py-3">
            <Outlet />
          </Container>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </ErrorBoundary>
  );
};

export default DashboardLayout;
