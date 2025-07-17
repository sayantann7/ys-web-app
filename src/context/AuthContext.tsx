
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { apiService } from '@/services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  updateUser: (email: string, fullname: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // Try to get user details from token or stored user data
      const storedUser = localStorage.getItem('userData');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    const response = await apiService.signIn(email, password);
    setUser(response.user);
    localStorage.setItem('userData', JSON.stringify(response.user));
  };

  const signOut = () => {
    apiService.clearToken();
    localStorage.removeItem('userData');
    setUser(null);
  };

  const updateUser = async (email: string, fullname: string) => {
    const response = await apiService.updateUser(email, fullname);
    setUser(response.user);
    localStorage.setItem('userData', JSON.stringify(response.user));
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
