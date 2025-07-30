# Custom Authentication System

This management portal now uses a custom authentication system with role-based access control instead of Firebase Auth.

## System Users Collection

The system stores users in a Firestore collection called `system_users` with the following structure:

```typescript
interface SystemUser {
  userId: string;           // Unique identifier
  fullName: string;         // User's full name
  email: string;            // Login email
  password: string;         // Hashed password (bcrypt)
  role: 'admin' | 'cashier'; // User role
  createdAt: string;        // Creation timestamp
  updatedAt: string;        // Last update timestamp
  isActive: boolean;        // Account status
}
```

## User Roles

### Admin Role
- Full access to all management portal features
- Can create, edit, and delete other users
- Access to all reports and analytics
- System configuration privileges

### Cashier Role
- Limited access to point-of-sale features
- Can process transactions
- View basic reports
- Cannot manage users or system settings

## Getting Started

### 1. Create Initial Users

Run the bootstrap script to create your first admin and cashier users:

```bash
# Make sure you have your Firebase environment variables set
node bootstrap-users.js
```

This will create:
- **Admin**: admin@padle.com / admin123
- **Cashier**: cashier@padle.com / cashier123

⚠️ **Important**: Change these default passwords after first login!

### 2. Login to the Portal

Navigate to your management portal and use the credentials above to log in.

## Role-Based Components

The system includes several components for role-based access control:

### RoleGuard Component
```tsx
<RoleGuard allowedRoles={['admin']}>
  <AdminOnlyContent />
</RoleGuard>
```

### Convenience Components
```tsx
<AdminOnly>
  <AdminFeature />
</AdminOnly>

<CashierOnly>
  <CashierFeature />
</CashierOnly>

<AuthorizedOnly>
  <FeatureForBothRoles />
</AuthorizedOnly>
```

### Auth Context Hooks
```tsx
const { user, isAdmin, isCashier, hasRole } = useAuth();

// Check specific role
if (isAdmin()) {
  // Admin-only logic
}

// Check multiple roles
if (hasRole('admin') || hasRole('cashier')) {
  // Authorized user logic
}
```

## Security Features

- **Password Hashing**: All passwords are hashed using bcrypt with salt rounds of 12
- **Session Management**: User sessions are stored in localStorage
- **Role Validation**: All role checks are performed server-side
- **Account Status**: Users can be activated/deactivated without deletion

## Adding New Users

To add new users programmatically:

```typescript
import { createSystemUser } from './src/firebase';

await createSystemUser({
  fullName: 'New User',
  email: 'user@example.com',
  password: 'securepassword',
  role: 'cashier'
});
```

## Migration Notes

This system replaces Firebase Auth with a custom solution. The old Firebase Auth functions are still available for compatibility but are no longer used for the management portal authentication.
