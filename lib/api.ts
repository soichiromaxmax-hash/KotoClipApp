import AsyncStorage from '@react-native-async-storage/async-storage';
import SharedStorage from 'shared-storage';

const BASE_URL = 'https://kotoclip.onrender.com';
const BASE = `${BASE_URL}/api`;

async function getToken() {
  return AsyncStorage.getItem('vocab_token');
}

async function getRefreshToken() {
  return AsyncStorage.getItem('vocab_refresh');
}

async function saveTokens(access: string, refresh: string) {
  await AsyncStorage.setItem('vocab_token', access);
  await AsyncStorage.setItem('vocab_refresh', refresh);
  safeSharedStorageSet('vocab_token', access);
  safeSharedStorageSet('vocab_refresh', refresh);
}

async function syncTokensToSharedStorage() {
  const access = await getToken();
  const refresh = await getRefreshToken();
  if (access) safeSharedStorageSet('vocab_token', access);
  if (refresh) safeSharedStorageSet('vocab_refresh', refresh);
}

async function clearTokens() {
  await AsyncStorage.removeItem('vocab_token');
  await AsyncStorage.removeItem('vocab_refresh');
  safeSharedStorageRemove('vocab_token');
  safeSharedStorageRemove('vocab_refresh');
}

function safeSharedStorageSet(key: string, value: string) {
  try {
    SharedStorage.setItem(key, value);
  } catch {
    // The share extension token bridge is best-effort; never crash the main app.
  }
}

function safeSharedStorageRemove(key: string) {
  try {
    SharedStorage.removeItem(key);
  } catch {
    // The share extension token bridge is best-effort; never crash the main app.
  }
}

// Share Extensionは本体アプリの学習言語/母語設定を知らないため、App Group経由で
// 同期する。未同期の場合はExtension側でサーバーのデフォルト(ja/en)にフォールバックする。
function syncLangToSharedStorage(nativeLang?: string, targetLang?: string) {
  if (nativeLang) safeSharedStorageSet('native_lang', nativeLang);
  if (targetLang) safeSharedStorageSet('target_lang', targetLang);
}

// Supabaseのリフレッシュトークンは使い切り（ローテーション）方式のため、
// 複数リクエストが同時に401を受けてそれぞれ独立にリフレッシュすると、
// 2つ目以降が「既に使われたトークン」で失敗し、最悪トークンファミリーごと
// 失効する。同時実行を1本化して必ず使い回すことで、この競合を防ぐ。
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const refresh = await getRefreshToken();
    if (!refresh) return null;
    try {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refresh }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data?.access_token) return null;
      await saveTokens(data.access_token, data.refresh_token ?? refresh);
      return data.access_token;
    } catch {
      return null;
    }
  })();
  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

type AuthExpiredHandler = () => void;
let onAuthExpired: AuthExpiredHandler | null = null;
export function setAuthExpiredHandler(handler: AuthExpiredHandler) {
  onAuthExpired = handler;
}

// サーバーのHTTPステータス(402の上限到達・429のAI回数上限など)を呼び出し元が
// 判定できるよう、プレーンなErrorではなくstatusを保持したエラーを投げる。
export class ApiError extends Error {
  status: number;
  detail: string;
  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}

function fetchWithTimeout(url: string, opts: RequestInit, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...opts, signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function _fetch(path: string, options: RequestInit = {}, timeoutMs = 30000): Promise<any> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res = await fetchWithTimeout(`${BASE}${path}`, { ...options, headers }, timeoutMs);

  if (res.status === 401) {
    const next = await refreshAccessToken();
    if (!next) {
      await clearTokens();
      onAuthExpired?.();
      throw new Error('AUTH_REQUIRED');
    }
    headers['Authorization'] = `Bearer ${next}`;
    res = await fetchWithTimeout(`${BASE}${path}`, { ...options, headers }, timeoutMs);
    if (res.status === 401) {
      await clearTokens();
      onAuthExpired?.();
      throw new Error('AUTH_REQUIRED');
    }
  }

  if (!res.ok) {
    const errCt = res.headers.get('content-type') ?? '';
    const errBody = errCt.includes('application/json') ? await res.json().catch(() => null) : null;
    throw new ApiError(res.status, errBody?.detail ?? `HTTP_${res.status}`);
  }
  const ct = res.headers.get('content-type') ?? '';
  try {
    if (ct.includes('application/json')) return await res.json();
    const text = await res.text();
    return text ? { detail: text } : {};
  } catch {
    return {};
  }
}

// 認証不要な公開エンドポイント用。_fetch()と違いトークンを一切付けないため、
// 期限切れ/無効なトークンが残っていても401→リフレッシュ→ログアウト処理に
// 巻き込まれない。
async function _publicFetch(path: string, timeoutMs = 30000): Promise<any> {
  const res = await fetchWithTimeout(`${BASE}${path}`, {}, timeoutMs);
  if (!res.ok) {
    const errCt = res.headers.get('content-type') ?? '';
    const errBody = errCt.includes('application/json') ? await res.json().catch(() => null) : null;
    throw new ApiError(res.status, errBody?.detail ?? `HTTP_${res.status}`);
  }
  const ct = res.headers.get('content-type') ?? '';
  try {
    if (ct.includes('application/json')) return await res.json();
    const text = await res.text();
    return text ? { detail: text } : {};
  } catch {
    return {};
  }
}

export const api = {
  async login(email: string, password: string) {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const ct = res.headers.get('content-type') ?? '';
    const data = ct.includes('application/json') ? await res.json().catch(() => null) : null;
    if (!res.ok) throw new Error(data?.detail ?? 'ログインに失敗しました');
    await saveTokens(data.access_token, data.refresh_token ?? '');
    await AsyncStorage.setItem('user_email', email).catch(() => {});
    if (data?.user_id) await AsyncStorage.setItem('user_id', data.user_id).catch(() => {});
    return data as { user_id: string; access_token: string; refresh_token: string };
  },

  async signup(email: string, password: string) {
    const res = await fetch(`${BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const ct = res.headers.get('content-type') ?? '';
    const data = ct.includes('application/json') ? await res.json().catch(() => null) : null;
    if (!res.ok) throw new Error(data?.detail ?? '登録に失敗しました');
    if (data?.access_token) await saveTokens(data.access_token, data.refresh_token ?? '');
    if (data?.user_id) await AsyncStorage.setItem('user_id', data.user_id).catch(() => {});
    return data as { user_id: string; access_token: string | null; refresh_token: string | null };
  },

  async logout() {
    try { await _fetch('/auth/logout', { method: 'POST' }); } catch {}
    await clearTokens();
  },

  async anonymousLogin() {
    const res = await fetch(`${BASE}/auth/anonymous`, { method: 'POST' });
    const ct = res.headers.get('content-type') ?? '';
    const data = ct.includes('application/json') ? await res.json().catch(() => null) : null;
    if (!res.ok) throw new Error(data?.detail ?? '匿名ログインに失敗しました');
    await saveTokens(data.access_token, data.refresh_token ?? '');
    if (data?.user_id) await AsyncStorage.setItem('user_id', data.user_id).catch(() => {});
    return data as { user_id: string; access_token: string; refresh_token: string };
  },

  async upgradeAccount(email: string, password: string) {
    const data = await _fetch('/auth/upgrade', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    // Supabaseはemail/password変更時に匿名セッションのトークンを即失効させるため、
    // /auth/upgrade が発行し直した新トークンで必ず上書きする（失効済みトークンを
    // 使い続けると次のAPI呼び出しで401→ログアウトに落ちてしまう）。
    if (data.access_token) await saveTokens(data.access_token, data.refresh_token ?? '');
    if (data?.user_id) await AsyncStorage.setItem('user_id', data.user_id).catch(() => {});
    await AsyncStorage.setItem('user_email', email).catch(() => {});
    return data as { status: string; user_id: string; access_token: string; refresh_token: string };
  },

  getMe: () => _fetch('/auth/me') as Promise<{ user_id: string; email: string | null; is_anonymous: boolean }>,

  async mergeAccount(email: string, password: string) {
    const data = await _fetch('/auth/merge', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    // upgradeAccount同様、統合先アカウントの新トークンで必ず上書きする。
    if (data.access_token) await saveTokens(data.access_token, data.refresh_token ?? '');
    if (data?.user_id) await AsyncStorage.setItem('user_id', data.user_id).catch(() => {});
    await AsyncStorage.setItem('user_email', email).catch(() => {});
    return data as { status: string; user_id: string; access_token: string; refresh_token: string };
  },

  async getStoredToken() { return getToken(); },
  syncTokensToSharedStorage,
  syncLangToSharedStorage,

  getStats: async () => {
    const raw = await _fetch('/stats');
    return {
      due:             raw.due_count        ?? raw.due             ?? 0,
      total:           raw.total_words      ?? raw.total           ?? 0,
      mastered:        raw.mastered_count   ?? raw.mastered        ?? 0,
      streak:          raw.streak           ?? 0,
      reliable_count:  raw.reliable_count   ?? 0,
      today_count:     raw.today_count      ?? 0,
      wild_known_count: raw.wild_known_count ?? 0,
      xp:              raw.xp              ?? 0,
    };
  },
  getDue:            (limit = 20)         => _fetch(`/study/due?limit=${limit}`),
  getAllWords:        (limit?: number, random = false) => {
    const p = new URLSearchParams();
    if (limit)  p.set('limit', String(limit));
    if (random) p.set('random', 'true');
    const qs = p.toString();
    return _fetch(`/study/all${qs ? '?' + qs : ''}`);
  },
  listWords:         ()                   => _fetch('/words'),
  getWord:           (id: number)         => _fetch(`/words/${id}`),
  getChoices:        (wordId: number)     => _fetch(`/study/choices/${wordId}`),
  getTodayEncounters: ()                  => _fetch('/wild/today'),
  getTimeline:       (id: number)         => _fetch(`/words/${id}/timeline`),
  getSettings:       ()                   => _fetch('/settings'),
  lookup: (word: string, targetLang = 'en', nativeLang = 'ja') =>
    _publicFetch(`/lookup?word=${encodeURIComponent(word)}&target_lang=${targetLang}&native_lang=${nativeLang}`),

  addWord: (payload: object) =>
    _fetch('/words', { method: 'POST', body: JSON.stringify(payload) }),

  updateMemo: (id: number, memo: string) =>
    _fetch(`/words/${id}/memo`, { method: 'PATCH', body: JSON.stringify({ key: 'memo', value: memo }) }),

  toggleFavorite: (id: number, value: boolean) =>
    _fetch(`/words/${id}/favorite`, { method: 'PATCH', body: JSON.stringify({ value }) }),

  deleteWord: (id: number) =>
    _fetch(`/words/${id}`, { method: 'DELETE' }),

  retranslate: (id: number) =>
    _fetch(`/words/${id}/retranslate`, { method: 'POST' }),

  postReview: (wordId: number, rating: 'good' | 'hard' | 'easy' | 'again', elapsedDays = 1) =>
    _fetch('/study/review', { method: 'POST', body: JSON.stringify({ word_id: wordId, rating, elapsed_days: elapsedDays }) }),

  updateSetting: (key: string, value: string | number) =>
    _fetch('/settings', { method: 'POST', body: JSON.stringify({ key, value: String(value) }) }),

  getGamification: () => _fetch('/gamification'),

  awardXp: (action: 'session_complete' | 'combo_5' | 'weekly_report') =>
    _fetch('/gamification/xp', { method: 'POST', body: JSON.stringify({ action }) }),

  getWeakWords: (limit = 20) => _fetch(`/words/weak?limit=${limit}`),
};
