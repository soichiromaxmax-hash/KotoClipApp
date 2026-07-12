import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, setAuthExpiredHandler } from '@/lib/api';
import { resetHomeCache } from '@/lib/homeCache';
import { loginRevenueCat, logoutRevenueCat, restorePurchases } from '@/lib/purchases';

type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  upgrade: (email: string, password: string) => Promise<void>;
  continueAsGuest: () => Promise<void>;
  loginOrMerge: (email: string, password: string) => Promise<void>;
  signupOrUpgrade: (email: string, password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>('loading');

  // 保存済みトークンが期限切れ・無効化された場合、ログイン画面に落とさず匿名
  // ユーザーを自動発行してアプリを使い続けられるようにする（一度ログイン/ゲスト
  // 選択を終えたユーザーに再度選択画面を強制しないための復旧専用ルート）。
  // ネットワーク不通など匿名ログイン自体に失敗した場合のみ、既存のログイン/
  // 新規登録画面をフォールバックとして表示する。
  async function recoverWithAnonymousSession() {
    try {
      const data = await api.anonymousLogin();
      loginRevenueCat(data.user_id).catch(() => {});
      setState('authenticated');
    } catch {
      setState('unauthenticated');
    }
  }

  useEffect(() => {
    api.getStoredToken().then(async (token) => {
      if (token) {
        await api.syncTokensToSharedStorage().catch(() => {});
        setState('authenticated');
        return;
      }
      // トークンが無い = 初回起動。ログイン/新規登録/ゲスト利用を選べる
      // ログイン画面を表示する（App Store Guideline 5.1.1(v) 対応: ゲスト利用が
      // 常に選べるので登録必須にはならない）。
      setState('unauthenticated');
    }).catch(() => {
      setState('unauthenticated');
    });

    setAuthExpiredHandler(() => {
      resetHomeCache();
      recoverWithAnonymousSession();
    });
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

  async function continueAsGuest() {
    const data = await api.anonymousLogin();
    loginRevenueCat(data.user_id).catch(() => {});
    setState('authenticated');
  }

  // ブラウザ拡張機能/PC用Webアプリはメール+パスワードのみでログインするため、
  // スマホで匿名のまま使っていたユーザーが既存アカウントにログインしようとする
  // 場合、単純に置き換えるとその匿名アカウントのデータが繋がらなくなる。
  // 現在のユーザーが匿名なら「ログイン」ではなく「統合(merge)」を行う。
  async function loginOrMerge(email: string, password: string) {
    const me = await api.getMe().catch(() => null);
    if (me?.is_anonymous) {
      const data = await api.mergeAccount(email, password);
      if (data.user_id) {
        await loginRevenueCat(data.user_id).catch(() => {});
        // 匿名のまま課金していた場合、購入自体はApple ID(デバイス)に紐づいて
        // 残っているため、ログイン先アカウントに復元して引き継ぐ。何も購入して
        // いなければ何も起きない。失敗してもペイウォールの「購入を復元」で
        // 手動リカバリできるため、ここではエラーを無視する。
        restorePurchases().catch(() => {});
      }
      setState('authenticated');
    } else {
      await login(email, password);
    }
  }

  // 同様に「新規登録」も、現在匿名ならデータを引き継ぐupgradeを使う。
  async function signupOrUpgrade(email: string, password: string): Promise<boolean> {
    const me = await api.getMe().catch(() => null);
    if (me?.is_anonymous) {
      await upgrade(email, password);
      return true;
    }
    return signup(email, password);
  }

  return (
    <AuthContext.Provider
      value={{ state, login, signup, logout, upgrade, continueAsGuest, loginOrMerge, signupOrUpgrade }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
