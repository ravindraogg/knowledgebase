'use client';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

interface User {
  _id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'owner' | 'admin' | 'member' | 'viewer';
  orgId: string;
  orgName: string;
  orgSlug: string;
  avatarUrl?: string | null;
  jobTitle?: string | null;
  allowedRepoIds?: string[];
  allowedSlackChannels?: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  orgName: string;
  website?: string;
  industry?: string;
  companySize?: string;
  jobTitle?: string;
  phone?: string;
  useCases?: string[];
  deploymentPreference?: string;
  expectedRepoCount?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('recalix_token');
    const savedUser = localStorage.getItem('recalix_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      // Validate token by calling /me
      api
        .get('/auth/me')
        .then((res) => {
          setUser(res.data.user);
          localStorage.setItem('recalix_user', JSON.stringify(res.data.user));
        })
        .catch(() => {
          // Token invalid — clear state
          localStorage.removeItem('recalix_token');
          localStorage.removeItem('recalix_user');
          setUser(null);
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { user: userData, token: jwtToken } = res.data;
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem('recalix_token', jwtToken);
    localStorage.setItem('recalix_user', JSON.stringify(userData));
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const res = await api.post('/auth/register', data);
    const { user: userData, token: jwtToken } = res.data;
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem('recalix_token', jwtToken);
    localStorage.setItem('recalix_user', JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('recalix_token');
    localStorage.removeItem('recalix_user');
    window.location.href = '/login';
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
