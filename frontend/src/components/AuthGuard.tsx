import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRole?: 'admin' | 'cashier';
}

const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requireAuth = true, 
  requiredRole 
}) => {
  const { isAuthenticated, role } = useAppSelector((state) => state.auth);
  const location = useLocation();

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If specific role is required but user doesn't have it
  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  // If user is authenticated but trying to access login page
  if (!requireAuth && isAuthenticated && location.pathname === '/login') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;
