import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from './ui/Feedback';

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  return children;
}

export function RequireAdmin({ children }) {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="admin-loading"><Spinner /></div>;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  if (!isAdmin) return <Navigate to="/admin/setup" replace />;
  return children;
}

/** Solo acepta rutas internas ("/algo"): evita redirecciones abiertas a otros sitios. */
export const safeNext = (value) =>
  value && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\') ? value : null;
