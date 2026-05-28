# KotoClip — TestFlight 配信 引き継ぎメモ

**更新日: 2026-05-28 / 最新コミット: `550e3d7`**

---

## このメモの目的

GitHub Actions で TestFlight にビルドを送る仕組みを作ってきた。
同じエラーで何度もループしないために、「なぜそのエラーが起きるか」を丁寧に書いた。
専門知識ゼロの人でも読めるように書いている。

---

## 現在の状態（2026-05-28時点）

| 項目 | 状態 |
|---|---|
| ビルド番号（app.json） | **53** |
| GitHub Actions ワークフロー | `.github/workflows/build-testflight.yml` |
| 最新コミット | `550e3d7` — 署名プロファイルのUUIDを固定する修正 |
| TestFlight 到達 | **未確認（今から試す段階）** |

**次にやること:**
1. Apple Developer Portal に App Group を登録する（後述）
2. GitHub Actions でビルドを走らせる
3. 失敗したらこのメモの「エラー別対処」を読む

---

## KotoClipとは

英語の単語を保存・復習するiOSアプリ。  
**2つのターゲット**がある:

| ターゲット | Bundle ID | 役割 |
|---|---|---|
| メインアプリ | `jp.kotoclip.app` | アプリ本体 |
| Share Extension | `jp.kotoclip.app.share` | Safari等の共有ボタンから単語を追加する機能 |

この2つは **App Group**（`group.jp.kotoclip.app`）でデータを共有している。
→ **これがビルドを難しくしている元凶**（後述）

---

## ビルドの流れ（自動）

`.github/workflows/build-testflight.yml` が全部やってくれる。
GitHub上の "Run workflow" ボタンを押すだけで以下が動く。

```
① コードをチェックアウト
② Xcode 16 を選択
③ Node.js 20 をセットアップ
④ App Store Connect API キーをファイルに書き出す
⑤ ci_scripts/ci_post_clone.sh を実行
   └── npm install
   └── Expo SDK / React Native のSwift 6バグをパッチ（膨大なPythonスクリプト）
   └── pod install（CocoaPods）
   └── Xcodeプロジェクトの設定を修正
   └── AppIntentsSSUTrainingスタブ生成
⑥ Distribution証明書を取得 or インポート
⑦ fastlane sigh でプロビジョニングプロファイルをダウンロード（Portal経由）
   └── App Groups が入ったプロファイルか検証
   └── プロファイルのUUIDをGITHUB_ENVに保存
⑧ project.pbxproj を手動署名用にパッチ
   └── CODE_SIGN_STYLE = Manual に変更
   └── 各ターゲットに PROVISIONING_PROFILE_SPECIFIER を設定
⑨ xcodebuild archive（→ KotoClip.xcarchive 生成）
⑩ xcodebuild -exportArchive（→ KotoClip.ipa 生成）
⑪ xcrun altool でTestFlightにアップロード
```

---

## 前提：Apple Developer Portal の設定（ブラウザのみ・Macなし可）

**これをやらないとビルドは絶対に通らない。**

### App Group の作成

1. https://developer.apple.com/account/resources/identifiers/list/applicationGroup を開く
2. 右上の `+` をクリック → "App Groups" を選択 → Continue
3. Identifier に `group.jp.kotoclip.app` と入力 → Continue → Register

### メインアプリへの紐付け

1. https://developer.apple.com/account/resources/identifiers/list を開く
2. `jp.kotoclip.app` をクリック
3. "App Groups" → Configure → `group.jp.kotoclip.app` にチェック → Continue → Save

### Share Extension への紐付け

1. 同じリストから `jp.kotoclip.app.share` をクリック
2. 同じ操作: App Groups → Configure → `group.jp.kotoclip.app` → Continue → Save

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

| Secret名 | 内容 |
|---|---|
| `APP_STORE_CONNECT_API_KEY_CONTENT` | .p8ファイルの中身 |
| `APP_STORE_CONNECT_API_KEY_ID` | `HK23GAU47L` |
| `APP_STORE_CONNECT_API_ISSUER_ID` | `39ebdc7c-2b5d-47b6-9a67-da83b74103fc` |
| `DISTRIBUTION_CERT_P12` | Distribution証明書（base64） |
| `DISTRIBUTION_CERT_PASSWORD` | 上記のパスワード |

`DISTRIBUTION_CERT_P12` が空の場合、ビルドが自動で証明書を作成してログに出力する。
ログ末尾に `DISTRIBUTION_CERT_P12: xxxx...` と `DISTRIBUTION_CERT_PASSWORD: xxxx` が表示されたら、
その値を GitHub の Secrets に保存すること（次回のビルドが速くなる）。

---

## ビルドの実行方法

1. https://github.com/soichiromaxmax-hash/KotoClipApp/actions/workflows/build-testflight.yml を開く
2. 右側の **"Run workflow"** ボタンをクリック → もう一度 "Run workflow"
3. 30〜40分待つ
4. 成功 → TestFlight に自動でアップロードされる
5. 失敗 → 下の「エラー別対処」を読む

---

## プロジェクト全体のファイル構成

```
KotoClipApp/
│
├── .github/workflows/
│   └── build-testflight.yml    ★ GitHub Actions ビルド定義。ここを読めば何が起きているか分かる
│
├── ci_scripts/
│   └── ci_post_clone.sh        ★ Swift 6バグパッチ・pod install・pbxproj修正。触るな
│
├── app.json                    ★ buildNumber はここ（TestFlight再送のたびに +1 必須）
│
├── app/                        画面ファイル（expo-router / ファイルがURLになる）
│   ├── _layout.tsx             ルート: 認証ゲート・フォント読込・Renderウォームアップ
│   ├── flashcard.tsx           フラッシュカード画面（10枚バッチ復習）
│   ├── how-to.tsx              使い方説明
│   ├── auth/
│   │   └── login.tsx           ログイン・新規登録画面
│   ├── word/
│   │   └── [id].tsx            単語詳細・AI再翻訳・削除
│   └── (tabs)/                 タブバーの中の画面
│       ├── _layout.tsx         タブバー定義（アイコン・ラベル）
│       ├── index.tsx           ホーム（統計・CTAカード）
│       ├── study.tsx           クイズ練習（4択のみ）
│       ├── add.tsx             単語追加タブ
│       ├── words.tsx           単語一覧（フィルター・ソート・お気に入り）
│       └── settings.tsx        設定（通知・ログアウト）
│
├── lib/
│   ├── api.ts                  ★ 全API呼び出しはここ経由（認証・リフレッシュ自動処理）
│   └── notifications.ts        通知スケジュール管理
│
├── context/
│   └── auth.tsx                認証コンテキスト（useAuth フック）
│
├── components/
│   ├── KotoBird.tsx            黄色い鳥キャラ（空状態に使う。絵文字で代替しない）
│   ├── Onboarding.tsx          ★ 触るな（確定版）
│   └── SplashAnimation.tsx     スプラッシュアニメーション
│
├── modules/
│   └── shared-storage/         自作ネイティブモジュール
│       └── ios/SharedStorageModule.swift
│                               App GroupのUserDefaultsにアクセスする
│                               （メインアプリ↔Share Extension のトークン共有に使う）
│
├── targets/
│   └── share-extension/
│       └── ShareViewController.swift
│                               Share Extension の Swift 実装本体
│                               Safari等の「共有」ボタンから起動する
│
├── plugins/
│   ├── withShareExtension.js   Share ExtensionをXcodeプロジェクトに組み込む
│   └── withoutPushEntitlement.js  不要なプッシュ権限を削除
│
├── ios/                        expo prebuild + pod install で自動生成される
│   ├── KotoClip.xcodeproj/
│   │   └── project.pbxproj    ★ Xcodeプロジェクト設定。手動で触らない
│   ├── KotoClip/
│   │   └── KotoClip.entitlements  App Group設定（group.jp.kotoclip.app）
│   ├── ShareExtension/
│   │   └── ShareExtension.entitlements  Share Extension の App Group設定
│   ├── Podfile                 CocoaPods設定（ci_post_clone.sh がパッチを当てる）
│   └── Pods/                  pod install で生成（gitignore対象）
│
├── ios-stubs/
│   └── AppIntentsSSUTraining.framework/
│                               ★ 自作スタブ。ShareExtensionのリンクエラー回避用
│                               ci_post_clone.sh が自動生成する
│
├── codemagic.yaml              旧CI設定（Codemagic用）。現在は使っていない
│                               Swift 6パッチの参考資料としては有用
│
├── HANDOFF.md                  このファイル（TestFlight配信の引き継ぎ）
└── HANDOVER.md                 アプリ全体の設計・API・デザインルールの引き継ぎ
```

### 特に重要なファイル（迷ったらここを見る）

| ファイル | 何をするか | 触っていいか |
|---|---|---|
| `.github/workflows/build-testflight.yml` | CI全体の定義 | **触る（ビルドが壊れたとき）** |
| `ci_scripts/ci_post_clone.sh` | Swift 6パッチ + pod install | **触るな** |
| `app.json` | buildNumber・Bundle ID | **触る（番号更新のみ）** |
| `lib/api.ts` | 全API通信 | 触ってよい |
| `targets/share-extension/ShareViewController.swift` | Share Extension本体 | 触ってよい |
| `modules/shared-storage/ios/SharedStorageModule.swift` | トークン橋渡し | 慎重に |
| `plugins/withShareExtension.js` | Share Extension Xcodeへの組み込み | 慎重に |
| `components/Onboarding.tsx` | オンボーディング | **絶対に触るな** |
| `ios/KotoClip.xcodeproj/project.pbxproj` | Xcodeプロジェクト設定 | **触るな（自動生成）** |

---

## [重要] 署名（コードサイニング）の仕組みと罠

**ここを読まないと同じエラーで何日も詰まる。**

### 登場人物

| 名前 | 何か |
|---|---|
| Distribution証明書（.p12） | 「このアプリはAppleが認めた開発者が作りました」という証明書 |
| プロビジョニングプロファイル（.mobileprovision） | 「このBundle IDのアプリを、このチームが配布してよい」という許可証 |
| App Groups機能 | 複数のターゲット間でデータを共有する機能。許可証に含まれていないとビルドが拒否される |

### 署名モードは2種類ある

| モード | 何をするか | CI向きか |
|---|---|---|
| Automatic（自動） | Xcodeが端末を登録してDevelopment向けプロファイルを自動作成 | **× NG**（登録端末が必要） |
| Manual（手動） | あらかじめ用意したプロファイルをXcodeに渡す | **○ OK** |

**→ CI（GitHub Actions）では必ず Manual を使う。**

### なぜ「App Groups feature required」が起きるか

プロファイルに App Groups が含まれているかどうかは、
Apple Developer Portal 側の App ID 設定が決める。

1. Portal 上で App Groups が有効になっていないと、
2. fastlane sigh がダウンロードするプロファイルにも App Groups が含まれない
3. xcodebuild archive が「App Groups対応プロファイルが必要」とエラーを出す

**解決: Portal で App Groups を有効化 → sigh で --force 再生成 → ビルド**

### なぜ `-allowProvisioningUpdates` を外したか（現在のワークフロー）

`-allowProvisioningUpdates` をつけると、Xcode がビルド中に Apple Portal から
最新のプロファイルを自動ダウンロードしてしまう。

**問題:** Portal 上の設定がまだ古いと、App Groups なしのプロファイルが降ってきて
sigh が正しく取得したものを上書きしてしまう。

**現在の解決策:**
1. `fastlane sigh --force` で App Groups 入りプロファイルを強制再生成
2. そのプロファイルの UUID を `GITHUB_ENV` に保存
3. `project.pbxproj` を Python でパッチし、各ターゲットに UUID を明記
4. `xcodebuild archive` からは `-allowProvisioningUpdates` を外す
   → Xcode がポータルから何かを落としてくる余地をなくす

### 過去にやって失敗した方法（やり直し禁止）

| 試した方法 | なぜダメだったか |
|---|---|
| `CODE_SIGN_STYLE=Automatic` + `CODE_SIGN_IDENTITY="Apple Distribution"` | Xcodeが「Automaticは開発用なのにDistribution証明書を指定している」と拒否（conflicting settings） |
| `CODE_SIGN_STYLE=Automatic`（IDENTITY指定なし） | CI環境には登録端末がないため Development プロファイルを作れず失敗 |
| `-allowProvisioningUpdates` つきの Manual signing | Xcode が Portal から古い（App Groupsなし）プロファイルをダウンロードして上書きしてしまう |
| `PROVISIONING_PROFILE_SPECIFIER` をコマンドラインで全体に渡す | 全ターゲット同じUUIDになりShareExtension用のものが使われない |

---

## エラー別対処

### "requires a provisioning profile with the App Groups feature"

**意味:** App Groups が含まれたプロビジョニングプロファイルが見つからない

**確認手順:**
1. Portal（https://developer.apple.com/account/resources/identifiers/list）で以下を確認:
   - `jp.kotoclip.app` → App Groups が有効 → `group.jp.kotoclip.app` にチェック
   - `jp.kotoclip.app.share` → 同上
2. Portalの "App Groups" セクション（https://developer.apple.com/account/resources/identifiers/list/applicationGroup）に `group.jp.kotoclip.app` が存在するか確認
3. 上記がOKなら、ビルドログの "Download provisioning profiles" ステップを見る
   - `[main] AppGroups=['group.jp.kotoclip.app']` と表示されていればプロファイルは正しい
   - `AppGroups=NOT PRESENT` なら Portal 設定が反映されていない → sigh の `--force` が効いているか確認

### "conflicting provisioning settings"

**意味:** 署名設定が矛盾している（AutomaticなのにDistributionを要求している等）

**原因:** `CODE_SIGN_STYLE=Automatic` と `CODE_SIGN_IDENTITY="Apple Distribution"` を同時に指定した

**解決:** `build-testflight.yml` の Archive ステップで:
- `CODE_SIGN_STYLE=Manual` であることを確認
- `-allowProvisioningUpdates` がないことを確認

### "iOS App Development profiles" / "No profiles found"

**意味:** Automatic モードで開発用プロファイルを探したが登録端末がない

**原因:** `CODE_SIGN_STYLE=Automatic` になっている（CI では使えない）

**解決:** Archive ステップを `CODE_SIGN_STYLE=Manual` に戻す

### "pod install" 失敗

**原因候補:**
- `HERMES_VERSION` の tarball が Maven Central に存在しない
- `ci_scripts/ci_post_clone.sh` 内の URL を確認する
  - URL: `https://repo1.maven.org/maven2/com/facebook/hermes/hermes-ios/${HERMES_VERSION}/...`
  - バージョン `0.14.1` で固定中

### ビルド番号エラー（TestFlight アップロード時）

**意味:** 同じビルド番号はTestFlightに2回送れない

**解決:** `app.json` の `"buildNumber"` を +1 してコミット・プッシュしてから再実行

---

## 注意事項

- **Distribution 証明書の枚数制限**: 1チーム最大3枚。
  https://developer.apple.com/account/resources/certificates/list から古いものを失効させること。
- **ビルド番号は必ず手動で上げる**: 自動増加の仕組みはない。`app.json` の `buildNumber` を毎回 +1。
- **`ci_post_clone.sh` は触らない**: Swift 6の既知バグへの大量パッチが入っている。
  変更すると何十個ものビルドエラーが復活する。

---

## 付録: GitHub Secrets の設定場所

https://github.com/soichiromaxmax-hash/KotoClipApp/settings/secrets/actions

"New repository secret" から追加・更新できる。
