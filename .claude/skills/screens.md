---
name: screens
description: 各画面の実装詳細・ルーティング・コンポーネント構成・実装ステータスを調べるとき
---

# 画面構成 & 実装ステータス（2026-05-06更新）

## ファイルマップ

```
app/
├── _layout.tsx          認証ゲート・フォント読込・Stack定義・オンボーディング表示・useRenderWarmup()
├── how-to.tsx           使い方画面（設定から遷移）
├── add.tsx              単語追加（スタック版・/add で開く）
├── flashcard.tsx        フラッシュカード（10枚バッチ）
├── auth/
│   ├── _layout.tsx
│   └── login.tsx        ログイン/サインアップ切り替え式
├── word/
│   └── [id].tsx         単語詳細・AI再翻訳・メモ・削除・タイムライン
└── (tabs)/
    ├── _layout.tsx      タブバー（home / school / add-circle / library / settings）
    ├── index.tsx        ホーム ← 空状態 KotoBird・warm-up ping対応済み
    ├── study.tsx        クイズ練習（4択のみ・スケジュール/フリー）
    ├── add.tsx          手動追加タブ
    ├── words.tsx        単語帳 ← 空状態 KotoBird 対応済み
    ├── settings.tsx     設定 ← 通知設定・iOS通知設定リンク
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
  <Stack.Screen name="how-to" />
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
- CTAカード: 今日の復習 / フラッシュカード🃏（紫・目立つ色） / クイズ練習✏️（ティール） / 手動追加
- ストリップ統計: 今日の復習 / 今日覚えた / 野生で認識 / 定着済み

**パフォーマンス:**
タブ切り替え時はキャッシュ（モジュールレベル `_cachedStats`）を即表示。
初回のみスピナー表示。`withTimeout(15000)` でRender cold startに対応。
`_layout.tsx` の `useRenderWarmup()` がアプリ起動時に `/api/lookup?word=hello` をバックグラウンドでpingしてRenderを温める。

API: `api.getStats()` + `api.getTodayEncounters()`

---

## クイズ練習 `(tabs)/study.tsx`

**モード:** `scheduled`（`api.getDue(20)`）/ `free`（`api.getAllWords(10, true)`）

**問題タイプ（確定・変更禁止）:**
- scheduled + reps=0 → 4択（単語→意味）
- scheduled + reps>=1 → 4択（意味→単語）
- free → 4択（choice / reverse のどちらか）

**穴埋め形式は廃止済み。追加しないこと。**

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
1. `words.length === 0` → KotoBird(100) + 「最初の単語を追加する」ボタン
2. `sorted.length === 0`（フィルター空）→ 「該当する単語がありません」テキストのみ

フィルター: all / new(reps=0) / learning(reps1-4) / mastered(reps>=5) / favorites

---

## 設定 `(tabs)/settings.tsx`

**構成（上から順）:**
1. 「KotoClipの使い方」行（mint色 + chevron）→ `/how-to` 遷移
2. 通知設定（4行トグル）: 毎日リマインダー・ストリーク危機・マイルストーン・週次サマリー
3. リマインダー時刻（モーダルピッカー・0:00〜23:30・30分刻み）
4. 「iOS通知設定を開く」ボタン → `Linking.openURL('app-settings:')`
5. ログアウト（`Alert.alert` 確認ダイアログ付き）

※ 偶然の再会・記念日通知トグルは2026-05-06に削除済み。
※ 学習目標セクションも削除済み。

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
