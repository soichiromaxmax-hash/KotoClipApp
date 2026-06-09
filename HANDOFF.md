# KotoClip — 引き継ぎメモ（完全版）

**最終更新: 2026-06-09**

---

## ▶ まず最初に読む

このファイルを最初から最後まで読めば、何も知らない状態から開発を再開できる。
「どこに何があるか分からない」状態にならないよう、ファイルパスを含めてすべて具体的に書いてある。

---

## 0. 最新状況（2026-06-09）★ここから読む

### 現在のビルド・OTA状態

| 項目 | 値 |
|---|---|
| TestFlight インストール済みビルド | **Build #40**（iOS ビルド番号。EAS 内部カウントと別） |
| 次回 EAS Build 時のビルド番号 | **#41**（App Store Connect からの autoIncrement） |
| コード（GitHub master） | 全変更 push 済み（commit `132bd42`） |
| OTA production チャンネル | ✅ 作成済み・production ブランチに接続済み |
| 最新 OTA | Update Group `cea87239`（2026-06-09 配信済み） |

### OTA の仕組み（修正済み・正常動作中）

2026-06-09 に判明した問題：**production チャンネルが存在しなかった**ため、過去の全 OTA がデバイスに届いていなかった。

**修正済み内容：**
- `eas channel:create production` でチャンネルを作成し、production ブランチに接続
- `eas.json` に `"channel": "production"` を明示的に追加（Build #41 以降で確実に反映）
- OTA コマンドに `EAS_SKIP_AUTO_FINGERPRINT=1` を組み込んだ npm スクリプトを追加

**OTA 確認手順（必ず2回再起動）:**
1. アプリを完全終了（ホームでアプリを上スワイプ）
2. アプリを開く（バックグラウンドでダウンロード）
3. もう一度完全終了
4. アプリを開く → 更新が適用される

**⚠️ Build #40 インストール端末への OTA :** チャンネルが当時なかったため、Build #40 端末への過去 OTA は届いていない可能性が高い。**Build #41 を入れれば以降は正常に動く。**

---

### 2026-06-09 に実施した変更（全 OTA 配信済み）

#### UI・UX 改善

| 内容 | ファイル |
|---|---|
| フラッシュカード・苦手語カードをクイズ練習と同じティール色に統一 | `app/(tabs)/index.tsx` |
| 使い方画面を「📱 スマホ」「💻 PCブラウザ」の2タブ構成に変更 | `app/how-to.tsx` |
| 設定画面の通知行サブテキスト・sectionNote を削除してシンプル化 | `app/(tabs)/settings.tsx` |

#### バグ修正

| バグ | 修正内容 | ファイル |
|---|---|---|
| 苦手語クイズがエラーになる | API エラーを empty 扱いに。苦手語をクライアント側フィルタ（未学習・stability<2.5・期限超過）に変更 | `app/(tabs)/study.tsx` |
| 久々起動時の読み込みが長い | キャッシュなし初回のタイムアウトを 8 秒に短縮。失敗時はログイン画面へ即遷移 | `app/(tabs)/index.tsx` |
| フラッシュカードの遷移が遅い | `onRate` を非同期ブロックなし即時遷移に変更。ロックを 500→250ms に短縮 | `app/flashcard.tsx` |
| 通知トグルを ON にして権限拒否しても ON のまま | 権限 denied 時にトグルを即 OFF に戻すよう修正 | `app/(tabs)/settings.tsx` |
| word_limit がハードコード100 | サーバーの `word_limit` / `is_premium` を取得して動的制限。premium 時は無制限表示 | `app/(tabs)/add.tsx` |

---

### Build #41 の前にやること（★必須）

**Build #41 は RevenueCat の設定が完了してから実行すること。**

#### STEP 1 — App Store Connect で IAP 商品を作成（未完了）

1. [App Store Connect](https://appstoreconnect.apple.com) → KotoClip → 「App 内課金」
2. 「＋」→ **自動更新サブスクリプション** を選択
3. サブスクリプショングループ名: `KotoClip Premium`
4. 以下 2 商品を作成:

| Product ID | 表示名 | 価格 |
|---|---|---|
| `jp.kotoclip.premium.monthly` | KotoClip Premium 月額 | ¥480（Tier 3） |
| `jp.kotoclip.premium.yearly` | KotoClip Premium 年額 | ¥2,400（Tier 7） |

#### STEP 2 — RevenueCat アカウント作成・設定（未完了）

1. [app.revenuecat.com](https://app.revenuecat.com) でアカウント作成
2. 新しいプロジェクト → iOS App 追加 → Bundle ID: `jp.kotoclip.app`
3. App Store Connect API キー（`.p8` ファイル = `AuthKey_HK23GAU47L.p8`）を RevenueCat に登録
4. **Entitlements** → ID: `premium` を作成
5. **Offerings** → `default` を作成し、上記 2 商品を追加
6. **iOS Public API Key** をコピー（`appl_xxxxx` 形式）

#### STEP 3 — コードに API キーを設定（1分）

`lib/purchases.ts` の1行を差し替える:

```typescript
// 変更前（プレースホルダー）
export const RC_API_KEY_IOS = 'REVENUECAT_IOS_PUBLIC_KEY';

// 変更後（RevenueCat ダッシュボードの値）
export const RC_API_KEY_IOS = 'appl_xxxxxxxxxxxxxxxx';
```

#### STEP 4 — Build #41 を実行

STEP 1〜3 完了後:

```powershell
cd "C:\Users\SoichiroKamibeppu(MC\KotoClipApp"
npm run release:ios:build
```

---

### v1.0 リリース前 残タスク一覧

| # | 内容 | 状態 |
|---|---|---|
| 1 | Build #41 作成 → App Store 審査提出 | ⏳ STEP 1〜3 完了後 |
| 2 | iOS 通知バグ修正 | ✅ 2026-06-09 修正済み |
| 3 | RevenueCat 課金基盤 | ✅ コード完成・STEP 1〜3 待ち |
| 4 | 単語数制限 UI | ✅ 2026-06-09 動的対応済み |
| 5 | AI 検索回数制限 UI | ❌ サーバー実装確認が必要 |
| 6 | Google/Apple ログイン | ❌ Supabase OAuth 設定が必要 |
| 7 | 言語別単語帳（スペイン語等を英語と別管理） | ❌ サーバー実装確認が必要 |
| 8 | App Store メタデータ（スクショ・説明文） | ❌ Build #41 後に実施 |
| 9 | 拡張機能のスペイン語対応（language params） | ❌ Build #41 と同時に対応 |

---

### どこに何が書いてあるか

| 知りたいこと | 参照先 |
|---|---|
| 日常の OTA コマンド | **セクション 8**（このファイル） |
| RevenueCat 実装の詳細 | `lib/purchases.ts`（コメント付き） |
| ペイウォール UI | `app/paywall.tsx` |
| ビルドの仕組み・パッチの理由 | **セクション 10**（このファイル） |
| iOS 26 SDK 対応の経緯 | **セクション 7**（このファイル） |
| アカウント・証明書の場所 | **セクション 4**（このファイル） |
| 設計・API・デザイン詳細 | `HANDOVER.md`（同フォルダ） |

---

---

## 1. このプロジェクトは何か

英語を読みながら出会った単語を保存し、スペースド・リピティション（間隔反復）で復習するiOSアプリ。  
Share Extension でブラウザやアプリから単語を直接追加できる。

- バンドルID: `jp.kotoclip.app`
- バックエンド: `https://kotoclip.onrender.com`（Render.com 無料プラン・15分でスリープ）
- フロントエンド: React Native（Expo SDK 55 / React Native 0.83.6 / expo-router 55）

---

## 2. プロジェクトの場所（Windowsローカル）

**このPCでのプロジェクトルート:**
```
C:\Users\SoichiroKamibeppu(MC\KotoClipApp\
```

**Claude Code でこのプロジェクトを開く方法:**
```
# ターミナル（PowerShell）で以下を実行
cd "C:\Users\SoichiroKamibeppu(MC\KotoClipApp"
claude
```
→ 自動で `CLAUDE.md` を読んでプロジェクトを理解した状態になる。

**GitHub リポジトリ:**
```
https://github.com/soichiromaxmax-hash/KotoClipApp
```

---

## 3. 受け取るべきもの（引き継ぎ者へ）

開発を始める前に以下を受け取ること。

| # | 何を | どこに / どうやって |
|---|---|---|
| ① | `.p8` ファイル（App Store Connect API キー） | 現在の保存場所: `C:\Users\SoichiroKamibeppu(MC\OneDrive\Desktop\ChatGPT Vocab Test\AuthKey_HK23GAU47L.p8` |
| ② | GitHub リポジトリへの招待 | https://github.com/soichiromaxmax-hash/KotoClipApp/settings/access にメールアドレスを登録 |
| ③ | Apple Developer への招待 | https://developer.apple.com/account/people にメールアドレスで招待 |
| ④ | EAS（Expo）への招待 | https://expo.dev/accounts/soichiromax/settings/members にメールアドレスで招待 |
| ⑤ | Render（バックエンド）のログイン情報 | 口頭または文章で受け取る |

---

## 4. アカウント一覧

| サービス | アカウント / 値 |
|---|---|
| Apple Developer | beckham.spaghetti@icloud.com |
| Apple Team ID | `9U2YJ4XL4K` |
| App Store Connect API Key ID | `HK23GAU47L` |
| App Store Connect Issuer ID | `39ebdc7c-2b5d-47b6-9a67-da83b74103fc` |
| .p8 ファイル | `C:\Users\SoichiroKamibeppu(MC\OneDrive\Desktop\ChatGPT Vocab Test\AuthKey_HK23GAU47L.p8` |
| Expo / EAS アカウント | soichiromax |
| EAS ダッシュボード | https://expo.dev/accounts/soichiromax/projects/kotoclip |
| App Store Connect アプリID | `6765753980` |
| Bundle ID（メイン） | `jp.kotoclip.app` |
| Bundle ID（Share Extension） | `jp.kotoclip.app.share` |
| App Group | `group.jp.kotoclip.app` |

---

## 5. 重要ファイルの場所（全部絶対パスで記載）

```
C:\Users\SoichiroKamibeppu(MC\KotoClipApp\
│
├── HANDOFF.md                ← このファイル
├── HANDOVER.md               ← 設計・API・デザインルール詳細
├── app.json                  ← Expo基本設定（buildNumberはEASが自動管理）
├── eas.json                  ← EASビルド/サブミット設定（★後述の変更済み）
├── package.json              ← npm依存パッケージ（expo ~55.0.26）
├── credentials.json          ← ローカル証明書の参照先（eas.jsonがcredentialsSource: localで使用）
│
├── credentials/ios/          ← 証明書ファイル本体
│   ├── dist-cert.p12         ← Distribution証明書
│   ├── profile.mobileprovision        ← メインアプリ プロビジョニングプロファイル
│   └── shareextension.mobileprovision ← Share Extension プロビジョニングプロファイル
│
├── scripts/
│   └── patch-expo-swift.py   ← ★EASビルド時にnpm postinstallで自動実行されるSwiftパッチ
│
├── ios/
│   ├── Podfile               ← Swift concurrency設定を含む（触るな・自動生成）
│   └── Podfile.properties.json
│
├── app/                      ← 画面ファイル（ここをよく触る）
│   ├── _layout.tsx           ← ルート（認証・フォント・Renderウォームアップ）
│   ├── flashcard.tsx
│   ├── how-to.tsx            ← スマホ / PC タブ構成
│   ├── paywall.tsx           ← ★RevenueCat ペイウォール（月額+年額）
│   ├── auth/login.tsx
│   ├── word/[id].tsx
│   └── (tabs)/
│       ├── index.tsx         ← ホーム（XPバー・統計・CTAカード）
│       ├── study.tsx         ← クイズ練習（4択のみ）・苦手語クライアントフィルタ
│       ├── add.tsx           ← word_limit 動的対応・上限モーダルでペイウォールへ誘導
│       ├── words.tsx
│       └── settings.tsx      ← アップグレードボタンがペイウォールへ接続済み
│
├── lib/
│   ├── api.ts                ← API呼び出しはすべてここ経由
│   ├── gamification.ts       ← XP・レベル・Kotoステージ計算
│   ├── notifications.ts
│   └── purchases.ts          ← ★RevenueCat 課金ロジック（RC_API_KEY_IOS を差し替えること）
│
├── context/auth.tsx          ← ログイン状態（useAuth フック）
│
├── components/
│   ├── KotoBird.tsx          ← 黄色い鳥キャラ（ステージ別6デザイン）
│   ├── Onboarding.tsx        ← ★絶対に触るな（確定版）
│   └── SplashAnimation.tsx
│
├── targets/share-extension/
│   └── ShareViewController.swift  ← Share Extension Swift実装（変更はフルビルド必要）
│
├── modules/shared-storage/ios/
│   └── SharedStorageModule.swift   ← App Group UserDefaults（トークン共有）
│
├── plugins/
│   ├── withShareExtension.js
│   └── withoutPushEntitlement.js
│
└── koto-preview.html         ← Koto全ステージのブラウザプレビュー（開発確認用）
```

---

## 6. 現在の状態（2026-06-09 更新）

| 項目 | 値 |
|---|---|
| 次回ビルド番号 | **#41**（App Store Connect autoIncrement） |
| TestFlight インストール済み | Build #40 |
| OTA 最新 | Update Group `cea87239`（2026-06-09 配信済み） |
| OTA チャンネル | production チャンネル ✅ 作成・接続済み |
| コード状態 | 全変更 push 済み（commit `132bd42`） |
| Expo SDK | ~55.0.26 |
| React Native | 0.83.6 |
| Xcode（EAS image） | `"latest"`（Xcode 26対応・2026-06-01に変更） |
| iOS deployment target | 15.1（iOS 26 専用ではない・15.1以上で動く） |
| RevenueCat SDK | `react-native-purchases@10.2.2` インストール済み |
| RevenueCat API Key | `lib/purchases.ts` の `RC_API_KEY_IOS` を差し替え待ち |

---

## 7. 2026-06-01 に行った変更（★重要）

### 変更内容

**`eas.json` の Xcode image を変更した。**

```json
// 変更前
"image": "macos-sequoia-15.4-xcode-16.3"

// 変更後
"image": "latest"
```

### 変更理由

Apple が 2026年6月から **iOS 26 SDK（Xcode 26）でビルドしたものだけをApp Store Connectで受け付ける** ように要件変更した。  
旧設定（Xcode 16.3 = iOS 18.4 SDK）でビルドした IPA を TestFlight へ upload しようとしたところ、Apple 側で以下のエラーが発生して拒否された：

```
SDK version issue. This app was built with the iOS 18.4 SDK.
All iOS and iPadOS apps must be built with the iOS 26 SDK or later.
```

`"latest"` にすることで EAS が持つ最新 Xcode image（Xcode 26対応）を自動的に使用するようになり、問題が解消した。

### この変更で影響を受けるもの

`scripts/patch-expo-swift.py` は Xcode 16.3 向けに作られたが、Xcode 26 でも問題なく動作することを確認済み（代替APIはすべてiOS 15以降から存在するため）。

---

## 8. 日常の開発コマンド

**コマンドを実行する前に必ずこのディレクトリに移動する:**
```
cd "C:\Users\SoichiroKamibeppu(MC\KotoClipApp"
```

### パターン①：画面修正・バグ修正・機能追加（毎日の作業）

```powershell
cd "C:\Users\SoichiroKamibeppu(MC\KotoClipApp"
npm run release:ota -- --message "変更内容のメモ"
```
iPhoneのアプリを完全に閉じて再起動すると1〜2分で反映。**ビルド不要・無料。**

⚠️ `eas update` コマンドを直接使わないこと。`npm run release:ota` には `EAS_SKIP_AUTO_FINGERPRINT=1` が自動で付く。

### パターン②：TestFlight に新しいビルドを送る

```powershell
cd "C:\Users\SoichiroKamibeppu(MC\KotoClipApp"
npm run release:ios:build
```
30〜40分でTestFlightに自動送信される。**EAS無料枠: 30回/月（毎月1日リセット）**

### パターン③：Swift・ネイティブコードを変えたとき

`targets/share-extension/ShareViewController.swift` や  
`modules/shared-storage/ios/SharedStorageModule.swift` を変えた場合は  
パターン①では反映されない。パターン②のフルビルドが必要。

---

## 9. 触っていいか一覧

| ファイル / フォルダ | 判断 | 理由 |
|---|---|---|
| `app/` 以下 | **自由に触る** | JS変更はeas updateで即反映 |
| `lib/` 以下 | **自由に触る** | |
| `context/auth.tsx` | **自由に触る** | |
| `components/KotoBird.tsx` | **自由に触る** | |
| `targets/share-extension/ShareViewController.swift` | 触れる（要フルビルド） | Swift変更はeas update不可 |
| `components/Onboarding.tsx` | **絶対触るな** | 確定版。変えると壊れる |
| `scripts/patch-expo-swift.py` | 慎重に触る | npm postinstallで実行されるSwiftパッチ。EASビルドの根幹 |
| `ios/` 以下 | **触るな** | EAS Buildがそのまま使用 |
| `credentials/ios/` | **触るな** | 証明書ファイル本体 |

---

## 10. ビルドの仕組み（EAS Build）

```
npm install
  └── postinstall → scripts/patch-expo-swift.py（Swiftパッチ自動適用）
pod install（ios/Podfileを使用）
  └── post_install: 全podをSwift 5.0 + SWIFT_STRICT_CONCURRENCY=minimalに強制
xcodebuild archive → IPA export → TestFlight upload（--auto-submit時）
```

**なぜパッチが必要か:**  
expo SDK 55のネイティブコードにSwift 6 concurrencyエラーが含まれている。  
Podfileで全podをSwift 5.0モードにしてactor isolationを抑制しつつ、  
それでも残るSendable系エラーをpatch-expo-swift.pyで個別修正している。

---

## 11. システム構成

```
iOSアプリ（このリポジトリ）
ブラウザ拡張・Webアプリ（soichiromaxmax-hash/KotoClip リポジトリ）
          ↓ HTTPS
FastAPI サーバー: https://kotoclip.onrender.com
（Render.com 無料プラン → 15分でスリープ・初回30秒かかる）
          ↓
Supabase（本番DB + Auth）
```

---

## 12. デザインルール（必ず守る）

| 色名 | 値 | 注意 |
|---|---|---|
| 背景 | `#0E1116` | |
| メインカラー（ティール） | `#2DD4BF` | |
| ミュートテキスト | `#8F99A8` | **`#6B7280` は間違い** |
| 正解 | `#7CFFB2` | |
| 不正解 | `#FF6B6B` | |

**フォント:** LobsterTwo_700Bold（Koto）/ SpaceGrotesk_700Bold（Clip）  
**KotoBird:** `components/KotoBird.tsx` の SVG のみ。絵文字で代替しない。

---

## 13. Koto キャラクター ステージ別デザイン

| ステージ | Lv | 名前 | デザイン |
|---|---|---|---|
| 1 | 1〜5 | ひよこ | 素のKoto・フラッシュカードを持つ |
| 2 | 6〜10 | 小学生 | 黄色い通学帽 ＋ 左手に水筒 |
| 3 | 11〜15 | 高校生 | 学ラン（金ボタン・立ち衿）＋ 左に学生鞄・右に辞書 |
| 4 | 16〜20 | ビジネス | スーツ（ネクタイ・眼鏡）＋ 左にスマホ・右にスーツケース |
| 5 | 21〜25 | 研究者 | 白衣（ポケット・ペン・眼鏡）＋ 右にクリップボード |
| 6 | 26〜30 | 卒業生 | ガウン・卒業帽・眼鏡 ＋ 右に卒業証書・スパークル・後光 |

デザイン確認: リポジトリ内の `koto-preview.html` をブラウザで開く。  
実装ファイル: `components/KotoBird.tsx`

---

## 14. 既知のバグ

| バグ | 状況 | 対処 |
|---|---|---|
| 起動時にアクセスできないことがある | Render の15分スリープが原因 | `_layout.tsx` の `useRenderWarmup()` でping送信済み。完全ではない。「再試行」ボタンを押す |
| iOS の通知設定が機能しない | `lib/notifications.ts` と `app/(tabs)/settings.tsx` に問題あり | 未修正 |

---

## 15. よくあるエラー

| 症状 | 対処 |
|---|---|
| `eas build` 失敗 | Apple Developer Portal で `group.jp.kotoclip.app` App Group を確認 |
| 証明書上限エラー | https://developer.apple.com/account/resources/certificates/list で古い Distribution 証明書を削除 |
| `eas submit` 失敗 | `eas.json` に `ascAppId: "6765753980"` が入っているか確認 |
| SDK version issue（Apple拒否） | `eas.json` の `image` が `"latest"` になっているか確認（2026-06-01に対応済み） |
| ホームが接続エラー | Render cold start（最大30秒）→「再試行」ボタンを押す |
| AI例文が出ない | server.py のデプロイ確認 |
| Share Extension が毎回ログイン要求 | Apple Developer Portal で App Group 作成 → 再ビルド |
| フォントが出ない | `_layout.tsx` の `useFonts` を確認 |

---

## 16. Apple Developer Portal の確認場所

- **App Group（設定済み・変更不要）:** https://developer.apple.com/account/resources/identifiers/list
  - `jp.kotoclip.app` → `group.jp.kotoclip.app`
  - `jp.kotoclip.app.share` → `group.jp.kotoclip.app`
- **Distribution 証明書（上限3枚）:** https://developer.apple.com/account/resources/certificates/list
  - 上限に達したら古いものを削除してからビルドする

---

## 17. 禁止事項

| 禁止 | 理由 |
|---|---|
| `Onboarding.tsx` を編集 | 確定版。壊すと直すのが困難 |
| ミュートカラーに `#6B7280` | 正解は `#8F99A8` |
| クイズに穴埋め追加 | 廃止済み。ユーザー評価が低い |
| Expo Goで確認 | SharedStorageネイティブモジュールが動かない |
| TikTokをSNS共有に追加 | 廃止済み |

---

## 18. Claude Code を使う場合

```bash
cd "C:\Users\SoichiroKamibeppu(MC\KotoClipApp"
claude
```

- `CLAUDE.md` — プロジェクト概要（Claude が自動で読む）
- `.claude/skills/` — 詳細仕様ファイル（必要に応じて参照）

**注意:** Claude Code はプロジェクトディレクトリで起動しないと `CLAUDE.md` を読まず、  
ファイルの場所を把握していない状態で会話が始まる。必ず `cd` してから起動すること。
