import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

type AppRole = 'master_super_admin' | 'super_admin' | 'broker' | 'player';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: AppRole[];
  requireAnyRole?: boolean; // If true, user needs at least one of the roles. If false (default), needs all.
}

export function ProtectedRoute({ 
  children, 
  requiredRoles = [], 
  requireAnyRole = true 
}: ProtectedRouteProps) {
  const { user, roles, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to auth page, preserving the intended destination
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If no specific roles required, just need authentication
  if (requiredRoles.length === 0) {
    return <>{children}</>;
  }

  // Check role requirements
  const userRoleNames = roles.map(r => r.role);
  
  // Master super admin can access everything
  if (userRoleNames.includes('master_super_admin')) {
    return <>{children}</>;
  }

  const hasRequiredRole = requireAnyRole
    ? requiredRoles.some(role => userRoleNames.includes(role))
    : requiredRoles.every(role => userRoleNames.includes(role));

  if (!hasRequiredRole) {
    // Redirect to appropriate page based on their actual role
    const highestRole = userRoleNames.includes('super_admin') 
      ? 'super_admin' 
      : userRoleNames.includes('broker')
        ? 'broker'
        : 'player';

    const redirectPath = {
      super_admin: '/admin',
      broker: '/broker',
      player: '/lobby',
    }[highestRole];

    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}
