---
name: screens
description: 各画面の実装詳細・ルーティング・コンポーネント構成・実装ステータスを調べるとき
---

# 画面構成 & 実装ステータス（2026-05-06更新）

## ファイルマップ

```
app/
├── _layout.tsx          認証ゲート・フォント読込・Stack定義・オンボーディング表示
├── how-to.tsx           使い方画面（設定から遷移）← 新規 2026-05-01
├── add.tsx              単語追加（スタック版・/add で開く）
├── flashcard.tsx        フラッシュカード（10枚）
├── modal.tsx            汎用モーダル
├── auth/
│   ├── _layout.tsx
│   └── login.tsx        ログイン/サインアップ切り替え式
├── word/
│   └── [id].tsx         単語詳細・AI再翻訳・メモ・削除・タイムライン
└── (tabs)/
    ├── _layout.tsx      タブバー（home / school / add-circle / library / settings）
    ├── index.tsx        ホーム ← 空状態 KotoBird 対応済み
    ├── study.tsx        学習（SRS復習 / 自由練習）
    ├── add.tsx          手動追加タブ ← AI文言・保存メッセージ改善済み
    ├── words.tsx        単語帳 ← 空状態 KotoBird 対応済み
    ├── settings.tsx     設定 ← 使い方リンク・ログアウト確認ダイアログ済み
    └── wild.tsx         野生検出（タブバー非表示・href: null）

components/
├── KotoBird.tsx         黄色い鳥（全画面で使用）← design.md 参照
├── Onboarding.tsx       オンボーディング ← さわらない
├── SplashAnimation.tsx  スプラッシュ
└── share/               SNS共有（social-share.md 参照）
```

## Stack 定義（app/_layout.tsx）

```tsx
<Stack screenOptions={{ headerShown: false }}>
  <Stack.Screen name="(tabs)" />
  <Stack.Screen name="auth" />
  <Stack.Screen name="word" />
  <Stack.Screen name="flashcard" />
  <Stack.Screen name="add" />
  <Stack.Screen name="how-to" />   // 2026-05-01 追加
</Stack>
```

遷移例: `router.push('/how-to')` / `router.push('/add')` / `router.push('/(tabs)/study')`

---

## ホーム `(tabs)/index.tsx`

**空状態（`stats.total === 0`）:**
- KotoBird(130) + KotoClipロゴ + 「まだ単語がありません」
- 「最初の単語を追加する」→ `/add`
- 「スマホから保存する方法を見る」→ `/how-to`

**通常状態（`stats.total > 0`）:**
- ヒーロー: KotoBird(110) + 統計パネル（確実に習得 / 登録語数 / 連続日数）
- KotoClipロゴ + 進捗テキスト + プログレスバー
- CTAカード: 今日の復習 / フラッシュカード🃏（mint） / クイズ練習✏️（紫） / 手動追加
- ストリップ統計: 今日の復習 / 今日覚えた / 野生で認識 / 定着済み
- Today's Encounters（野生単語があるときのみ）

API: `api.getStats()` + `api.getTodayEncounters()`
統計フィールド: `reliable_count / total / streak / due / today_count / wild_known_count`

**パフォーマンス:**
タブ切り替え時はキャッシュ（モジュールレベル `_cachedStats`）を即表示し、
バックグラウンドで更新。初回のみスピナーを表示。

---

## 学習 `(tabs)/study.tsx`

**モード:** `scheduled`（`api.getDue(20)`）/ `free`（`api.getAllWords(10, true)`）

**問題タイプ:**
- scheduled + reps=0 → ChoiceQuestion（4択: 単語→意味）
- scheduled + reps>=1 → WordBankQuestion（タイル: 意味/文脈→単語）
- free → ChoiceQuestion4（サーバーから問題取得: choice / reverse / context_choice）

**フィードバックメッセージ:**
- 正解: `正解！ 次回はもっと後に出てきます。`
- 不正解: `不正解… 正解: X。もう一度出てきます。`

**セッション後:** SNS共有チェック（`checkStreakShare` / `checkWordShare`）→ SharePrompt 表示

---

## 単語追加タブ `(tabs)/add.tsx`

- AIボタン: 「AIで意味を自動入力」→ `api.lookup(word)` で訳・例文取得
- 保存成功メッセージ: 「保存できました。あとで復習に出てきます。」
- 重複: 「〇〇はすでに登録済みです」

---

## 単語帳 `(tabs)/words.tsx`

**空状態の2段階:**
1. `words.length === 0`（登録ゼロ）→ KotoBird(100) + 「最初の単語を追加する」ボタン
2. `sorted.length === 0`（フィルター空）→ 「該当する単語がありません」テキストのみ

フィルター: all / new(reps=0) / learning(reps1-4) / mastered(reps>=5) / favorites
ソート: created_desc / alpha / reps_desc
お気に入り: 楽観的更新（失敗時ロールバック）

---

## 設定 `(tabs)/settings.tsx`

**構成（上から順）:**
1. 「KotoClipの使い方」行（mint色 + chevron）→ `/how-to` 遷移
2. 通知設定（6行トグル）
3. リマインダー時刻（モーダルピッカー）
4. ログアウト（`Alert.alert` 確認ダイアログ付き）

※ 学習目標セクションは2026-05-06に削除済み。`GOAL_OPTIONS` / `changeGoal` / `api.getGoal()` も除去。

---

## 使い方 `how-to.tsx`

設定画面から遷移するスタック画面。

セクション:
1. 📱 スマホから単語を保存する（5ステップ）
2. ✏️ 手動で単語を追加する（4ステップ）
3. 🔁 復習の仕組み（4ステップ）
4. ⚡ 今日の出会いとは？（3ステップ）
5. FAQ（3問: Share Extension / 復習タイミング / 所要時間）

---

## オンボーディング `components/Onboarding.tsx`

**さわらない。** `_layout.tsx` の `hasSeenOnboarding()` で初回のみ表示。
デザインリファレンス（閲覧のみ）:
`C:\Users\SoichiroKamibeppu(MC\Documents\Codex\2026-04-25\new-chat\kotoclip-onboarding-preview-v6.html`

---

## 認証ゲート（app/_layout.tsx）

```ts
state === 'loading'          → 何もしない
state === 'unauthenticated'  → router.replace('/auth/login')
state === 'authenticated' && inAuth → router.replace('/(tabs)')
state === 'authenticated' && !inAuth → hasSeenOnboarding() → 未見なら showOnboarding=true
```

`import 'react-native-reanimated'` を削除しない（RootLayoutNav の先頭に必要）。
