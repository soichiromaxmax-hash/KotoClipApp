---
name: architecture
description: ファイル構成・homeCache パターン・通知ライブラリ・重要な実装パターンを調べるとき
---

# アーキテクチャ概要

## ファイル構成（主要）

```
app/
├── _layout.tsx          認証ゲート・フォント読込・Stack定義・オンボーディング・useRenderWarmup
├── how-to.tsx           使い方画面
├── flashcard.tsx        フラッシュカード（10枚バッチ）
├── auth/login.tsx       ログイン/サインアップ
├── word/[id].tsx        単語詳細・AI再翻訳・メモ・削除・タイムライン
└── (tabs)/
    ├── _layout.tsx      タブバー定義
    ├── index.tsx        ホーム
    ├── study.tsx        クイズ練習（4択のみ）
    ├── add.tsx          手動追加（唯一のaddスクリーン・app/add.tsx は削除済み）
    ├── words.tsx        単語帳
    ├── settings.tsx     設定・通知設定
    └── wild.tsx         野生検出（href: null）

lib/
├── api.ts               API クライアント（全エンドポイント）
├── homeCache.ts         ホーム統計キャッシュ（モジュールレベルシングルトン）
└── notifications.ts     通知ライブラリ（expo-notifications ~0.31.0）

context/
└── auth.tsx             AuthContext（state: loading/authenticated/unauthenticated）

components/
├── KotoBird.tsx         黄色い鳥キャラクター（1種類のみ）
├── Onboarding.tsx       オンボーディング（さわらない）
└── share/               SNS共有カード一式
```

## homeCache パターン（lib/homeCache.ts）

モジュールレベルシングルトン。タブ切り替えのたびにAPIを叩かないよう初回取得結果をキャッシュ。

```ts
getCachedStats()    // StatsResponse | null
getCachedWild()     // Encounter[] | null
setCachedStats(s)
setCachedWild(w)
resetHomeCache()    // 両方 null にリセット → 次回フォーカスでAPIを再取得させる
```

**resetHomeCache() を必ず呼ぶ場面:**
- `study.tsx`: 学習完了時（`next()` が result フェーズに移行するとき）
- `study.tsx`: キュー空で `loadQueue()` が終了したとき
- `context/auth.tsx`: 認証期限切れコールバック（`setAuthExpiredHandler`）
- `context/auth.tsx`: logout 時

## 通知ライブラリ（lib/notifications.ts）

```ts
requestPermission()                      // iOS権限リクエスト → status 返す
getPermissionStatus()                    // 現在の権限状態を返す
scheduleDailyReminder(time: string)      // "HH:MM" 形式・毎日トリガー・identifier: 'daily_reminder'
cancelDailyReminder()
scheduleWeeklySummary()                  // 毎週月曜 9:00・identifier: 'weekly_summary'
cancelWeeklySummary()
sendMilestoneNotification(mastered)      // 即時通知（定着語数マイルストーン）
sendStreakNotification(streak)           // 即時通知（連続日数7の倍数）
syncNotifications(settings)             // settings オブジェクト全体を読んでまとめてon/off
```

**isOn() 挙動**: `undefined/null` を `true`（ON）として扱う。
APIが未設定キーを返したとき全通知がデフォルトONになる意図的な設計。

**発火条件（study.tsx）:**
- 定着語数が `[10, 25, 50, 100, 200, 500]` のいずれかに達した → `sendMilestoneNotification`
- ストリーク > 0 かつ 7の倍数 → `sendStreakNotification`

## 重要パターン

### useFocusEffect
```ts
import { useFocusEffect } from 'expo-router';  // ← SDK56では必ずここから
// 'expo-router/react-navigation' は TypeScript で解決不可。絶対に使わない。
```

### async function を hooks で使う場合は useCallback でラップ
```ts
const loadData = useCallback(async (arg: Arg) => {
  // ...
}, []);  // deps は安定した値のみ

useEffect(() => {
  loadData(value);
}, [value, loadData]);  // loadData を deps に含める（ESLint react-hooks/exhaustive-deps）
```

### Render.com コールドスタート対策
`_layout.tsx` の `useRenderWarmup()` が起動時に以下をバックグラウンドpingする:
```ts
fetch('https://kotoclip.onrender.com').catch(() => {});
// ルートURL のみ。/api/lookup 等の有料AIエンドポイントは叩かない。
```
`lib/api.ts` の全リクエストは `withTimeout(15000)` でラップ（15秒タイムアウト）。

### 認証期限切れフロー
```
api._fetch() → 401 → refreshAccessToken() 失敗
→ clearTokens() + onAuthExpired() 発火
→ context/auth.tsx: resetHomeCache() + setState('unauthenticated')
→ _layout.tsx useEffect: router.replace('/auth/login')
```

### オンボーディング表示（初回のみ）
```ts
// _layout.tsx
const onboardingChecked = useRef(false);

// useEffect内: state === 'authenticated' && !inAuth && !onboardingChecked.current の場合のみ
onboardingChecked.current = true;
hasSeenOnboarding().then((seen) => { if (!seen) setShowOnboarding(true); });
// ref を使うことでタブ切り替えごとに再チェックされるのを防ぐ
```
