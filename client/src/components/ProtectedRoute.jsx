import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useRole } from '../hooks/useRole.js';

export default function ProtectedRoute({ allowedRoles, permission, children }) {
  const { isAuthenticated } = useAuth();
  const { hasRole, can } = useRole();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }
  if (
    (permission && !can(permission))
    || (!permission && allowedRoles && !hasRole(...allowedRoles))
  ) {
    return <Navigate to="/403" replace />;
  }
  return children || <Outlet />;
}
