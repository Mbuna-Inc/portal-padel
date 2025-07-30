import { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface RoleGuardProps {
  allowedRoles: ('admin' | 'cashier')[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component to conditionally render content based on user roles
 */
export const RoleGuard = ({ allowedRoles, children, fallback }: RoleGuardProps) => {
  const { user } = useAuth();

  if (!user) {
    return fallback || null;
  }

  const hasAccess = allowedRoles.includes(user.role);

  if (!hasAccess) {
    return fallback || (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">
          Access denied. This feature requires {allowedRoles.join(' or ')} privileges.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

/**
 * Higher-order component for admin-only access
 */
export const AdminOnly = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <RoleGuard allowedRoles={['admin']} fallback={fallback}>
    {children}
  </RoleGuard>
);

/**
 * Higher-order component for cashier-only access
 */
export const CashierOnly = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <RoleGuard allowedRoles={['cashier']} fallback={fallback}>
    {children}
  </RoleGuard>
);

/**
 * Higher-order component for both admin and cashier access
 */
export const AuthorizedOnly = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <RoleGuard allowedRoles={['admin', 'cashier']} fallback={fallback}>
    {children}
  </RoleGuard>
);
