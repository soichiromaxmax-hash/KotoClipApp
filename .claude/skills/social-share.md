---
name: social-share
description: SNS共有カード（Streak Flex・Word Mastered）の実装・発火条件・UXルール・ファイル構成を調べるとき
---

# SNS共有カード

## 実装済みファイル
```
lib/shareCard.ts                     発火条件・AsyncStorage管理・型定義
components/share/KotoLogo.tsx        Koto/Clipロゴコンポーネント（カード内共通）
components/share/StreakCard.tsx      連続学習達成カード
components/share/WordMasteredCard.tsx 単語習得カード
components/share/SharePrompt.tsx    モーダル（react-native-view-shot + expo-sharing）
```

## 発火条件

### Streak Flex
```ts
// 7, 30, 50, 80, 100日 + 100日以降は20日ごと
isStreakMilestone(days) // → boolean
```
ストリーク到達後に `api.getStats()` で確認し、未表示マイルストーンなら表示。

### Word Mastered
セッション中に `word.reps >= 4 && rating === 'good'` → 5回目の正解 → 習得とみなし1件だけ記録。
セッション終了後（`result` フェーズ移行時）に1回だけ表示。

### 抑制ルール
- AsyncStorage `koto_share_state_v1` に表示済みマイルストーン・単語IDを保存
- 同じマイルストーンは1度しか出さない
- 「あとで」を押しても dismissed として記録 → 二度と出さない

## Phase 2 以降（未実装）
- Memory Rate カード（定着率改善後の週次）
- Daily Encounter カード（5語以上保存した日）

## 依存ライブラリ
```bash
# インストール済み（2026-05-01）
react-native-view-shot  expo-sharing
```
package.json 追加済み・`eas build` で自動リンク。追加インストール不要。

## SNS別シェア動作
| プラットフォーム | 動作 |
|---|---|
| Instagram / X / LINE / Facebook / LinkedIn | `Sharing.shareAsync(uri)` でiOS純正シェートシートを開く |
| 「成果をシェア」ボタン | 同上（全アプリ選択可） |

**TikTokは削除済み。追加しないこと。**
`handlePlatform()` はプラットフォームに関係なく `Sharing.shareAsync(uri)` を呼ぶ統一実装。

## SharePayload 型
```ts
type SharePayload =
  | { type: 'streak'; streakDays: number; savedWords: number; retentionRate: number; reviewedToday: number }
  | { type: 'word_mastered'; wordId: number; word: string; meaning: string;
      reviewCount: number; daysToMaster: number; masteryRank: 'S'|'A'|'B' }
```

## カードビジュアル仕様
- サイズ: `SCREEN_WIDTH * 0.78` × 9:16（モーダル内）→ キャプチャ後 PNG でシェア
- 背景: `#0E1116` + SVG RadialGradient（上部 mint 0.13 / 右下 gold 0.10）
- カラー: mint=`#7CF7DF` / gold=`#F5B84B` / text=`#F8FAFC` / muted=`#94A3B8`

## UXルール（厳守）
- 毎日出さない / 強制モーダル禁止 / 広告に見えるデザイン禁止
- 「あとで」を選んでも同じマイルストーンを再表示しない
- result フェーズに移行 → API取得 → 条件一致したら prompt 表示（非同期・非ブロッキング）

## ハッシュタグ
Streak: `#KotoClip #英語学習 #単語帳`
Word Mastered: `あなたの今日の1語は？`
