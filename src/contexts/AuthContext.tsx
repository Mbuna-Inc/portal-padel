import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { toast } from "sonner";
import { authService, SystemUser } from "../services/authService";

interface AuthContextType {
  user: SystemUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (role: 'admin' | 'cashier') => boolean;
  isAdmin: () => boolean;
  isCashier: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SystemUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session
    const storedUser = authService.getStoredUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const authenticatedUser = await authService.login(email, password);
      if (authenticatedUser) {
        setUser(authenticatedUser);
        authService.storeUser(authenticatedUser);
        toast.success(`Welcome back, ${authenticatedUser.fullName}!`);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    }
  };

  const logout = () => {
    setUser(null);
    authService.logout();
    toast.success('Logged out successfully');
  };

  // Role-based access control functions
  const hasRole = (role: 'admin' | 'cashier'): boolean => {
    return authService.hasRole(user, role);
  };

  const isAdmin = (): boolean => {
    return authService.isAdmin(user);
  };

  const isCashier = (): boolean => {
    return authService.isCashier(user);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout, 
      hasRole, 
      isAdmin, 
      isCashier 
    }}>
      {children}
    </AuthContext.Provider>
  );
};