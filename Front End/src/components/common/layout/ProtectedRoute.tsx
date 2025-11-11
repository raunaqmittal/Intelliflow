import { Navigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole: UserRole;
}

export function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const { userRole, loading } = useUser();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!userRole || userRole !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
