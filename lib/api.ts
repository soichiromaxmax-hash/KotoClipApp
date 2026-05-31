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

async function refreshAccessToken(): Promise<string | null> {
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
}

type AuthExpiredHandler = () => void;
let onAuthExpired: AuthExpiredHandler | null = null;
export function setAuthExpiredHandler(handler: AuthExpiredHandler) {
  onAuthExpired = handler;
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
    throw new Error(errBody?.detail ?? `HTTP_${res.status}`);
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
    const data = await res.json();
    if (!res.ok) throw new Error(data?.detail ?? 'ログインに失敗しました');
    await saveTokens(data.access_token, data.refresh_token ?? '');
    return data as { user_id: string; access_token: string; refresh_token: string };
  },

  async signup(email: string, password: string) {
    const res = await fetch(`${BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.detail ?? '登録に失敗しました');
    if (data.access_token) await saveTokens(data.access_token, data.refresh_token ?? '');
    return data as { user_id: string; access_token: string | null; refresh_token: string | null };
  },

  async logout() {
    try { await _fetch('/auth/logout', { method: 'POST' }); } catch {}
    await clearTokens();
  },

  async getStoredToken() { return getToken(); },
  syncTokensToSharedStorage,

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
  lookup: (word: string, learningLang = 'en', nativeLang = 'ja') =>
    _fetch(`/lookup?word=${encodeURIComponent(word)}&learning_lang=${learningLang}&native_lang=${nativeLang}`),

  addWord: (payload: object) =>
    _fetch('/words', { method: 'POST', body: JSON.stringify(payload) }),

  updateMemo: (id: number, memo: string) =>
    _fetch(`/words/${id}/memo`, { method: 'PATCH', body: JSON.stringify({ key: 'memo', value: memo }) }),

  toggleFavorite: (id: number, value: boolean) =>
    _fetch(`/words/${id}/favorite`, { method: 'PATCH', body: JSON.stringify({ value }) }),

  deleteWord: (id: number) =>
    _fetch(`/words/${id}`, { method: 'DELETE' }),

  retranslate: (id: number, learningLang = 'en', nativeLang = 'ja') =>
    _fetch(`/words/${id}/retranslate`, { method: 'POST', body: JSON.stringify({ learning_lang: learningLang, native_lang: nativeLang }) }),

  postReview: (wordId: number, rating: 'good' | 'hard' | 'again', elapsedDays = 1) =>
    _fetch('/study/review', { method: 'POST', body: JSON.stringify({ word_id: wordId, rating, elapsed_days: elapsedDays }) }),

  updateSetting: (key: string, value: string | number) =>
    _fetch('/settings', { method: 'POST', body: JSON.stringify({ key, value: String(value) }) }),
};
