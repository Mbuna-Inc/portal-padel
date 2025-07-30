import { createSystemUser } from '../firebase';

/**
 * Utility function to create the first admin user
 * This should be run once to bootstrap the system
 */
export const createFirstAdminUser = async () => {
  try {
    await createSystemUser({
      fullName: 'System Administrator',
      email: 'admin@padle.com',
      password: 'admin123', // Change this to a secure password
      role: 'admin'
    });
    console.log('Admin user created successfully!');
    console.log('Email: admin@padle.com');
    console.log('Password: admin123');
    console.log('Please change the password after first login');
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

/**
 * Create a sample cashier user
 */
export const createSampleCashier = async () => {
  try {
    await createSystemUser({
      fullName: 'John Cashier',
      email: 'cashier@padle.com',
      password: 'cashier123',
      role: 'cashier'
    });
    console.log('Cashier user created successfully!');
    console.log('Email: cashier@padle.com');
    console.log('Password: cashier123');
  } catch (error) {
    console.error('Error creating cashier user:', error);
  }
};

// Uncomment the lines below and run this file to create initial users
createFirstAdminUser();
createSampleCashier();
