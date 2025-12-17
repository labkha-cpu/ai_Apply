import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Chargement de votre session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/pricing" state={{ from: location.pathname }} replace />;
  }

  return children;
};

export default ProtectedRoute;
