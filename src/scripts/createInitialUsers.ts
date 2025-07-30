import { createSystemUser } from '../firebase';

/**
 * Script to create initial system users in Firestore
 * Run this once to bootstrap your authentication system
 */
export const createInitialUsers = async () => {
  console.log('🚀 Creating initial system users...');
  
  try {
    // Create admin user
    console.log('Creating admin user...');
    await createSystemUser({
      fullName: 'System Administrator',
      email: 'admin@padle.com',
      password: 'admin123',
      role: 'admin'
    });
    console.log('✅ Admin user created successfully!');
    console.log('   Email: admin@padle.com');
    console.log('   Password: admin123');
    console.log('   Role: admin');
    console.log('');

    // Create cashier user
    console.log('Creating cashier user...');
    await createSystemUser({
      fullName: 'John Cashier',
      email: 'cashier@padle.com',
      password: 'cashier123',
      role: 'cashier'
    });
    console.log('✅ Cashier user created successfully!');
    console.log('   Email: cashier@padle.com');
    console.log('   Password: cashier123');
    console.log('   Role: cashier');
    console.log('');

    // Create another admin for testing
    console.log('Creating additional admin user...');
    await createSystemUser({
      fullName: 'Admin Manager',
      email: 'manager@padle.com',
      password: 'manager123',
      role: 'admin'
    });
    console.log('✅ Manager user created successfully!');
    console.log('   Email: manager@padle.com');
    console.log('   Password: manager123');
    console.log('   Role: admin');
    console.log('');

    console.log('🎉 All users created successfully!');
    console.log('⚠️  IMPORTANT: Please change these default passwords after first login');
    console.log('');
    console.log('📋 Summary of created users:');
    console.log('1. admin@padle.com / admin123 (Admin)');
    console.log('2. cashier@padle.com / cashier123 (Cashier)');
    console.log('3. manager@padle.com / manager123 (Admin)');
    
  } catch (error: any) {
    console.error('❌ Error creating users:', error.message);
    throw error;
  }
};

// Auto-run if this file is executed directly
if (typeof window === 'undefined') {
  createInitialUsers()
    .then(() => {
      console.log('✅ Bootstrap complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Bootstrap failed:', error);
      process.exit(1);
    });
}
