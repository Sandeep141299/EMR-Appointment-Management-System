import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import * as api from '../api/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  });

  const signIn = useCallback(async (credentials) => {
    const result = await api.login(credentials);
    setUser(result.user);
    localStorage.setItem('user', JSON.stringify(result.user));
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
      localStorage.removeItem('user');
    }
  }, []);

  const value = useMemo(() => ({
    user,
    role: user?.role || null,
    signIn,
    signOut,
    isAuthenticated: Boolean(user && api.getAccessToken()),
  }), [user, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
