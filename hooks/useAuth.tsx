import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import request from '@/utils/request';
import { logger } from '@/utils/logger';

export type UserRole = 'parent' | 'doctor' | null;

interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  phone?: string;
  childId?: string;
  childName?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole;
  login: (phone: string, password: string, role: 'parent' | 'doctor') => Promise<void>;
  register: (data: ParentRegisterData) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

interface ParentRegisterData {
  phone: string;
  password: string;
  childName: string;
  surgeryDate: string;
  diagnosisType: string;
  contactName: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = 'hd_followup_auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AuthUser;
        setUser(parsed);
        setRole(parsed.role);
      } catch (e) {
        logger.error('解析本地登录信息失败', e);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (phone: string, password: string, loginRole: 'parent' | 'doctor') => {
    setIsLoading(true);
    try {
      const endpoint = loginRole === 'parent' ? '/api/auth/parent/login' : '/api/auth/doctor/login';
      const response = await request.post(endpoint, { phone, password });
      const { token, user: userData } = response.data;
      setUser(userData as AuthUser);
      setRole(loginRole);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      if (token) {
        localStorage.setItem('hd_followup_token', token);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: ParentRegisterData) => {
    setIsLoading(true);
    try {
      const response = await request.post('/api/auth/parent/register', data);
      const { token, user: userData } = response.data;
      setUser(userData as AuthUser);
      setRole('parent');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      if (token) {
        localStorage.setItem('hd_followup_token', token);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('hd_followup_token');
  };

  return (
    <AuthContext.Provider value={{ user, role, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
