import { Navigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRole: 'client' | 'employee' | 'manager';
};

export const ProtectedRoute = ({ children, allowedRole }: ProtectedRouteProps) => {
  const { userRole } = useUser();

  if (!userRole) {
    return <Navigate to="/login" replace />;
  }

  if (userRole !== allowedRole) {
    // Redirect to their respective dashboard based on their role
    const dashboardPaths = {
      client: '/client',
      employee: '/employee',
      manager: '/manager',
    };
    return <Navigate to={dashboardPaths[userRole]} replace />;
  }

  return <>{children}</>;
};
