import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { createSystemUser } from '../../firebase';
import { UserPlus, CheckCircle, AlertCircle } from 'lucide-react';

export const CreateInitialUsers = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [createdUsers, setCreatedUsers] = useState<string[]>([]);

  const usersToCreate = [
    {
      fullName: 'System Administrator',
      email: 'admin@padle.com',
      password: 'admin123',
      role: 'admin' as const
    },
    {
      fullName: 'John Cashier',
      email: 'cashier@padle.com',
      password: 'cashier123',
      role: 'cashier' as const
    },
    {
      fullName: 'Admin Manager',
      email: 'manager@padle.com',
      password: 'manager123',
      role: 'admin' as const
    }
  ];

  const createAllUsers = async () => {
    setIsCreating(true);
    const created: string[] = [];

    try {
      for (const userData of usersToCreate) {
        try {
          await createSystemUser(userData);
          created.push(`${userData.email} (${userData.role})`);
          toast.success(`Created ${userData.role}: ${userData.email}`);
        } catch (error: any) {
          if (error.message.includes('already exists')) {
            toast.warning(`User ${userData.email} already exists`);
            created.push(`${userData.email} (${userData.role}) - Already exists`);
          } else {
            throw error;
          }
        }
      }

      setCreatedUsers(created);
      toast.success('All users processed successfully!');
    } catch (error: any) {
      toast.error(`Error creating users: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Bootstrap System Users
        </CardTitle>
        <CardDescription>
          Create initial admin and cashier users for the management portal
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h4 className="font-medium">Users to be created:</h4>
          <div className="space-y-2">
            {usersToCreate.map((user, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{user.fullName}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    user.role === 'admin' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">Password: {user.password}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {createdUsers.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Created Users:
            </h4>
            <div className="space-y-1">
              {createdUsers.map((user, index) => (
                <p key={index} className="text-sm text-green-600">✓ {user}</p>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <Button
            onClick={createAllUsers}
            disabled={isCreating}
            className="w-full"
          >
            {isCreating ? 'Creating Users...' : 'Create Initial Users'}
          </Button>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">Important Security Notice:</p>
                <p className="text-amber-700 mt-1">
                  These are default passwords for initial setup. Please change them immediately after first login for security.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
