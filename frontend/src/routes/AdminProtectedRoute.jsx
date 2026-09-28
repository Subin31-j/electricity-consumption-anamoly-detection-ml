import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

/**
 * Requires an authenticated ADMIN user. A normal user hitting /admin is
 * redirected to /dashboard (frontend block); the backend independently enforces
 * ADMIN on every /api/admin/* route.
 */
export default function AdminProtectedRoute({ children }) {
  const { isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
