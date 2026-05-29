# KotoClip — 完全引き継ぎメモ

**更新日: 2026-05-29**

---

## このアプリとは

語彙学習iOSアプリ。単語をクリップして、フラッシュカードやクイズで復習する。
Share Extension でブラウザやアプリから単語を直接追加できる。

- バンドルID: `jp.kotoclip.app`
- バックエンド: Render にホスティング（詳細は HANDOVER.md）
- フロントエンド: React Native (Expo SDK 54 / expo-router)

---

## 現在の状態（2026-05-29）

| 項目 | 状態 |
|---|---|
| iPhoneにインストール済みのビルド | TestFlight ビルド #36（Codemagicで作成） |
| OTA更新（eas update） | **使えない**（Codemagicビルドは非対応） |
| EAS Build 無料枠 | **6月1日まで使い切り** |
| 次にやること | **6月1日に EAS Build でビルド → 以後は eas update で開発** |

### 6月1日にやること（これだけ）

```
cd "C:\Users\SoichiroKamibeppu(MC\KotoClipApp"
npx eas build --platform ios --profile production --auto-submit
```

30〜40分で TestFlight に自動送信される。
このビルドがiPhoneに入って初めて、以後の OTA 更新が使えるようになる。

---

## アカウント一覧

| サービス | アカウント / 情報 |
|---|---|
| Apple Developer | beckham.spaghetti@icloud.com |
| Apple Team ID | `9U2YJ4XL4K` |
| App Store Connect API Key ID | `HK23GAU47L` |
| App Store Connect Issuer ID | `39ebdc7c-2b5d-47b6-9a67-da83b74103fc` |
| .p8 ファイル（ローカル保存場所） | `C:\Users\SoichiroKamibeppu(MC\OneDrive\Desktop\ChatGPT Vocab Test\AuthKey_HK23GAU47L.p8` |
| Expo / EAS アカウント | soichiromax |
| EAS ダッシュボード | https://expo.dev/accounts/soichiromax/projects/kotoclip |
| GitHub リポジトリ | https://github.com/soichiromaxmax-hash/KotoClipApp |
| App Store Connect アプリID | `6765753980` |

---

## 開発のやり方

### パターン①：画面修正・バグ修正・機能追加（毎日の作業）

コードを変えたら：

```
cd "C:\Users\SoichiroKamibeppu(MC\KotoClipApp"
npx eas update --branch production --environment production --message "変更内容のメモ"
```

iPhoneのアプリを完全に閉じて（バックグラウンドから消す）再度開くと反映される。
**ビルド不要・無料・1〜2分で完了。**

> ※ 6月1日以降、EAS ビルドをインストールしてから使える。

---

### パターン②：TestFlight に新しいバージョンを送る（月1〜2回）

```
cd "C:\Users\SoichiroKamibeppu(MC\KotoClipApp"
npx eas build --platform ios --profile production --auto-submit
```

30〜40分で TestFlight に自動送信される。
**EAS 無料枠: 30回/月（毎月1日リセット）**

---

### パターン③：Swift・ネイティブコードを変えたとき

`targets/share-extension/ShareViewController.swift` や
`modules/shared-storage/ios/SharedStorageModule.swift` を変えた場合は
パターン①では反映されない。パターン②のフルビルドが必要。

---

## ファイル構成と役割

```
KotoClipApp/
│
├── app/                            ← 画面ファイル。ここをよく触る
│   ├── _layout.tsx                 ルート（認証チェック・フォント読み込み）
│   ├── flashcard.tsx               フラッシュカード画面
│   ├── how-to.tsx                  使い方画面
│   ├── auth/login.tsx              ログイン・新規登録
│   ├── word/[id].tsx               単語詳細・削除・AI再翻訳
│   └── (tabs)/
│       ├── index.tsx               ホーム画面（統計・ボタン）
│       ├── study.tsx               4択クイズ画面
│       ├── add.tsx                 単語追加画面
│       ├── words.tsx               単語一覧
│       └── settings.tsx            設定・ログアウト
│
├── lib/
│   ├── api.ts                      ★ API呼び出しはすべてここ経由
│   └── notifications.ts            通知のスケジュール管理
│
├── context/
│   └── auth.tsx                    ログイン状態の管理（useAuth フック）
│
├── components/
│   ├── KotoBird.tsx                黄色い鳥キャラ（絵文字で代替しない）
│   ├── Onboarding.tsx              ← 絶対に触るな（確定版）
│   └── SplashAnimation.tsx         起動時アニメーション
│
├── targets/share-extension/
│   └── ShareViewController.swift   Share Extension（Safariなどから単語を追加する機能）
│
├── modules/shared-storage/
│   └── ios/SharedStorageModule.swift   メインアプリとShare Extensionでトークンを共有する仕組み
│
├── plugins/
│   ├── withShareExtension.js       Share ExtensionをXcodeプロジェクトに組み込む設定
│   └── withoutPushEntitlement.js   不要なプッシュ通知権限を除去
│
├── ci_scripts/
│   └── ci_post_clone.sh            ← 絶対に触るな（iOSビルド用パッチが大量に入っている）
│
├── ios/                            ← 触るな（自動生成。手動で変えると壊れる）
│
├── app.json                        アプリ基本設定（バンドルID・EASプロジェクトID等）
├── eas.json                        EAS Build/Update のプロファイル設定
├── HANDOFF.md                      このファイル
└── HANDOVER.md                     アプリ全体の設計・API仕様・デザインルール
```

---

## 触っていいか一覧

| ファイル / フォルダ | 判断 | 理由 |
|---|---|---|
| `app/` 以下 | **自由に触る** | JSの変更はeas updateで即反映 |
| `lib/api.ts` | **自由に触る** | |
| `context/auth.tsx` | **自由に触る** | |
| `components/KotoBird.tsx` | **自由に触る** | |
| `targets/share-extension/ShareViewController.swift` | 触れる（要フルビルド） | Swift変更はeas updateでは反映されない |
| `components/Onboarding.tsx` | **絶対触るな** | 確定版。変えると画面が壊れる |
| `ci_scripts/ci_post_clone.sh` | **絶対触るな** | Swift 6バグへのパッチが大量に入っている。変えるとビルドが何十個ものエラーで失敗する |
| `ios/` 以下全般 | **触るな** | expo prebuildで自動生成される。手動で変えても次のビルドで上書きされる |

---

## Apple Developer Portal の確認場所

ビルドが失敗したときだけ確認する。基本は変更不要。

**App Group の設定（設定済み・変更不要）**
- `jp.kotoclip.app` に `group.jp.kotoclip.app` が紐付いている
- `jp.kotoclip.app.share` に `group.jp.kotoclip.app` が紐付いている
- 確認URL: https://developer.apple.com/account/resources/identifiers/list

**Distribution 証明書（上限3枚）**
- 確認・削除URL: https://developer.apple.com/account/resources/certificates/list
- 上限に達したら古いものを削除してからビルドする

---

## GitHub Actions ワークフロー（使わなくてよい）

`.github/workflows/build-testflight.yml` が存在するが、
**EAS Build が使える間は使わなくてよい。**

EAS Build は iOS 環境が整ったサーバーで動くため、GitHub Actions のような
「iOS SDKのダウンロードが必要」という問題が発生しない。

実行する場合: https://github.com/soichiromaxmax-hash/KotoClipApp/actions/workflows/build-testflight.yml

---

## 既知の未対応バグ

| バグ | 状況 |
|---|---|
| 起動時にアクセスできないことがある | バックエンド（Render）のスリープが原因の可能性。要調査 |
| iOS の通知設定が Settings 画面から機能しない | `lib/notifications.ts` と `app/(tabs)/settings.tsx` を要確認 |

---

## eas update でボタンを追加した（次のビルドで確認できる変更）

- フラッシュカード終了後の画面に「違う10枚へ」ボタンを追加済み（コミット済み）
- 現在 TestFlight に入っているビルドは Codemagic 製のため OTA が届かない
- 6月1日の EAS ビルド後に確認できる
