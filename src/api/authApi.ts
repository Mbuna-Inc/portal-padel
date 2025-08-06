import { apiRequest } from './apiRequest';

export interface SystemUser {
  userId: string;
  fullName: string;
  email: string;
  role: 'admin' | 'cashier';
  createdAt: string | Date;
  updatedAt: string | Date;
  isActive: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// System user authentication
export const authenticateSystemUser = async (credentials: LoginCredentials): Promise<SystemUser | null> => {
  try {
    console.log('🔐 Attempting system user authentication...');
    console.log('📧 Email:', credentials.email);
    
    const response = await apiRequest('/auth/system-login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    
    console.log('✅ Authentication response received:', response);
    
    if (response.success && response.payload && response.payload.user) {
      console.log('👤 User authenticated:', response.payload.user);
      return response.payload.user as SystemUser;
    }
    
    if (response.isSuccessful && response.payload && response.payload.user) {
      console.log('👤 User authenticated (isSuccessful):', response.payload.user);
      return response.payload.user as SystemUser;
    }
    
    console.error('❌ Authentication failed - invalid response format:', response);
    throw new Error(response.message || response.remark || 'Authentication failed');
  } catch (error: any) {
    console.error('💥 System user authentication error:', error);
    
    // Provide more specific error messages
    if (error.message?.includes('401')) {
      throw new Error('Invalid email or password');
    } else if (error.message?.includes('500')) {
      throw new Error('Server error - please try again later');
    } else if (error.message?.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server - please check if the backend is running');
    }
    
    throw error;
  }
};

// Test connection to backend
export const testBackendConnection = async (): Promise<boolean> => {
  try {
    console.log('🔗 Testing backend connection...');
    
    // Try a simple request to check if backend is running
    const response = await fetch('http://localhost:3000/api/v1/auth/system-login', {
      method: 'OPTIONS',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'padle-management-portal-key-2024',
        'Authorization': 'Bearer admin-management-portal-token-2024'
      }
    });
    
    console.log('📡 Connection test response:', response.status);
    return response.status < 500; // Any response less than 500 means server is reachable
  } catch (error) {
    console.error('❌ Backend connection failed:', error);
    return false;
  }
};

// Direct API test (bypassing apiRequest wrapper)
export const testSystemLoginDirect = async (credentials: LoginCredentials): Promise<any> => {
  try {
    console.log('🧪 Testing system login directly...');
    
    const response = await fetch('http://localhost:3000/api/v1/auth/system-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'padle-management-portal-key-2024',
        'Authorization': 'Bearer admin-management-portal-token-2024'
      },
      body: JSON.stringify(credentials)
    });
    
    console.log('📊 Direct test response status:', response.status);
    
    const responseText = await response.text();
    console.log('📄 Direct test response body:', responseText);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { rawResponse: responseText };
    }
    
    return {
      status: response.status,
      data: responseData
    };
  } catch (error) {
    console.error('💥 Direct test error:', error);
    throw error;
  }
};
