import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import AuthPage from '../pages/AuthPage';
import DashboardLayout from '../pages/DashboardLayout';
import { DashboardProvider } from '../context/DashboardContext';
import App from '../App';
import CashierPage from '../pages/CashierPage';
import TransactionHistoryPage from '../pages/TransactionHistoryPage';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const routes = [
  {
    path: '/login',
    element: <AuthPage />,
  },
  {
    path: '/',
    element: (
      <PrivateRoute>
        <DashboardProvider>
          <DashboardLayout />
        </DashboardProvider>
      </PrivateRoute>
    ),
    children: [
      {
        path: '',
        element: <App />,
      },
      {
        path: 'cashier',
        element: <CashierPage />,
      },
      {
        path: 'transactions',
        element: <TransactionHistoryPage />,
      },
    ],
  },
];

const router = createBrowserRouter(routes);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};
