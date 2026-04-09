import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, TOKEN_KEY } from '../lib/api';

export type AdminMe = {
  id: number;
  email: string;
  role: string;
  name: string | null;
  is_active: boolean;
};

type Ctx = {
  token: string | null;
  admin: AdminMe | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

const AdminAuthContext = createContext<Ctx | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem(TOKEN_KEY));
  const [admin, setAdmin] = useState<AdminMe | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    const t = sessionStorage.getItem(TOKEN_KEY);
    if (!t) {
      setAdmin(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get<AdminMe>('/api/admin/auth/me');
      setAdmin(data);
    } catch {
      sessionStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<{
      access_token: string;
      admin: AdminMe;
    }>('/api/admin/auth/login', { email, password });
    sessionStorage.setItem(TOKEN_KEY, data.access_token);
    setToken(data.access_token);
    setAdmin(data.admin);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setAdmin(null);
    void api.post('/api/admin/auth/logout').catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ token, admin, loading, login, logout, refreshMe }),
    [token, admin, loading, login, logout, refreshMe]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const v = useContext(AdminAuthContext);
  if (!v) throw new Error('useAdminAuth outside provider');
  return v;
}
