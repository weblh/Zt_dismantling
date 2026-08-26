import { Navigate, useLocation } from 'react-router-dom';
import { getToken } from '@/utils/authStorage';

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = getToken();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
