import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { toast } from "sonner";
import { authenticateSystemUser, SystemUser } from "../firebase";

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
    const storedUser = localStorage.getItem('systemUser');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser) as SystemUser;
        setUser(userData);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('systemUser');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const authenticatedUser = await authenticateSystemUser(email, password);
      if (authenticatedUser) {
        setUser(authenticatedUser);
        // Store user session in localStorage
        localStorage.setItem('systemUser', JSON.stringify(authenticatedUser));
        toast.success(`Welcome back, ${authenticatedUser.fullName}!`);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('systemUser');
    toast.success('Logged out successfully');
  };

  // Role-based access control functions
  const hasRole = (role: 'admin' | 'cashier'): boolean => {
    return user?.role === role;
  };

  const isAdmin = (): boolean => {
    return user?.role === 'admin';
  };

  const isCashier = (): boolean => {
    return user?.role === 'cashier';
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