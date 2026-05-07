# KotoClip iOS App — CLAUDE.md

## プロジェクト概要
英語を読みながら単語を保存 → SRS復習 → 語彙として定着させる iOS アプリ。
核心コピー: 「読んだ英語が、そのまま単語帳になる」

## リポジトリ構成
- `C:/Users/SoichiroKamibeppu(MC/KotoClipApp/` — このアプリ（Expo SDK 54 / React Native）
- `C:/Users/SoichiroKamibeppu(MC/anki_app/` — バックエンド（FastAPI）+ ブラウザ拡張
- API本番: `https://kotoclip.onrender.com/api`

## デザインの唯一の正解
`anki_app/frontend/style.css` の `:root` CSS変数。iOSはウェブ仕様を完全再現する。

## 確定した主要決定
- フォント: LobsterTwo（Koto）/ SpaceGrotesk（Clip）→ `_layout.tsx` でルート読込済み
- ミュートカラー: `#8F99A8`（`#6B7280` は間違い）、タブ非アクティブ: `#64748B`
- ルーティング: expo-router v3、タブは `(tabs)/`、スタックは `app/` 直下
- 認証: JWT（access + refresh）、AsyncStorage + App Group 共有
- EAS Build 必須（SharedStorage ネイティブモジュール使用、Expo Go 不可）
- バンドルID: `jp.kotoclip.app` / App Group: `group.jp.kotoclip.app`
- キャラクター: KotoBird（黄色い鳥）= `components/KotoBird.tsx` 1種類のみ
- 学習モード: クイズ練習（4択のみ・穴埋めなし）/ フラッシュカード（10枚バッチ）
- Share Extension: 認証不要でAI翻訳表示、保存時のみログイン要求
- SNS共有: iOS純正シェートシートのみ（TikTokなし）

## 現在のフェーズ（2026-05-06）
Build #21 完了（EAS ID: `39929ac5-83c8-442c-b77c-21eacd6cf38c`）。TestFlight 未提出。
次ステップ: `eas submit` → TestFlight 確認 → App Store 審査。

## 禁止事項
- ミュートカラーに `#6B7280` を使わない（必ず `#8F99A8`）
- ウェブと異なるデザインを勝手に追加しない
- Expo Go で動作確認しない（EAS Build 必須）
- オンボーディング（`components/Onboarding.tsx`）をさわらない
- KotoBird 以外のキャラクターやアイコンで空状態を表現しない
- クイズ練習に穴埋め形式を追加しない（4択のみ確定）

## 詳細が必要なとき
対応するウェブファイルを直接読むか、以下のスキルを参照すること。
- デザイントークン・KotoBird仕様 → `.claude/skills/design.md`
- 画面構成・実装ステータス → `.claude/skills/screens.md`
- API・認証・AsyncStorageキー → `.claude/skills/api.md`
- ビルド手順・ロードマップ → `.claude/skills/build.md`
- Share Extension 仕組み → `.claude/skills/share-extension.md`
- SNS共有カード仕様 → `.claude/skills/social-share.md`
