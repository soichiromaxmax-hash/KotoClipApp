# KotoClip — 引き継ぎメモ

**更新日: 2026-06-01**

---

## ▶ まずここを読む（引き継ぎ者へ）

このファイル（`HANDOFF.md`）を最初から最後まで読めば、一人で開発を続けられる状態になることを目標に書いてある。

### STEP 1 — 前任者から受け取るもの（5つ）

以下をすべて受け取ってから開発を始める。

| # | 何を | どうやって |
|---|---|---|
| ① | `.p8` ファイル（App Store Connect API キー） | ファイルを直接受け取る。紛失したら再発行不可 |
| ② | GitHub リポジトリへの招待 | https://github.com/soichiromaxmax-hash/KotoClipApp/settings/access にメールアドレスを登録してもらう |
| ③ | Apple Developer への招待 | https://developer.apple.com/account/people にメールアドレスで招待してもらう |
| ④ | EAS（Expo）への招待 | https://expo.dev/accounts/soichiromax/settings/members にメールアドレスで招待してもらう |
| ⑤ | Render（バックエンド）のログイン情報 | 口頭または文章で受け取る |

---

### STEP 2 — 手元の環境を整える

```bash
# 1. リポジトリをクローン
git clone https://github.com/soichiromaxmax-hash/KotoClipApp.git
cd KotoClipApp

# 2. 依存パッケージをインストール
npm install

# 3. EAS CLI をインストール（初回のみ）
npm install -g eas-cli

# 4. EAS にログイン
eas login
# → soichiromax アカウントで招待を受けたメールアドレスを使う
```

---

### STEP 3 — iPhone に最新ビルドを入れる

1. iPhone に **TestFlight** アプリを入れる
2. TestFlight を開き、KotoClip ビルド **#54** を「テスト」→「アップデート」でインストール
3. これで以後の更新は `eas update` だけで iPhone に届く（再ビルド不要）

---

### STEP 4 — 動作確認

```bash
cd KotoClipApp

# 何か1行変えてOTA更新を試す（例：どこかのテキストを1文字変えて保存）
eas update --branch production --environment production --message "動作確認"
```
1〜2分後に iPhone のアプリを完全終了→再起動すると変更が反映される。これが基本の開発サイクル。

---

### このメモの読み方

| セクション | 読む理由 |
|---|---|
| **このアプリとは** | アプリの全体像を把握する |
| **現在の状態** | 今どこまで進んでいるかを確認する |
| **開発のやり方** | 日常の作業手順を覚える |
| **Koto キャラクター** | デザインを変えるときに読む |
| **クイズ練習モード** | 学習アルゴリズムを変えるときに読む |
| **デザインルール** | UI を触るときに必ず確認する |
| **既知のバグ** | 「なぜこう動くのか」の背景を知る |
| **よくあるエラー** | 詰まったときに引く |

---

## このアプリとは

英語を読みながら出会った単語を保存し、スペースド・リピティション（間隔反復）で復習するiOSアプリ。  
Share Extension でブラウザやアプリから単語を直接追加できる。

- バンドルID: `jp.kotoclip.app`
- バックエンド: `https://kotoclip.onrender.com`（Render.com 無料プラン）
- フロントエンド: React Native（Expo SDK ~55.0.26 / React Native 0.83.6 / expo-router ~55.0.16）

---

## 現在の状態（2026-06-01）

| 項目 | 値 |
|---|---|
| buildNumber | **54**（EAS Build が自動インクリメント） |
| TestFlight | EAS Build #54 が配信済み。TestFlight からインストール可 |
| OTA更新（eas update） | **使える**（Build #54 インストール後は OTA のみで更新可） |
| コード状態 | 全変更 push 済み・OTA 送信済み |
| 最新 OTA update ID | `3317a790`（branch: production / 6ステージ刷新を含む） |

### 次にやること（TestFlight からインストール）

1. iPhone で TestFlight を開く
2. KotoClip ビルド **#54** を「テスト」→「アップデート」
3. インストール後、以後の更新は `eas update` だけで完了（ビルド不要）

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
eas update --branch production --environment production --message "変更内容のメモ"
```
iPhone のアプリを完全に閉じて再起動すると反映される。  
**ビルド不要・無料・1〜2分で完了。**

---

### パターン②：TestFlight に新しいビルドを送る（月1〜2回）

```
cd "C:\Users\SoichiroKamibeppu(MC\KotoClipApp"
eas build --platform ios --profile production --auto-submit
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
│   ├── gamification.ts             XP・レベル・Kotoステージ計算
│   └── notifications.ts            通知スケジュール管理
│
├── context/auth.tsx                ログイン状態（useAuth フック）
│
├── components/
│   ├── KotoBird.tsx                ★ 黄色い鳥キャラ（ステージ別6デザイン）
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
├── ios/                            ← 触るな（expo prebuild で自動生成）
│
├── app.json                        基本設定（buildNumber は EAS が自動管理）
├── eas.json                        EAS Build/Update プロファイル
├── koto-preview.html               ★ Koto 全ステージのブラウザプレビュー
├── HANDOFF.md                      このファイル
└── HANDOVER.md                     設計・API・デザインルール詳細
```

---

## 触っていいか一覧

| ファイル / フォルダ | 判断 | 理由 |
|---|---|---|
| `app/` 以下 | **自由に触る** | JS変更は eas update で即反映 |
| `lib/` 以下 | **自由に触る** | |
| `context/auth.tsx` | **自由に触る** | |
| `components/KotoBird.tsx` | **自由に触る** | |
| `targets/share-extension/ShareViewController.swift` | 触れる（要フルビルド） | Swift変更は eas update 不可 |
| `components/Onboarding.tsx` | **絶対触るな** | 確定版。変えると壊れる |
| `scripts/patch-expo-swift.py` | 慎重に触る | npm postinstall で実行されるSwiftパッチ。EASビルドの根幹 |
| `ios/` 以下 | **触るな** | EAS Buildがそのまま使用。変更は `expo prebuild` → コミット |

---

## Koto キャラクター — ステージ別デザイン

レベルに応じて Koto の見た目が変わる。`lib/gamification.ts` の `kotoStage(level)` でステージが決まる。

| ステージ | Lv | 名前 | デザイン |
|---|---|---|---|
| 1 | 1〜5 | ひよこ | 素のKoto。フラッシュカードを持つ |
| 2 | 6〜10 | 小学生 | 黄色い通学帽 ＋ 左手に水筒 |
| 3 | 11〜15 | 高校生 | 学ラン（金ボタン・立ち衿）＋ 左に学生鞄・右に辞書 |
| 4 | 16〜20 | ビジネス | スーツ（ネクタイ・眼鏡）＋ 左にスマホ・右にスーツケース |
| 5 | 21〜25 | 研究者 | 白衣（ポケット・ペン・眼鏡）＋ 右にクリップボード |
| 6 | 26〜30 | 卒業生 | ガウン・卒業帽・眼鏡 ＋ 右に卒業証書・スパークル・後光 |

**ヒーロー背景色**（`lib/gamification.ts` の `HERO_COLORS`）もステージ連動：

| ステージ | Lv | 背景イメージ |
|---|---|---|
| 1 | 1〜5 | 暗い机 |
| 2 | 6〜10 | 本棚の部屋（青） |
| 3 | 11〜15 | 読書の森（緑） |
| 4 | 16〜20 | 文脈の街（紫） |
| 5 | 21〜25 | 言葉の空（宇宙） |
| 6 | 26〜30 | Library（金） |

**デザイン確認方法：** リポジトリ内の `koto-preview.html` をブラウザで開く。全ステージがアニメーション付きで確認できる。

**実装ファイル：** `components/KotoBird.tsx`  
　- `stage` prop（1〜6）でデザイン切り替え  
　- ステージごとに SVG viewBox が異なる（サイドアクセサリーが鳥の外にはみ出すため）  
　- 翼はランダムな4ポーズでアニメーション

---

## クイズ練習（自由練習）モード — 仕様

**変更ファイル：** `app/(tabs)/study.tsx`, `lib/api.ts`

- **単語選択：** 全登録単語を FSRS 保持率でスコアリングし、忘却度が高い単語ほど選ばれやすい重み付きランダムサンプリングで10語を選出
- **セッション構成：** 10語 × 各1問 = 10問（choice/reverse をランダム割り当て）
- **FSRS elapsed_days：** `word.last_reviewed` から実際の経過日数を計算（旧：常に1日固定）
- **FSRS評価：** 保持率から `easy`/`good`/`hard`/`again` を自動判定（旧：正解=good/不正解=again の2択）

---

## 最近のコミット（直近順）

| コミット | 内容 |
|---|---|
| `51d7616` | **Koto 6ステージ全面刷新**（ひよこ・小学生・高校生・ビジネス・研究者・卒業生） |
| `de514b0` | HANDOFF.md 更新・koto-preview.html 追加 |
| `dcbc7b7` | Koto ステージアクセサリー（旧デザイン → `51d7616` で置き換え済み） |
| `272da67` | ヒーロー背景色をレベル帯で明確に区別 |
| `59cedec` | `getStats()` に XP を含め Koto ステージがレベルに連動するよう修正 |
| `8f23134` | FSRS 重み付きサンプリング・elapsed_days 修正・4段階評価自動化 |
| `efa9861` | Lv バッジ大型化・進捗テキスト削除 |
| `eef7148` | 「確実に習得」バー・キャプション・進捗テキストをホームから削除 |
| `9785199` | クイズフィードバックに XP ±表示・ホームの XP バー大型化 |
| `34ca3b1` | ゲーミフィケーション：XP バー・ウィークワードモード・コンボ追跡 |

---

## デザインルール（必ず守る）

| 色名 | 値 |
|---|---|
| 背景 | `#0E1116` |
| メインカラー（ティール） | `#2DD4BF` |
| ミュートテキスト | `#8F99A8`（**`#6B7280` は間違い**） |
| 正解 | `#7CFFB2` |
| 不正解 | `#FF6B6B` |

**フォント：** LobsterTwo_700Bold（Koto）/ SpaceGrotesk_700Bold（Clip）  
**KotoBird：** `components/KotoBird.tsx` の SVG のみ使用。絵文字で代替しない。

---

## 既知の未対応バグ

| バグ | 状況 |
|---|---|
| 起動時にアクセスできないことがある | Render のスリープが原因（15分で寝る）。`_layout.tsx` の `useRenderWarmup()` で ping を送っているが完全ではない |
| iOS の通知設定が Settings 画面から機能しない | `lib/notifications.ts` と `app/(tabs)/settings.tsx` を要確認 |

---

## 今後対応する事項（TODO）

| 項目 | 概要 | 優先度 |
|---|---|---|
| ブラウザ版ヒーロー背景の実装 | iOS版と同様の6ステージ背景（机・本棚・森・街・宇宙・図書館）を `frontend/js/Home.js` に SVG で追加する。現在は単色グラデーションのまま | 低 |

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

現在の無料プランは100語上限。プレミアムで500語に拡張する場合、クイズ画面の自由練習モードは全単語を取得してから FSRS 重み付きサンプリングを行っている。

**500語での処理量：** O(N) なので約0.1ms以下。問題なし。

**唯一の懸念はネットワーク転送量：**
- 現在（100語）: `getAllWords()` ≈ 50〜80KB
- プレミアム（500語）: ≈ 250〜400KB

問題が出たら以下のエンドポイントをバックエンドに追加する：

```python
# anki_app/server.py に追加
@app.get('/api/study/priority')
def get_priority_list(uid: str = Depends(_user_dep)):
    """FSRS優先度スコア計算に必要な最小フィールドだけ返す"""
    # id, stability, reps, last_reviewed, next_review, word, meaning, context のみ
```

**今は不要・問題が出てから対応すれば十分。**

---

## Claude Code を使う場合

このプロジェクトには Claude Code 用の設定が入っている：

- `CLAUDE.md` — プロジェクト概要（Claude が自動で読む）
- `.claude/skills/` — 詳細仕様ファイル（Claude が必要に応じて参照）

Claude Code でリポジトリを開くと自動で `CLAUDE.md` を読んで理解した状態で会話できる。
