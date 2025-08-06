// DEPRECATED: This file is being migrated to use API endpoints instead of direct Firebase access
// TODO: Remove this file once all components are migrated to use API endpoints

import { apiRequest } from './api/apiRequest';

// Temporary placeholders to prevent initialization errors
export const auth: any = null;
export const db: any = null;

// System User Interface (updated to match backend response)
export interface SystemUser {
  userId: string;
  fullName: string;
  email: string;
  role: 'admin' | 'cashier';
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Court {
  courtId: string;
  name: string;
  location: string;
  category: string;
  pricePerHour: number;
  status: 'available' | 'closed';
  createdAt: string;
  updatedAt: string;
}

// API-based authentication function (replaces Firebase auth)
export const authenticateSystemUser = async (email: string, password: string): Promise<SystemUser | null> => {
  try {
    const response = await apiRequest('/auth/system-login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (response.success && response.payload?.user) {
      return response.payload.user as SystemUser;
    }
    
    throw new Error(response.message || response.remark || 'Authentication failed');
  } catch (error) {
    console.error('System authentication error:', error);
    throw error;
  }
};

// API-based user creation function (replaces Firebase user creation)
export const createSystemUser = async (userData: Omit<SystemUser, 'userId' | 'createdAt' | 'updatedAt' | 'isActive'>): Promise<void> => {
  try {
    const response = await apiRequest('/users/create', {
      method: 'POST',
      body: JSON.stringify({
        ...userData,
        role: userData.role || 'cashier'
      })
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to create user');
    }
  } catch (error) {
    console.error('Error creating system user:', error);
    throw error;
  }
};

// Deprecated functions - keeping for compatibility during migration
export const saveUserProfile = async () => {
  console.warn('saveUserProfile is deprecated, use API endpoints instead');
};

export const createCourt = async () => {
  console.warn('createCourt is deprecated, use API endpoints instead');
};

export const getCourts = async (): Promise<Court[]> => {
  console.warn('getCourts is deprecated, use API endpoints instead');
  return [];
};

export const updateCourt = async () => {
  console.warn('updateCourt is deprecated, use API endpoints instead');
};

export const deleteCourt = async () => {
  console.warn('deleteCourt is deprecated, use API endpoints instead');
};