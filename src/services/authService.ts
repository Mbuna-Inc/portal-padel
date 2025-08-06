/**
 * Authentication Service for Management Portal
 * Uses API-based authentication instead of direct Firebase access
 */

export interface SystemUser {
  userId: string;
  fullName: string;
  email: string;
  role: 'admin' | 'cashier';
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LoginResponse {
  isSuccessful: boolean;
  remark: string;
  payload?: {
    user: SystemUser;
  };
  statusCode: number;
  timestamp: string;
}

class AuthService {
  private readonly API_BASE_URL: string;
  private readonly API_KEY: string;
  private readonly ADMIN_TOKEN: string;

  constructor() {
    this.API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
    this.API_KEY = import.meta.env.VITE_API_KEY || 'padle-management-portal-key-2024';
    this.ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN || 'admin-management-portal-token-2024';
  }

  /**
   * Login system user via API
   */
  async login(email: string, password: string): Promise<SystemUser> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/auth/system-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.API_KEY,
          'x-admin-token': this.ADMIN_TOKEN,
        },
        body: JSON.stringify({ email, password }),
      });

      const data: LoginResponse = await response.json();
      
      // Debug logging
      console.log('Backend response:', data);
      console.log('Response structure:', {
        isSuccessful: data.isSuccessful,
        payload: data.payload,
        user: data.payload?.user
      });

      if (!response.ok) {
        console.error('Response not OK:', response.status, data);
        throw new Error(data.remark || 'Login failed');
      }

      if (!data.isSuccessful || !data.payload?.user) {
        console.error('Invalid response format:', data);
        throw new Error(data.remark || 'Invalid response format');
      }

      return data.payload.user;
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  /**
   * Logout user (clear session)
   */
  logout(): void {
    localStorage.removeItem('systemUser');
    localStorage.removeItem('systemUserSession');
  }

  /**
   * Get stored user session
   */
  getStoredUser(): SystemUser | null {
    try {
      const storedUser = localStorage.getItem('systemUser');
      if (storedUser) {
        return JSON.parse(storedUser) as SystemUser;
      }
    } catch (error) {
      console.error('Error parsing stored user:', error);
      localStorage.removeItem('systemUser');
    }
    return null;
  }

  /**
   * Store user session
   */
  storeUser(user: SystemUser): void {
    localStorage.setItem('systemUser', JSON.stringify(user));
    localStorage.setItem('systemUserSession', new Date().toISOString());
  }

  /**
   * Check if user has specific role
   */
  hasRole(user: SystemUser | null, role: 'admin' | 'cashier'): boolean {
    return user?.role === role;
  }

  /**
   * Check if user is admin
   */
  isAdmin(user: SystemUser | null): boolean {
    return this.hasRole(user, 'admin');
  }

  /**
   * Check if user is cashier
   */
  isCashier(user: SystemUser | null): boolean {
    return this.hasRole(user, 'cashier');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(user: SystemUser | null): boolean {
    return user !== null && user.isActive;
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'x-api-key': this.API_KEY,
        },
      });
      return response.ok;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }
}

export const authService = new AuthService();
