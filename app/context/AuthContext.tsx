'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiUrl, AUTH_ACCESS_TOKEN_REFRESHED_EVENT } from '@/app/lib/api';

/** Gộp message + mảng lỗi express-validator từ API */
function messageFromAuthResponse(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback;
  const d = data as Record<string, unknown>;
  if (Array.isArray(d.errors) && d.errors.length > 0) {
    const parts = d.errors
      .map((e) => {
        if (e && typeof e === 'object' && 'msg' in e && typeof (e as { msg: string }).msg === 'string') {
          return (e as { msg: string }).msg;
        }
        return null;
      })
      .filter((x): x is string => Boolean(x));
    if (parts.length) return parts.join(' · ');
  }
  if (typeof d.message === 'string' && d.message.trim()) return d.message.trim();
  return fallback;
}

async function parseJsonResponse(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text.slice(0, 200) };
  }
}

interface User {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  role: 'user' | 'admin';
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  /** Gửi `email` trong JSON như API; giá trị có thể là email hoặc username */
  login: (emailOrUsername: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const onRefreshed = (e: Event) => {
      const ce = e as CustomEvent<{ accessToken?: string }>;
      const t = ce.detail?.accessToken;
      if (t) setToken(t);
    };
    window.addEventListener(AUTH_ACCESS_TOKEN_REFRESHED_EVENT, onRefreshed);
    return () => window.removeEventListener(AUTH_ACCESS_TOKEN_REFRESHED_EVENT, onRefreshed);
  }, []);

  const login = async (emailOrUsername: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch(apiUrl('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailOrUsername.trim(), password }),
      });
      const data = (await parseJsonResponse(res)) as Record<string, unknown>;
      if (data.success) {
        const payload = data.data as Record<string, unknown>;
        const accessToken = (payload.accessToken ?? payload.token) as string;
        const refreshToken = payload.refreshToken as string | undefined;
        setToken(accessToken);
        setUser(payload.user as User);
        localStorage.setItem('token', accessToken);
        localStorage.setItem('refreshToken', refreshToken || '');
        localStorage.setItem('user', JSON.stringify(payload.user));
        return { success: true, message: 'Đăng nhập thành công' };
      }
      return {
        success: false,
        message: messageFromAuthResponse(data, 'Đăng nhập thất bại'),
      };
    } catch {
      return { success: false, message: 'Lỗi kết nối server' };
    }
  };

  const register = async (username: string, email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch(apiUrl('/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = (await parseJsonResponse(res)) as Record<string, unknown>;
      if (data.success) {
        const payload = data.data as Record<string, unknown>;
        const accessToken = (payload.accessToken ?? payload.token) as string;
        const refreshToken = payload.refreshToken as string | undefined;
        setToken(accessToken);
        setUser(payload.user as User);
        localStorage.setItem('token', accessToken);
        localStorage.setItem('refreshToken', refreshToken || '');
        localStorage.setItem('user', JSON.stringify(payload.user));
        return { success: true, message: 'Đăng ký thành công' };
      }
      return {
        success: false,
        message: messageFromAuthResponse(data, 'Đăng ký thất bại'),
      };
    } catch {
      return { success: false, message: 'Lỗi kết nối server' };
    }
  };

  const logout = () => {
    // Gọi API logout (không await — không chặn UI)
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    if (token && refreshToken) {
      fetch(apiUrl('/auth/logout'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => { /* ignore */ });
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
