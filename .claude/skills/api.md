---
name: api
description: API クライアントの使い方・認証フロー・トークン管理・エンドポイント一覧を調べるとき
---

# API クライアント（lib/api.ts）

BASE_URL: `https://kotoclip.onrender.com`
トークン保存: AsyncStorage（`vocab_token` / `vocab_refresh`）

## 認証フロー
1. `api.login(email, password)` → access_token + refresh_token を AsyncStorage に保存
2. `_fetch()` は全リクエストに `Authorization: Bearer <token>` を付与
3. 401 → `refreshAccessToken()` を1回試みる → 失敗なら `clearTokens()` + `onAuthExpired()` 発火
4. `setAuthExpiredHandler(fn)` で未認証時のハンドラを登録（auth.tsx が登録済み）

## 認証コンテキスト（context/auth.tsx）

```ts
const { state, login, signup, logout } = useAuth();
// state: 'loading' | 'authenticated' | 'unauthenticated'
```

- `AuthProvider` をルートに配置済み（app/_layout.tsx）
- `state === 'loading'` の間は画面遷移しない

## 認証エンドポイント（サーバー側: auth_router.py）

| メソッド | パス | リクエスト | レスポンス |
|---|---|---|---|
| POST | `/api/auth/login` | `{email, password}` | `{user_id, access_token, refresh_token}` |
| POST | `/api/auth/signup` | `{email, password}` | `{user_id, access_token, refresh_token}` |
| POST | `/api/auth/refresh` | `{refresh_token}` | `{access_token, refresh_token}` |
| POST | `/api/auth/logout` | — | `{status: 'ok'}` |

## API メソッド一覧

```ts
// 統計・ホーム
// ⚠️ getStats() はフィールドを正規化して返す。サーバーは due_count/total_words/mastered_count だが
//    クライアント側で due/total/mastered にマッピング済み（lib/api.ts）
api.getStats()          // → {due, total, mastered, streak, reliable_count, today_count, wild_known_count}

// 学習
api.getDue(limit=20)    // → Word[]  SRS期限済み
api.getAllWords(limit?, random=false)  // → Word[]
api.getChoices(wordId)  // → Word[]  選択肢（不正解4語）
api.postReview(wordId, rating: 'good'|'hard'|'again', elapsedDays=1)
                        // → {next_review, ...}

// 単語帳
api.listWords()         // → Word[]
api.getWord(id)         // → Word（詳細）
api.getTimeline(id)     // → TimelineEvent[]
api.addWord(payload)
api.updateMemo(id, memo)
api.toggleFavorite(id, value: boolean)
api.deleteWord(id)
api.retranslate(id)     // → POST /api/words/{id}/retranslate（AI再翻訳）

// 野生検出
api.getTodayEncounters() // → Encounter[]

// 設定・ゴール
api.getSettings()
api.updateSetting(key, value)
api.getGoal()
api.setGoal(goal: number)
```

## Word 型（主要フィールド）

```ts
interface Word {
  id: number;
  word: string;
  meaning: string;
  part_of_speech?: string;
  reading?: string;
  context?: string;
  memo?: string;
  ai_explanation?: string;
  reps?: number;           // 復習回数（mastered = reps >= 5）
  correct_count?: number;
  wrong_count?: number;
  wild_count?: number;
  next_review?: string;    // ISO 日付文字列
  created_at?: string;
  is_favorite?: number | boolean;
}
```

## Encounter 型

```ts
interface Encounter {
  id: number;
  word: string;
  meaning: string;
  result: 'knew' | string;
  is_early_reunion: boolean | number;
  source_url?: string;
  encountered_at: string;
  word_id?: number;
}
```

## SharedStorage（Share Extension 連携）

iOS Share Extension がトークンを読み取れるよう、ログイン時に App Group UserDefaults にも書き込む。

```ts
import SharedStorage from 'shared-storage'; // modules/shared-storage

// saveTokens() 内で呼ぶ（Android / Expo Go では try/catch でスキップ）
SharedStorage.setItem('vocab_token', access);

// clearTokens() 内で呼ぶ
SharedStorage.removeItem('vocab_token');
```

Suite name: `group.jp.kotoclip.app`（iOS のみ有効）
詳細アーキテクチャ → `.claude/skills/share-extension.md`
