import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User, refreshToken?: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refresh_token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (token: string, newUser: User, refreshToken?: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(newUser));
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
    setUser(newUser);
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (err) {
      console.warn('Logout request failed', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('refresh_token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};