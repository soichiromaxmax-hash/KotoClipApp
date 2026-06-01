# KotoClip — 引き継ぎメモ

**更新日: 2026-05-31**

---

## このアプリとは

英語を読みながら出会った単語を保存し、スペースド・リピティション（間隔反復）で復習するiOSアプリ。  
Share Extension でブラウザやアプリから単語を直接追加できる。

- バンドルID: `jp.kotoclip.app`
- バックエンド: `https://kotoclip.onrender.com`（Render.com 無料プラン）
- フロントエンド: React Native（Expo SDK ~56.0.0-preview.7 / expo-router v4）

---

## 現在の状態（2026-05-31）

| 項目 | 値 |
|---|---|
| buildNumber（EAS自動採番） | **54**（EAS Build が自動インクリメント済み） |
| TestFlight | EAS Build #54 が送信済み（TestFlight から「テスト」ボタンでインストール可） |
| OTA更新（eas update） | **使える**（EAS Build #54 をインストールすれば以後は OTA のみで更新可） |
| コード状態 | 全変更 push 済み・OTA 更新送信済み |

### 次にやること（TestFlight からインストール）

1. iPhone で TestFlight を開く
2. KotoClip ビルド **#54** を「テスト」→「アップデート」
3. インストール後、以後の更新は `eas update` だけで完了

---

## EAS Build #54 に含まれる変更内容（コード全変更分）

### Koto キャラクター ステージ別デザイン（dcbc7b7）

`components/KotoBird.tsx` のアクセサリーを全面刷新。`lib/gamification.ts` の `kotoStage(level)` でレベルに対応するステージが決まる。

| ステージ | Lv | アクセサリー |
|---|---|---|
| 1 | 1〜5 | 素のKoto（基本） |
| 2 | 6〜10 | ＋ ティールスカーフ |
| 3 | 11〜15 | ＋ 丸メガネ（グリント付き） |
| 4 | 16〜20 | ＋ 革製サッチェルバッグ |
| 5 | 21〜25 | ＋ 学者帽・広げた翼・足元の魔法陣 |
| 6 | 26〜30 | ＋ ダークティールマント・金の K バッジ・スパークル・ライブラリオーラ |

ヒーロー背景色（`HERO_COLORS`）もステージ別に設定：暗い机→青→緑→紫→宇宙→金。  
ブラウザで各ステージの見た目を確認できるプレビューファイル: `koto-preview.html`

---

### クイズ練習（自由練習）モードの大幅改修

**変更ファイル:** `app/(tabs)/study.tsx`, `lib/api.ts`

1. **単語選択: 重み付きランダムサンプリング**  
   全登録単語をFSRS保持率でスコアリングし、忘却度が高い単語ほど選ばれやすい確率的サンプリングで10語を選出。毎回異なる顔ぶれになる。

2. **セッション構成: 10語×各1問 = 10問**  
   旧: 5語×2問（同じ単語が必ず2回出る）→ 単調  
   新: 10語×1問（choice/reverseをランダム割り当て）→ 毎回多様

3. **FSRS elapsed_days の修正**  
   旧: 常に1日固定（バグ）  
   新: `word.last_reviewed` から実際の経過日数を計算

4. **FSRS 4段階評価の自動適用**  
   旧: 正解=`good`/不正解=`again` の2択  
   新: 保持率から `easy`/`good`/`hard`/`again` を自動判定

### 不要コードの削除（軽量化）
- `startTime` ref（未使用）
- `bgTheme()`, `BADGE_DEFS`, `BadgeId`（gamification.ts・どこからも未使用）
- `getStreakCopy()`, `STREAK_COPY`（shareCard.ts・どこからも未使用）
- `progressText`, `heroCaption`, `progressTrack` 等の未使用スタイル・変数

---

## 最近追加した機能（直近のコミット）

| コミット | 内容 |
|---|---|
| `dcbc7b7` | **Koto ステージアクセサリー刷新**（ティールスカーフ・丸メガネ・サッチェル・学者帽・マント・K バッジ） |
| `272da67` | レベル帯ごとのヒーロー背景色を明確に区別（青→緑→紫→宇宙→金）|
| `59cedec` | `getStats()` に XP を含めて Koto ステージ・ヒーロー色がレベルに連動するよう修正 |
| `8f23134` | FSRS 重み付きサンプリングでクイズ10語を選出・elapsed_days 修正・4段階評価自動化 |
| `efa9861` | Koto キャラのステージ装飾・Lv バッジ大型化・進捗テキスト削除 |
| `eef7148` | 「確実に習得」バー・キャプション・進捗テキストをホームから削除 |
| `9785199` | クイズフィードバックに XP ±表示・ホームの XP バー大型化 |
| `34ca3b1` | ゲーミフィケーション：XP バー・ウィークワードモード・コンボ追跡 |
| `35e1893` | lint/doctor エラー全解消・残バグ修正 |
| `0a4273b` | 通知・スプラッシュ・wild エラー・単語追加 UX・API 安全性 修正 |

---

## アカウント一覧（受け取るもの）

| サービス | アカウント / 情報 |
|---|---|
| Apple Developer | beckham.spaghetti@icloud.com |
| Apple Team ID | `9U2YJ4XL4K` |
| App Store Connect API Key ID | `HK23GAU47L` |
| App Store Connect Issuer ID | `39ebdc7c-2b5d-47b6-9a67-da83b74103fc` |
| .p8 ファイル（ローカル） | `C:\Users\SoichiroKamibeppu(MC\OneDrive\Desktop\ChatGPT Vocab Test\AuthKey_HK23GAU47L.p8` |
| Expo / EAS | soichiromax |
| EAS ダッシュボード | https://expo.dev/accounts/soichiromax/projects/kotoclip |
| GitHub リポジトリ | https://github.com/soichiromaxmax-hash/KotoClipApp |
| App Store Connect アプリID | `6765753980` |
| バックエンド（Render） | オーナーから口頭で伝える |

---

## 開発のやり方

### パターン①：画面修正・バグ修正・機能追加（毎日の作業）

コードを変えたら：
```
cd "C:\Users\SoichiroKamibeppu(MC\KotoClipApp"
npx eas update --branch production --environment production --message "変更内容のメモ"
```
iPhone のアプリを完全に閉じて再起動すると反映される。  
**ビルド不要・無料・1〜2分で完了。**

> ※ 6月1日以降の EAS ビルドをインストールしてから使える。

---

### パターン②：TestFlight に新しいビルドを送る（月1〜2回）

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
│   ├── _layout.tsx                 ルート（認証・フォント・Renderウォームアップ）
│   ├── flashcard.tsx               フラッシュカード（10枚バッチ）
│   ├── how-to.tsx                  使い方説明
│   ├── auth/login.tsx              ログイン・新規登録
│   ├── word/[id].tsx               単語詳細・削除・AI再翻訳
│   └── (tabs)/
│       ├── index.tsx               ホーム（XPバー・統計・CTAカード）
│       ├── study.tsx               クイズ練習（4択のみ・スケジュール/フリー/ウィーク）
│       ├── add.tsx                 単語追加
│       ├── words.tsx               単語一覧（フィルター・ソート）
│       └── settings.tsx            設定（通知・プラン・ログアウト）
│
├── lib/
│   ├── api.ts                      ★ API呼び出しはすべてここ経由
│   └── notifications.ts            通知スケジュール管理
│
├── context/auth.tsx                ログイン状態（useAuth フック）
│
├── components/
│   ├── KotoBird.tsx                黄色い鳥キャラ（絵文字で代替しない）
│   ├── Onboarding.tsx              ← 絶対に触るな（確定版）
│   └── SplashAnimation.tsx         起動時アニメーション
│
├── targets/share-extension/
│   └── ShareViewController.swift   Share Extension（Safari等から単語追加）
│
├── modules/shared-storage/ios/
│   └── SharedStorageModule.swift   App Group UserDefaults（トークン共有）
│
├── plugins/
│   ├── withShareExtension.js       Share Extension を Xcode に組み込む
│   └── withoutPushEntitlement.js   不要プッシュ権限を除去
│
├── ci_scripts/
│   └── ci_post_clone.sh            ← 絶対に触るな（Swift 6パッチ大量）
│
├── ios/                            ← 触るな（expo prebuild で自動生成）
│
├── app.json                        基本設定（buildNumber: EAS が自動管理）
├── eas.json                        EAS Build/Update プロファイル
├── koto-preview.html               Koto ステージ別デザインのブラウザプレビュー
├── HANDOFF.md                      このファイル（引き継ぎメモ）
└── HANDOVER.md                     設計・API・デザインルール詳細
```

---

## 触っていいか一覧

| ファイル / フォルダ | 判断 | 理由 |
|---|---|---|
| `app/` 以下 | **自由に触る** | JS変更は eas update で即反映 |
| `lib/api.ts` | **自由に触る** | |
| `context/auth.tsx` | **自由に触る** | |
| `components/KotoBird.tsx` | **自由に触る** | |
| `targets/share-extension/ShareViewController.swift` | 触れる（要フルビルド） | Swift変更は eas update 不可 |
| `components/Onboarding.tsx` | **絶対触るな** | 確定版。変えると壊れる |
| `ci_scripts/ci_post_clone.sh` | **絶対触るな** | Swift 6バグへのパッチが大量。変えるとビルドが何十ものエラーで失敗する |
| `ios/` 以下 | **触るな** | expo prebuild で上書きされる |

---

## デザインルール（必ず守る）

| 色名 | 値 |
|---|---|
| 背景 | `#0E1116` |
| メインカラー（ティール） | `#2DD4BF` |
| ミュートテキスト | `#8F99A8`（**`#6B7280` は間違い**） |
| 正解 | `#7CFFB2` |
| 不正解 | `#FF6B6B` |

**フォント:** LobsterTwo_700Bold（Koto）/ SpaceGrotesk_700Bold（Clip）  
**KotoBird:** `components/KotoBird.tsx` の1種類のみ。絵文字で代替しない。

---

## 既知の未対応バグ

| バグ | 状況 |
|---|---|
| 起動時にアクセスできないことがある | Render のスリープが原因（15分で寝る）。`_layout.tsx` の `useRenderWarmup()` でpingを送っているが完全ではない |
| iOS の通知設定が Settings 画面から機能しない | `lib/notifications.ts` と `app/(tabs)/settings.tsx` を要確認 |

---

## Apple Developer Portal の確認場所

**App Group（設定済み・変更不要）**
- `jp.kotoclip.app` → `group.jp.kotoclip.app`
- `jp.kotoclip.app.share` → `group.jp.kotoclip.app`
- 確認: https://developer.apple.com/account/resources/identifiers/list

**Distribution 証明書（上限3枚）**
- 確認・削除: https://developer.apple.com/account/resources/certificates/list
- 上限に達したら古いものを削除してからビルドする

---

## よくあるエラー

| 症状 | 対処 |
|---|---|
| `eas build` 失敗 | Apple Developer Portal で `group.jp.kotoclip.app` App Group を確認 |
| `eas submit` 失敗 | eas.json に `ascAppId: "6765753980"` が入っているか確認 |
| ホームが接続エラー | Render cold start（最大30秒）→「再試行」ボタンを押す |
| AI例文が出ない | server.py のデプロイ確認 |
| Share Extension が毎回ログイン要求 | Apple Developer Portal で App Group 作成 → 再ビルド |
| フォントが出ない | `_layout.tsx` の `useFonts` を確認 |
| 証明書上限エラー | Developer Portal で古い Distribution 証明書を削除 |

---

## プレミアムプラン対応（将来の選択肢）

### 単語上限を500語に引き上げる際の対応

現在の無料プランは100語上限。プレミアムで500語に拡張する場合、クイズ画面（`app/(tabs)/study.tsx`）の自由練習モードは全単語を取得してからFSRS重み付きサンプリングを行っている。

**500語での処理量：** アルゴリズム自体は O(N) なので約0.1ms以下。問題なし。

**唯一の懸念はネットワーク転送量：**
- 現在（100語）: `getAllWords()` ≈ 50〜80KB
- プレミアム（500語）: ≈ 250〜400KB（LTEで30〜50ms増）

Render のコールドスタート（最大30秒）に比べれば誤差だが、もし問題になった場合は以下のエンドポイントをバックエンドに追加する：

```python
# anki_app/server.py に追加
@app.get('/api/study/priority')
def get_priority_list(uid: str = Depends(_user_dep)):
    """FSRS優先度スコア計算に必要な最小フィールドだけ返す"""
    # id, stability, reps, last_reviewed, next_review, word, meaning, context のみ
    # → 1単語 ≈ 80バイト、500語でも40KB
```

フロント側は `getAllWords()` の代わりにこのエンドポイントを呼ぶよう `lib/api.ts` を修正するだけ。**今は不要・問題が出てから対応すれば十分。**

---

## Claude Code を使う場合

このプロジェクトには Claude Code 用の設定が入っている：

- `CLAUDE.md` — プロジェクト概要（Claude が自動で読む）
- `.claude/skills/` — 詳細仕様ファイル（Claude が必要に応じて参照）

Claude Code でリポジトリを開くと自動で `CLAUDE.md` を読んで理解した状態で会話できる。  
詳細な仕様が必要になったら「share-extensionの仕様を見せて」などと言えばスキルファイルを参照する。
