import React from 'react';
import { useAppSelector } from '../store/hooks';
import { Alert } from 'react-bootstrap';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'cashier';
  allowedRoles?: ('admin' | 'cashier')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole, 
  allowedRoles = ['admin', 'cashier'] 
}) => {
  const { isAuthenticated, role } = useAppSelector((state) => state.auth);

  if (!isAuthenticated) {
    return (
      <Alert variant="warning">
        Anda harus login terlebih dahulu untuk mengakses halaman ini.
      </Alert>
    );
  }

  // Check specific required role
  if (requiredRole && role !== requiredRole) {
    return (
      <Alert variant="danger">
        Akses ditolak. Anda harus memiliki role {requiredRole} untuk mengakses fitur ini.
      </Alert>
    );
  }

  // Check allowed roles
  if (!allowedRoles.includes(role as 'admin' | 'cashier')) {
    return (
      <Alert variant="danger">
        Akses ditolak. Role Anda tidak memiliki akses ke fitur ini.
      </Alert>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
