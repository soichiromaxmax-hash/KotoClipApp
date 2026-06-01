# KotoClip iOS App — CLAUDE.md

## プロジェクト概要
英語を読みながら単語を保存 → SRS復習 → 語彙として定着させる iOS アプリ。
核心コピー: 「読んだ英語が、そのまま単語帳になる」

## 技術スタック
- Expo SDK ~55.0.26 / React Native 0.83.6 / expo-router ~55.0.16
- バックエンド: FastAPI（`https://kotoclip.onrender.com/api`）
- ビルド: EAS Build のみ（SharedStorage ネイティブモジュールのため Expo Go 不可）
- バンドルID: `jp.kotoclip.app` / App Group: `group.jp.kotoclip.app`

## 確定した主要決定
- フォント: LobsterTwo（Koto）/ SpaceGrotesk（Clip）→ `_layout.tsx` で読込済み
- ミュートカラー: `#8F99A8`（`#6B7280` は間違い）、タブ非アクティブ: `#64748B`
- 認証: JWT（access + refresh）、AsyncStorage + App Group 共有
- 学習モード: クイズ練習（4択のみ・穴埋めなし）/ フラッシュカード（10枚バッチ）
- キャラクター: KotoBird（黄色い鳥）= `components/KotoBird.tsx` 1種類のみ
- Share Extension: 認証不要でAI翻訳表示、保存時のみログイン要求
- 通知: expo-notifications ~55.0.23 / 毎日リマインダー / 週次サマリー / マイルストーン / ストリーク
- SNS共有: iOS純正シェートシートのみ（TikTok・プラットフォーム別分岐なし）

## 現在のフェーズ（2026-06-01）
Build #53（EAS、buildNumber はEASがremote管理するため app.json の値は参照されない）。TestFlight 未提出。
次ステップ: EAS Build → TestFlight 確認 → App Store 審査。

## 禁止事項
- `from 'expo-router/react-navigation'` や `from 'expo-router/js-tabs'` は使わない（解決不可）
- `useFocusEffect` は必ず `from 'expo-router'` からインポートする
- `router.push('/add')` は使わない（`app/add.tsx` は削除済み）→ `'/(tabs)/add'` を使う
- `@react-navigation/*` パッケージは追加しない（package.json に存在しない）
- `expo-media-library` は使わない（削除済み）
- ミュートカラーに `#6B7280` を使わない（必ず `#8F99A8`）
- クイズ練習に穴埋め形式を追加しない（4択のみ確定）
- TikTokシェアを追加しない（`LSApplicationQueriesSchemes` から削除済み）
- `Onboarding.tsx` をさわらない
- Render.com warmup は `fetch('https://kotoclip.onrender.com')` のみ（AI APIを叩かない・有料）

## Expo Doctor 許容している警告（1件）

> **Check for app config fields that may not be synced in a non-CNG project**

`ios/` が git に含まれるため出る警告。EAS Build は `ios/` がコミット済みの場合 `expo prebuild` を実行しない（コミット済みのネイティブコードをそのまま使用する）。`app.json` のプラグイン・アイコン等を変更した場合はローカルで `npx expo prebuild` を実行してコミットしてから EAS Build を行うこと。

## 詳細が必要なとき
- デザイントークン・KotoBird仕様 → `.claude/skills/design.md`
- 画面構成・ルーティング・実装詳細 → `.claude/skills/screens.md`
- API・認証・AsyncStorageキー → `.claude/skills/api.md`
- アーキテクチャ・homeCache・通知ライブラリ → `.claude/skills/architecture.md`
- ビルド手順・TestFlight・ロードマップ → `.claude/skills/build.md`
- Share Extension 実装詳細 → `.claude/skills/share-extension.md`
- SNS共有カード仕様 → `.claude/skills/social-share.md`
