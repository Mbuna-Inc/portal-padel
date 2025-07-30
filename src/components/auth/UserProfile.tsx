import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, LogOut, Shield, CreditCard } from 'lucide-react';

export const UserProfile = () => {
  const { user, logout, isAdmin, isCashier } = useAuth();

  if (!user) return null;

  const getRoleIcon = () => {
    if (isAdmin()) return <Shield className="h-4 w-4" />;
    if (isCashier()) return <CreditCard className="h-4 w-4" />;
    return <User className="h-4 w-4" />;
  };

  const getRoleBadgeColor = () => {
    if (isAdmin()) return 'bg-red-100 text-red-800 border-red-200';
    if (isCashier()) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-white border rounded-lg shadow-sm">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-gray-100 rounded-full">
          <User className="h-5 w-5 text-gray-600" />
        </div>
        <div>
          <p className="font-medium text-gray-900">{user.fullName}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {getRoleIcon()}
        <Badge className={`${getRoleBadgeColor()} capitalize`}>
          {user.role}
        </Badge>
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={logout}
        className="ml-auto flex items-center gap-2"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </Button>
    </div>
  );
};
