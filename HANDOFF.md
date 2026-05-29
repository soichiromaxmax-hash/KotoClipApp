# KotoClip — 開発・リリース 引き継ぎメモ

**更新日: 2026-05-29**

---

## 日常の開発フロー

### コードを変えてiPhoneで確認する（ビルド不要・無料）

```bash
cd "C:\Users\SoichiroKamibeppu(MC\KotoClipApp"
npx eas update --branch production --environment production --message "変更内容のメモ"
```

→ iPhoneのアプリを完全に閉じて再度開くと反映される。

**これで反映されないもの:**
- `ios/` 以下の変更（自動生成なので基本触らない）
- `targets/share-extension/ShareViewController.swift`
- `modules/shared-storage/ios/SharedStorageModule.swift`
- `app.json` のプラグイン設定

Swift やネイティブコードを変えた場合は、フルビルドが必要。

---

### TestFlight にビルドを送る（月1〜2回）

```bash
npx eas build --platform ios --profile production --auto-submit
```

→ 30〜40分でTestFlightに自動アップロードされる。

**EAS 無料枠: 30回/月（毎月1日リセット）**
次回利用可能: 2026年6月1日

**注意: このビルドが端末に入って初めて `eas update` が使えるようになる。**
現在 TestFlight に入っている Codemagic ビルドは OTA 非対応。

---

## アカウント・認証情報

| 種類 | 値 |
|---|---|
| Apple Developer | beckham.spaghetti@icloud.com |
| Apple Team ID | `9U2YJ4XL4K` |
| ASC API Key ID | `HK23GAU47L` |
| ASC Issuer ID | `39ebdc7c-2b5d-47b6-9a67-da83b74103fc` |
| .p8 ファイル（ローカル） | `OneDrive\Desktop\ChatGPT Vocab Test\AuthKey_HK23GAU47L.p8` |
| GitHub リポジトリ | https://github.com/soichiromaxmax-hash/KotoClipApp |
| EAS プロジェクト | https://expo.dev/accounts/soichiromax/projects/kotoclip |
| EAS project ID | `f90b1ad4-f8a9-4345-84f5-e1a5d443dbad` |
| App Store Connect App ID | `6765753980` |

---

## ファイル構成

```
KotoClipApp/
│
├── app/                        画面ファイル（expo-router）
│   ├── _layout.tsx             ルート: 認証ゲート・フォント読込
│   ├── flashcard.tsx           フラッシュカード画面（10枚バッチ復習）
│   ├── how-to.tsx              使い方説明
│   ├── auth/login.tsx          ログイン・新規登録
│   ├── word/[id].tsx           単語詳細・AI再翻訳・削除
│   └── (tabs)/
│       ├── index.tsx           ホーム（統計・CTA）
│       ├── study.tsx           クイズ練習（4択のみ）
│       ├── add.tsx             単語追加
│       ├── words.tsx           単語一覧
│       └── settings.tsx        設定・ログアウト
│
├── lib/
│   ├── api.ts                  ★ 全API呼び出しはここ経由（認証・リフレッシュ自動処理）
│   └── notifications.ts        通知スケジュール管理
│
├── context/auth.tsx            認証コンテキスト（useAuth フック）
│
├── components/
│   ├── KotoBird.tsx            黄色い鳥キャラ（空状態。絵文字で代替しない）
│   ├── Onboarding.tsx          ← 絶対触るな（確定版）
│   └── SplashAnimation.tsx     スプラッシュアニメーション
│
├── targets/share-extension/
│   └── ShareViewController.swift   Share Extension の Swift 実装
│
├── modules/shared-storage/
│   └── ios/SharedStorageModule.swift
│                               メインアプリ ↔ Share Extension のトークン共有
│
├── plugins/
│   ├── withShareExtension.js   Share Extension を Xcode に組み込む
│   └── withoutPushEntitlement.js  不要なプッシュ権限を削除
│
├── ci_scripts/
│   └── ci_post_clone.sh        ← 触るな（Swift 6パッチ・pod install）
│
├── ios/                        ← 触るな（expo prebuild で自動生成）
│
├── app.json                    EAS の設定・バンドルID など
├── eas.json                    EAS Build/Update のプロファイル設定
└── HANDOVER.md                 アプリ全体の設計・API・デザインルール
```

### 触っていいか一覧

| ファイル/フォルダ | 判断 |
|---|---|
| `app/` 以下 | **触ってよい**（JS/TSの変更はeas updateで反映） |
| `lib/api.ts` | **触ってよい** |
| `targets/share-extension/ShareViewController.swift` | 触ってよい（要フルビルド） |
| `components/Onboarding.tsx` | **絶対触るな** |
| `ci_scripts/ci_post_clone.sh` | **触るな**（Swift 6パッチが大量に入っている） |
| `ios/` 以下全般 | **触るな**（自動生成） |

---

## Apple Developer Portal の設定

ビルドが失敗したときに確認する箇所。

### App Group（設定済み・変更不要）

- `jp.kotoclip.app` → App Groups → `group.jp.kotoclip.app` ✓
- `jp.kotoclip.app.share` → App Groups → `group.jp.kotoclip.app` ✓

確認場所: https://developer.apple.com/account/resources/identifiers/list

---

## GitHub Actions ワークフロー（バックアップ）

`.github/workflows/build-testflight.yml` に存在する。
EASが使えないときの予備だが、**macos-15 の iOS プラットフォームが正しく設定されているかは未確認**。

実行場所: https://github.com/soichiromaxmax-hash/KotoClipApp/actions/workflows/build-testflight.yml

---

## 未対応の既知の問題

- スマホ起動時にアクセスできないことがある（バックエンドのコールドスタートが原因の可能性）
- iOS の通知設定が Settings 画面から機能しない
