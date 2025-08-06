import { apiRequest } from './apiRequest';

export interface SystemUser {
  userId: string;
  fullName: string;
  email: string;
  password: string;
  role: 'admin' | 'cashier';
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface CreateUserData {
  fullName: string;
  email: string;
  password: string;
  role: 'admin' | 'cashier';
}

export interface UpdateUserData {
  fullName?: string;
  email?: string;
  role?: 'admin' | 'cashier';
  isActive?: boolean;
}

// Get all system users
export const getUsers = async (): Promise<SystemUser[]> => {
  try {
    const response = await apiRequest('/system-users/GetAll');
    
    if (response.isSuccessful && response.payload) {
      return response.payload as SystemUser[];
    }
    
    throw new Error(response.remark || 'Failed to fetch users');
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Get user by ID
export const getUser = async (id: string): Promise<SystemUser> => {
  try {
    const response = await apiRequest(`/system-users/GetByID?id=${id}`);
    
    if (response.isSuccessful && response.payload) {
      return response.payload as SystemUser;
    }
    
    throw new Error(response.remark || 'Failed to fetch user');
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

// Create new user
export const createUser = async (userData: CreateUserData): Promise<SystemUser> => {
  try {
    const response = await apiRequest('/system-users/Add', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    if (response.isSuccessful && response.payload) {
      return response.payload as SystemUser;
    }
    
    throw new Error(response.remark || 'Failed to create user');
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Update user
export const updateUser = async (id: string, userData: UpdateUserData): Promise<SystemUser> => {
  try {
    const response = await apiRequest(`/system-users/Update?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
    
    if (response.isSuccessful && response.payload) {
      return response.payload as SystemUser;
    }
    
    throw new Error(response.remark || 'Failed to update user');
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Delete user
export const deleteUser = async (id: string): Promise<void> => {
  try {
    const response = await apiRequest(`/system-users/Delete?id=${id}`, {
      method: 'DELETE'
    });
    
    if (!response.isSuccessful) {
      throw new Error(response.remark || 'Failed to delete user');
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Toggle user active status
export const toggleUserStatus = async (id: string, isActive: boolean): Promise<SystemUser> => {
  try {
    return await updateUser(id, { isActive });
  } catch (error) {
    console.error('Error toggling user status:', error);
    throw error;
  }
};
