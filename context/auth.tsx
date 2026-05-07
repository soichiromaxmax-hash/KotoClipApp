import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, setAuthExpiredHandler } from '@/lib/api';
import { resetHomeCache } from '@/app/(tabs)/index';

type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>('loading');

  useEffect(() => {
    api.getStoredToken().then((token) => {
      if (token) api.syncTokensToSharedStorage();
      setState(token ? 'authenticated' : 'unauthenticated');
    });

    setAuthExpiredHandler(() => setState('unauthenticated'));
  }, []);

  async function login(email: string, password: string) {
    await api.login(email, password);
    setState('authenticated');
  }

  async function signup(email: string, password: string) {
    const data = await api.signup(email, password);
    if (data.access_token) {
      setState('authenticated');
    }
    // access_token なし = メール確認待ち → unauthenticated のまま
    // login.tsx 側の Alert でユーザーに通知済み
  }

  async function logout() {
    await api.logout();
    resetHomeCache();
    setState('unauthenticated');
  }

  return (
    <AuthContext.Provider value={{ state, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
