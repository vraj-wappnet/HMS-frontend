import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface ProtectedRouteProps {
  isAuthenticated: boolean;
  requiredRole?: 'admin' | 'doctor' | 'patient';
  children?: React.ReactNode;
}

// const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
//   isAuthenticated,
//   requiredRole,
//   children,
// }) => {
//   const { userRole } = useSelector((state: RootState) => state.auth);

//   if (!isAuthenticated) {
//     return <Navigate to="/login" replace />;
//   }

//   if (requiredRole && userRole !== requiredRole) {
//     return <Navigate to="/dashboard" replace />;
//   }

//   return children ? <>{children}</> : <Outlet />;
// };
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  isAuthenticated,
  requiredRole,
  children,
}) => {
  const { user, loading } = useSelector((state: RootState) => state.auth);

  if (loading) {
    return <div>Loading...</div>; // Or a proper loading spinner
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
export default ProtectedRoute;