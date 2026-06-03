# KotoClip — 引き継ぎメモ（完全版）

**最終更新: 2026-06-01**

---

## ▶ まず最初に読む

このファイルを最初から最後まで読めば、何も知らない状態から開発を再開できる。
「どこに何があるか分からない」状態にならないよう、ファイルパスを含めてすべて具体的に書いてある。

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
│   ├── how-to.tsx
│   ├── auth/login.tsx
│   ├── word/[id].tsx
│   └── (tabs)/
│       ├── index.tsx         ← ホーム（XPバー・統計・CTAカード）
│       ├── study.tsx         ← クイズ練習（4択のみ）
│       ├── add.tsx
│       ├── words.tsx
│       └── settings.tsx
│
├── lib/
│   ├── api.ts                ← API呼び出しはすべてここ経由
│   ├── gamification.ts       ← XP・レベル・Kotoステージ計算
│   └── notifications.ts
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

## 6. 現在の状態（2026-06-01）

| 項目 | 値 |
|---|---|
| 最新ビルド番号 | **#55**（EAS自動インクリメント・次回ビルド時） |
| TestFlight | Build #54 配信済み・インストール可 |
| OTA更新（eas update） | 使える（Build #54インストール後） |
| コード状態 | 全変更push済み |
| Expo SDK | ~55.0.26 |
| React Native | 0.83.6 |
| Xcode（EAS image） | `"latest"`（★2026-06-01に変更・後述） |
| iOS deployment target | 15.1 |

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

```bash
cd "C:\Users\SoichiroKamibeppu(MC\KotoClipApp"
eas update --branch production --environment production --message "変更内容のメモ"
```
iPhoneのアプリを完全に閉じて再起動すると1〜2分で反映。**ビルド不要・無料。**

### パターン②：TestFlight に新しいビルドを送る（月1〜2回）

```bash
cd "C:\Users\SoichiroKamibeppu(MC\KotoClipApp"
eas build --platform ios --profile production --auto-submit
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
