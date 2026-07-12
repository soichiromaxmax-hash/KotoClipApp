import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, setAuthExpiredHandler } from '@/lib/api';
import { resetHomeCache } from '@/lib/homeCache';
import { loginRevenueCat, logoutRevenueCat } from '@/lib/purchases';

type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  upgrade: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>('loading');

  useEffect(() => {
    api.getStoredToken().then(async (token) => {
      if (token) {
        await api.syncTokensToSharedStorage().catch(() => {});
        setState('authenticated');
        return;
      }
      // トークンが無い = 初回起動。ログイン画面を挟まず、匿名ユーザーを
      // 自動発行して即アプリを使えるようにする（App Store Guideline 5.1.1(v) 対応）。
      try {
        const data = await api.anonymousLogin();
        loginRevenueCat(data.user_id).catch(() => {});
        setState('authenticated');
      } catch {
        // ネットワーク不通など匿名ログイン自体に失敗した場合のみ、
        // 既存のログイン/新規登録画面をフォールバックとして表示する。
        setState('unauthenticated');
      }
    }).catch(() => {
      setState('unauthenticated');
    });

    setAuthExpiredHandler(() => { resetHomeCache(); setState('unauthenticated'); });
  }, []);

  async function login(email: string, password: string) {
    const data = await api.login(email, password);
    loginRevenueCat(data.user_id).catch(() => {});
    setState('authenticated');
  }

  async function signup(email: string, password: string) {
    const data = await api.signup(email, password);
    if (data.access_token) {
      if (data.user_id) loginRevenueCat(data.user_id).catch(() => {});
      setState('authenticated');
      return true;
    }
    // access_token なし = メール確認待ち → unauthenticated のまま
    // login.tsx 側の Alert でユーザーに通知済み
    return false;
  }

  async function logout() {
    await api.logout();
    logoutRevenueCat().catch(() => {});
    resetHomeCache();
    setState('unauthenticated');
  }

  async function upgrade(email: string, password: string) {
    await api.upgradeAccount(email, password);
    // user_id は不変なので state・RevenueCatのログイン状態はそのまま変わらない
  }

  return (
    <AuthContext.Provider value={{ state, login, signup, logout, upgrade }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
