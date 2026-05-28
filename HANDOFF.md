# KotoClip — TestFlight 配信 引き継ぎメモ

**更新日: 2026-05-28 / 最新コミット: `9b48541`（作業中）**

---

## このメモの目的

GitHub Actions で TestFlight にビルドを送る仕組みを作ってきた。
同じエラーで何度もループしないために、「なぜそのエラーが起きるか」を丁寧に書いた。

---

## 現在の状態（2026-05-28 時点）

| 項目 | 状態 |
|---|---|
| ビルド番号（app.json） | **53** |
| GitHub Actions ワークフロー | `.github/workflows/build-testflight.yml` |
| TestFlight 到達 | **未達。Archive ステップで失敗中** |

### 今どこで止まっているか

```
SplashScreen.storyboard: error: iOS 18.4 Platform Not Installed.
```

**原因:** `xcodebuild archive` の途中で `ibtool`（Xcodeのstoryboardコンパイラ）が
iOS 18.4 シミュレータランタイムを要求する。
GitHub Actions の `macos-15` ランナーには Xcode 16.3 は入っているが、
iOS 18.4 シミュレータランタイムが入っていない。

**適用済みの修正（次回ビルドで効くはず）:**
最新コミット（`9b48541`まだ未テスト）で `xcodebuild -downloadPlatform iOS` ステップを追加済み。
これがシミュレータランタイムをダウンロードする（約10〜15分追加）。

### 次にやること

1. GitHub Actions でビルドを走らせる
2. 成功したら TestFlight に届く
3. 成功したら `DISTRIBUTION_CERT_P12` / `DISTRIBUTION_CERT_PASSWORD` をログから取得して GitHub Secrets に保存

---

## ビルドの実行方法

1. https://github.com/soichiromaxmax-hash/KotoClipApp/actions/workflows/build-testflight.yml を開く
2. **"Run workflow"** → **"Run workflow"**
3. 40〜55分待つ（iOS platform ダウンロード込み）
4. 成功 → TestFlight に自動アップロード
5. 失敗 → 下の「エラー別対処」を読む

---

## 必要なアカウント・認証情報

| 種類 | 値 |
|---|---|
| Apple Developer | beckham.spaghetti@icloud.com |
| GitHub リポジトリ | https://github.com/soichiromaxmax-hash/KotoClipApp |
| Apple Team ID | `9U2YJ4XL4K` |
| ASC API Key ID | `HK23GAU47L` |
| ASC Issuer ID | `39ebdc7c-2b5d-47b6-9a67-da83b74103fc` |
| .p8 ファイル（ローカル） | `OneDrive\Desktop\ChatGPT Vocab Test\AuthKey_HK23GAU47L.p8` |

### GitHub Secrets（変更不要・設定済み）

| Secret 名 | 内容 |
|---|---|
| `APP_STORE_CONNECT_API_KEY_CONTENT` | .p8ファイルの中身 |
| `APP_STORE_CONNECT_API_KEY_ID` | `HK23GAU47L` |
| `APP_STORE_CONNECT_API_ISSUER_ID` | `39ebdc7c-2b5d-47b6-9a67-da83b74103fc` |
| `DISTRIBUTION_CERT_P12` | Distribution証明書（base64）← **初回ビルド成功後にログから取得して登録** |
| `DISTRIBUTION_CERT_PASSWORD` | 上記のパスワード ← 同上 |

`DISTRIBUTION_CERT_P12` が空の場合、ビルドが自動で証明書を作成してログに表示する。
「Setup Distribution certificate」ステップのログ末尾にある値を GitHub Secrets に保存すること。

---

## Apple Developer Portal の設定（Macなし・ブラウザのみ）

**これが未設定だとビルドは絶対に通らない。**

### App Group の作成

1. https://developer.apple.com/account/resources/identifiers/list/applicationGroup
2. `+` → "App Groups" → Identifier: `group.jp.kotoclip.app` → Register

### メインアプリへの紐付け

1. https://developer.apple.com/account/resources/identifiers/list
2. `jp.kotoclip.app` → App Groups → Configure → `group.jp.kotoclip.app` にチェック → Save

### Share Extension への紐付け

1. 同リストから `jp.kotoclip.app.share` → 同じ操作

---

## ビルドの流れ（ワークフロー内で何が起きているか）

```
① コードをチェックアウト
② Xcode 16 を選択
③ iOS 18.4 シミュレータランタイムをダウンロード（★新規追加・約10〜15分）
④ Node.js 20 をセットアップ
⑤ App Store Connect API キーをファイルに書き出す
⑥ ci_scripts/ci_post_clone.sh を実行
   └── npm install
   └── Expo SDK / React Native の Swift 6 バグをパッチ（大量のPythonスクリプト）
   └── pod install（CocoaPods）
   └── Xcodeプロジェクトの設定を修正（Swift バージョン・AppIntentsSSUTraining スタブ等）
⑦ Distribution 証明書を取得 or インポート
⑧ fastlane sigh でプロビジョニングプロファイルをダウンロード（App Groups入りを確認）
   └── プロファイルの UUID を GITHUB_ENV に保存
⑨ project.pbxproj を手動署名用にパッチ
   └── CODE_SIGN_STYLE = Manual
   └── 各ターゲットに PROVISIONING_PROFILE_SPECIFIER を設定
⑩ xcodebuild archive
⑪ xcodebuild -exportArchive（IPA生成）
⑫ xcrun altool で TestFlight にアップロード
```

---

## プロジェクト全体のファイル構成

```
KotoClipApp/
│
├── .github/workflows/
│   └── build-testflight.yml    ★ GitHub Actions ビルド定義。最もよく触る
│
├── ci_scripts/
│   └── ci_post_clone.sh        ★ Swift 6バグパッチ・pod install・pbxproj修正。触るな
│
├── app.json                    ★ buildNumber はここ（TestFlight再送のたびに +1 必須）
│
├── app/                        画面ファイル（expo-router）
│   ├── _layout.tsx             ルート: 認証ゲート・フォント読込・Renderウォームアップ
│   ├── flashcard.tsx           フラッシュカード画面（10枚バッチ復習）
│   ├── how-to.tsx              使い方説明
│   ├── auth/login.tsx          ログイン・新規登録
│   ├── word/[id].tsx           単語詳細・AI再翻訳・削除
│   └── (tabs)/
│       ├── _layout.tsx         タブバー定義
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
│   ├── Onboarding.tsx          ★ 触るな（確定版）
│   └── SplashAnimation.tsx     スプラッシュアニメーション
│
├── modules/shared-storage/
│   └── ios/SharedStorageModule.swift
│                               App Group の UserDefaults アクセス
│                               （メインアプリ ↔ Share Extension のトークン共有）
│
├── targets/share-extension/
│   └── ShareViewController.swift
│                               Share Extension の Swift 実装本体
│
├── plugins/
│   ├── withShareExtension.js   Share Extension を Xcode プロジェクトに組み込む
│   └── withoutPushEntitlement.js  不要なプッシュ権限を削除
│
├── ios/                        expo prebuild + pod install で自動生成。手動で触らない
│   ├── KotoClip.xcodeproj/
│   │   └── project.pbxproj    Xcodeプロジェクト設定（CI が自動パッチ）
│   ├── KotoClip/
│   │   ├── SplashScreen.storyboard  スプラッシュ画面（ibtool が使う）
│   │   └── KotoClip.entitlements   App Group設定（group.jp.kotoclip.app）
│   ├── ShareExtension/
│   │   └── ShareExtension.entitlements
│   └── Podfile                 CocoaPods設定（ci_post_clone.sh がパッチを当てる）
│
├── ios-stubs/
│   └── AppIntentsSSUTraining.framework/
│                               自作スタブ。ShareExtension のリンクエラー回避用
│                               （ci_post_clone.sh が自動生成）
│
├── HANDOFF.md                  このファイル（TestFlight配信の引き継ぎ）
└── HANDOVER.md                 アプリ全体の設計・API・デザインルール
```

### 触っていいか一覧

| ファイル | 判断 |
|---|---|
| `.github/workflows/build-testflight.yml` | **触る（ビルドが壊れたとき）** |
| `ci_scripts/ci_post_clone.sh` | **触るな**（Swift 6パッチが大量に入っている） |
| `app.json` | **触る**（buildNumber の更新のみ） |
| `lib/api.ts` | 触ってよい |
| `targets/share-extension/ShareViewController.swift` | 触ってよい |
| `components/Onboarding.tsx` | **絶対触るな** |
| `ios/` 以下全般 | **触るな**（自動生成・CIが都度パッチ） |

---

## [重要] 署名（コードサイニング）の仕組みと罠

**ここを読まないと同じエラーで何日も詰まる。**

### 署名モードの選択

| モード | 特徴 | CI向きか |
|---|---|---|
| Automatic | Xcode が端末を登録して開発用プロファイルを自動作成 | **× NG**（登録端末が必要） |
| Manual | あらかじめ用意したプロファイルを渡す | **○ OK** |

→ **CI では必ず Manual。**

### なぜ App Groups が問題になるか

1. Portal 上で App Groups が有効でないと
2. fastlane sigh がダウンロードするプロファイルにも App Groups が含まれない
3. `xcodebuild archive` が「App Groups 対応プロファイルが必要」とエラー

### なぜ `-allowProvisioningUpdates` を外したか

`-allowProvisioningUpdates` をつけると、Xcode がビルド中にポータルから
最新プロファイルをダウンロードして上書きしてしまう。
ポータルの設定が古いと、App Groups なしのプロファイルが降ってきて失敗する。

→ sigh で取得した UUID を pbxproj に直書きし、Xcode のポータルアクセスを封じた。

### 過去に試して失敗した方法（やり直し禁止）

| 試した方法 | なぜダメか |
|---|---|
| `CODE_SIGN_STYLE=Automatic` + `CODE_SIGN_IDENTITY="Apple Distribution"` | 「Automaticなのに Distribution 指定」で conflicting settings エラー |
| `CODE_SIGN_STYLE=Automatic`（IDENTITY指定なし） | 登録端末がないため Development プロファイルを作れず失敗 |
| `-allowProvisioningUpdates` ありの Manual | ポータルから古い（App Groups なし）プロファイルを上書きダウンロードされる |
| `xcode-select` のみ（`-runFirstLaunch` なし） | ibtool がシミュレータを見つけられず "Platform Not Installed" |
| `sudo xcodebuild -runFirstLaunch` | 試したが iOS 18.4 ランタイムは依然インストールされなかった |

---

## エラー別対処

### "iOS 18.4 Platform Not Installed"（storyboard コンパイルエラー）

**原因:** ibtool が iOS 18.4 シミュレータランタイムを要求している。
Xcode 16.3 には iOS 18.4 SDK（ヘッダ）は入っているが、シミュレータランタイムは別途ダウンロードが必要。

**現在の修正:** ワークフローに `xcodebuild -downloadPlatform iOS` ステップを追加済み。

**もし再発したら:**
- `macos-15` ランナーのイメージが更新されて iOS 18.x のバージョンが変わった可能性がある
- `Select Xcode 16` ステップのログで選ばれた Xcode バージョンを確認
- Xcode のバージョンが上がっていたら、対応する iOS バージョンのシミュレータが必要

### "requires a provisioning profile with the App Groups feature"

1. Portal で `jp.kotoclip.app` と `jp.kotoclip.app.share` の両方に App Groups（`group.jp.kotoclip.app`）を設定
2. ビルドを再実行

### "conflicting provisioning settings"

`build-testflight.yml` の Archive ステップに `CODE_SIGN_STYLE=Manual` があるか確認。
Automatic になっていたら Manual に戻す。

### "iOS App Development profiles" / "No profiles found"

`CODE_SIGN_STYLE=Automatic` になっている。Manual に戻す。

### ビルド番号エラー（TestFlight アップロード時）

`app.json` の `"buildNumber"` を +1 してコミット・プッシュ。

### pod install 失敗

`ci_post_clone.sh` 内の `HERMES_VERSION` が古い可能性がある。
`https://repo1.maven.org/maven2/com/facebook/hermes/hermes-ios/` でバージョンを確認。

---

## 注意事項

- **Distribution 証明書の枚数制限**: 1チーム最大3枚。
  https://developer.apple.com/account/resources/certificates/list から古いものを失効させる。
- **buildNumber は必ず手動で +1**: 自動増加しない。TestFlight に送るたびに `app.json` を更新。
- **`ci_post_clone.sh` は触らない**: Expo SDK 各所の Swift 6 バグへの大量パッチが入っている。
  触ると何十個ものビルドエラーが復活する。

---

## 付録: GitHub Secrets の場所

https://github.com/soichiromaxmax-hash/KotoClipApp/settings/secrets/actions
