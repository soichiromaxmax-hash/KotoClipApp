# KotoClip — 引き継ぎメモ（完全版）

**最終更新: 2026-07-05（Sandbox購入テスト完了・複数バグ修正・詳細は0-3章）**

---

## ▶ まず最初に読む

このファイルを最初から最後まで読めば、何も知らない状態から開発を再開できる。
「どこに何があるか分からない」状態にならないよう、ファイルパスを含めてすべて具体的に書いてある。

---

## 0. 最新状況（2026-06-30 夜 更新）★ここから読む

### 現在のビルド・OTA状態

| 項目 | 値 |
|---|---|
| 直近の EAS Build（iOS） | **Build #43**（2026-07-05 実行。Share Extensionの実体不一致修正・言語設定対応を含む） |
| App Store 審査 | **2026-07-05 提出済み・審査待ち**（カテゴリ:教育、価格:無料+アプリ内課金、プライバシーポリシー・データ収集申告・年齢制限すべて設定済み） |
| 次回 EAS Build 時のビルド番号 | **#44**（appVersionSource: remote による自動採番） |
| RevenueCat（課金機能） | ✅ 設定完了・Sandbox実購入検証済み |
| OTA チャンネル | production チャンネル ✅ 作成・接続済み |
| Swiftバージョン設定（訂正） | Main app・Share Extension・Podsとも`SWIFT_VERSION '5.0'`で統一（RevenueCat系podのみ対象外）。以前「メインアプリ/拡張は6.0」としていたのは誤りだった（12章参照） |

### 2026-06-30 に実施した変更

**OTA配信済み（ビルド不要・即反映）:**

| 内容 | ファイル |
|---|---|
| Lv10でKotoが進化するよう修正（旧: Lv11から変わっていた） | `lib/gamification.ts` |
| 復習完了後に「もう一度」ボタンを追加（連続復習ができなかった問題を修正） | `app/(tabs)/study.tsx` |
| 起動ループバグ修正（サーバー遅延時にログイン画面→ホームの無限リダイレクト） | `app/(tabs)/index.tsx` |
| 起動時タイムアウトを8秒→30秒に延長（Renderコールドスタート対応） | `app/(tabs)/index.tsx` |
| 設定画面「KotoClipの使い方」→「単語の保存の仕方」に変更 | `app/(tabs)/settings.tsx` |
| 使い方説明画面（how-to）：バッジ横並びレイアウトが原因の不自然な改行を修正。バッジを縦積みに変更＋文の区切りで明示的に改行 | `app/how-to.tsx` |
| 使い方説明画面：「その他」トグルの説明を実際のiOS挙動（タップすれば即使える／ONは任意のお気に入り登録）に修正 | `app/how-to.tsx` |
| 使い方説明画面：ブラウザ版に「訳が表示されない場合は右クリック→『KotoClipに保存』」の手順を追加 | `app/how-to.tsx` |
| Paywall画面：実際の商品構成（月額/半年）に合わせて「年額」表記・お得率計算を修正 | `app/paywall.tsx` |
| RevenueCat 公開APIキーを設定 | `lib/purchases.ts` |

**Build #42（ネイティブビルド）に含まれる変更:**

| 内容 | ファイル |
|---|---|
| RevenueCatネイティブSDK（react-native-purchases）を初めて組み込み | package.json（既存の依存関係が今回初めてコンパイルされた） |
| RevenueCat系podをSwift 5.0強制設定から除外（podspecが要求するSwift 5.7でビルドされるように） | `ios/Podfile` |

### 現在の課金プラン構成（当初計画から変更あり）

| プラン | Product ID | 価格 |
|---|---|---|
| 月額 | `jp.kotoclip.premium.monthly` | $1.99（¥300） |
| 半年（Product IDは`yearly`のまま） | `jp.kotoclip.premium.yearly` | $9.99（¥1,500） |

サブスクリプショングループ: `KotoClip Premium`（Group ID: `22200798`）
RevenueCat Entitlement: `premium`

### 次にやること（優先順・2026-07-05更新）

| # | 内容 | 状態 |
|---|---|---|
| 1 | RevenueCat 設定 | ✅ 完了 |
| 2 | Build #42 → App Store 審査提出 | ✅ 提出済み・Apple処理待ち |
| 3 | KotoClip Plus フェーズ1（安全な課金基盤） | ✅ 完了。**Sandbox実購入テストも完了**（0-3章参照） |
| 4 | 価格変更（月額¥450・半年¥2,400） | ✅ 完了 |
| 5 | Render無料プランのスリープ対策（cron-job.orgで10分おきping） | ✅ 設定済み |
| 6 | KotoClip Plus フェーズ2（苦手語モード制限・Koto成長Lv制限・週間レポート分岐・広告・バッジ等） | ❌ 未着手 |
| 7 | 言語別フィルタリング（スペイン語/英語を別々に管理） | ❌ 後回し（30〜45分の作業） |
| 8 | Expoパッケージ10個がSDK推奨バージョンよりわずかに古い（要調査） | ⚠️ 意図的に保留中（下記12章参照） |
| 9 | 今後の機能バックログ（他言語対応・デスクトップ取り込み・写真OCR読み込み・オフライン対応） | ❌ 未着手・優先度未設定 |

---

## 0-2. KotoClip Plus フェーズ1（2026-07-01・完了）

新しい課金仕様「KotoClip Plus」への移行を開始。フェーズ1は「安全な課金基盤」に絞って実装・本番デプロイ済み。詳細な設計判断は `C:\Users\SoichiroKamibeppu(MC\.claude\plans\zippy-dazzling-parnas.md` に残っている。

### やったこと

**フロントエンド（このリポジトリ）:**
- RevenueCatのユーザーIDを メールアドレス → **Supabase UID** に変更（`lib/api.ts` / `lib/purchases.ts` / `context/auth.tsx`）。Webhookで正しくユーザーを特定するために必須の変更だった
- `app/paywall.tsx`: 動いていなかった `api.updateSetting('is_premium', '1')` の直書きを削除（サーバー側にそのカラムが無く、常に無視されていたバグ）

**バックエンド（別リポジトリ: `C:\Users\SoichiroKamibeppu(MC\anki_app`）:**
- `user_stats` に `plan`（free/plus）・`subscription_status`・`subscription_expires_at`・AI利用回数カラムを追加
- `POST /api/webhooks/revenuecat` を新設。RevenueCatからのWebhookを受けて、Subscriber APIで最新状態を取得しDBに反映
- 単語保存上限: 100語 → **50語**（無料プラン）
- AI意味検索: 月20回（無料）/ 300回（Plus）、AI再翻訳: 月5回（無料）/ 100回（Plus）の制限を追加
- Render環境変数 `REVENUECAT_SECRET_KEY` / `REVENUECAT_WEBHOOK_SECRET` を設定済み・本番で疎通確認済み

### 検証済み・未検証

| 項目 | 状態 |
|---|---|
| Webhook認証（Authorizationヘッダー） | ✅ 本番で確認済み |
| RevenueCat Secret Keyでの接続 | ✅ 本番で確認済み |
| 不正なapp_user_idへの耐性 | ✅ 修正・確認済み |
| 既存機能（AI検索・単語保存等）への影響 | ✅ 破壊なし確認済み |
| **実際のSandbox購入でplanが`plus`に切り替わるか** | ✅ **2026-07-05検証済み**（購入→Webhook→plan更新→アプリ反映まで確認） |

### 価格（App Store Connect / RevenueCat）

**2026-07-05: 月額¥450・半年¥2,400に変更済み。**

### KotoClip Plus フェーズ2（未着手・スコープ外にしたもの）
- 苦手語モードの日次制限
- Koto成長Lv10以降のPlus限定解放
- 週間レポート簡易/詳細分岐
- 広告導入（無料プランのみ）
- バッジ拡充
- Paywall誘導文言・トリガータイミング作り込み（40語到達時の警告など）
- Share Extension（Swift）のトークン送信対応 → 現状Share ExtensionからのAI検索は無制限のまま（ネイティブ再ビルドが必要なため）

---

## 0-3. 2026-07-05 バグ修正まとめ（Sandbox購入テスト中〜その後に発覚した不具合）

Sandbox購入テストをきっかけに、いくつか派生バグが見つかり全て修正・OTA配信済み。

### 認証・データ消失系
- **購入後にプレミアム表示が反映されない**: `add.tsx`/`settings.tsx`がis_premium取得を起動時1回だけ（`useEffect`）しか行っておらず、Paywallから戻っても更新されなかった。`useFocusEffect`化して修正。あわせてPaywall側は購入成功後、バックエンドのWebhook反映を待ってから成功メッセージを出すよう変更（`waitForPlanSync`）
- **単語保存が時々消える（モバイルアプリ・ブラウザ拡張機能の両方）**: Supabaseのリフレッシュトークンは使い切り式のため、複数APIリクエストが同時に401→リフレッシュを行うと片方が失敗し、最悪トークンファミリーごと失効していた。`lib/api.ts`の`refreshAccessToken()`と拡張機能（3種）の`attemptRefresh()`を同時実行1本化して修正
- **保留単語（pending words）がRenderのコールドスタートで消えるリスク**: `anki_app`側で保存先をローカルSQLite→Supabaseに移行

### 日付境界（UTC/JST）系（根が深く3回に分けて修正）
- 「今日覚えた」がおかしい・「今日の復習」がホームと復習画面で食い違う・**復習したのに同じ単語がその日のうちに何度も復習リストに戻ってくる**、の3つは全て同根。Renderのサーバー時刻はUTCだが、ユーザーはJSTで「今日」を判断するため、`date.today()`をそのまま使っている箇所が日付境界をまたぐタイミングでズレていた
- `anki_app/db_supabase.py`に`_today_jst()`/`_now_jst()`ヘルパーを新設し、日付境界に関わる箇所を全てJST基準に統一（today_count・due判定・ストリーク・週間集計・野生の「今日出会った」等）
- **`anki_app/fsrs.py`（次回復習日の計算）も同様にJST化**（最初の修正で見落としていた箇所。ここが直っていなかったせいで「同じ単語が何度も出てくる」が起きていた）
- 今後この手のバグを絶対再発させないよう、`anki_app/CLAUDE.md`に「日付境界は`_today_jst()`/`_now_jst()`経由必須」ルールを明記済み

### 表示不具合
- 単語帳画面（`words.tsx`）: プレミアムでも単語数上限が「100」と表示される不具合。`is_premium`/`word_limit`を一切見ずハードコードされた`FREE_LIMIT=100`を使っていたのが原因。設定APIから実際のプラン状態を取得するよう修正
- 設定画面: 同様の`?? 100`フォールバックが残っていた箇所を、実際の無料上限（50語）に合わせて修正
- ホーム画面「今日の復習」カードの大きい数字が実データと繋がっておらず固定文字列`"01"`のままだった → 実際の復習件数を表示するよう修正
- 「今日の復習」セッション終了時、実際にまだ期限切れの単語が残っているか確認し、無ければ「もう一度」ボタンの代わりに「今日の復習は終わりです」と表示するよう変更

### コンテンツ・訴求
- 「単語の保存の仕方」ガイド: タイトル修正・初回/保存方法の分割を廃止して1本の流れに統合・文字サイズ拡大・不自然な改行を撤廃・PCブラウザに拡張機能必須の注意バナーを追加。**PCブラウザの保存フロー説明が実装と不一致だった**（実際には「Kボタン」は存在せず、単語を選択すると自動で訳ポップアップが出る仕様）ため、実装に合わせて修正
- Premium画面: AI意味検索（20→300回/月）・AI再翻訳（5→100回/月）の具体的な回数を明記し、無料プランとの対比でメリットを訴求

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
| ① | `.p8` ファイル（App Store Connect API キー） | `C:\Users\SoichiroKamibeppu(MC\OneDrive\Desktop\ChatGPT Vocab Test\AuthKey_HK23GAU47L.p8` |
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
├── eas.json                  ← EASビルド/サブミット設定
├── package.json              ← npm依存パッケージ（expo ~55.0.26）
├── credentials.json          ← ローカル証明書の参照先
│
├── credentials/ios/          ← 証明書ファイル本体（絶対に触るな）
│   ├── dist-cert.p12
│   ├── profile.mobileprovision
│   └── shareextension.mobileprovision
│
├── scripts/
│   └── patch-expo-swift.py   ← EASビルド時にnpm postinstallで自動実行されるSwiftパッチ
│
├── ios/                      ← 触るな（EAS Buildがそのまま使用）
│
├── app/                      ← 画面ファイル（ここをよく触る）
│   ├── _layout.tsx           ← ルート（認証・フォント・Renderウォームアップ）
│   ├── flashcard.tsx
│   ├── how-to.tsx            ← スマホ / PC タブ構成（「単語の保存の仕方」リンク先）
│   ├── paywall.tsx           ← RevenueCat ペイウォール（月額+年額）
│   ├── auth/login.tsx
│   ├── word/[id].tsx
│   └── (tabs)/
│       ├── index.tsx         ← ホーム（XPバー・統計・CTAカード）
│       ├── study.tsx         ← クイズ練習（4択）・復習・苦手語
│       ├── add.tsx           ← 単語追加（word_limit 動的対応）
│       ├── words.tsx         ← 単語帳一覧
│       └── settings.tsx      ← 設定（言語・通知・プラン）
│
├── lib/
│   ├── api.ts                ← API呼び出しはすべてここ経由
│   ├── gamification.ts       ← XP・レベル・Kotoステージ計算
│   ├── homeCache.ts          ← ホーム画面のキャッシュ
│   ├── notifications.ts      ← プッシュ通知
│   └── purchases.ts          ← RevenueCat 課金ロジック（APIキー設定済み・2026-06-30）
│
├── context/auth.tsx          ← ログイン状態（useAuth フック）
│
└── components/
    ├── KotoBird.tsx          ← 黄色い鳥キャラ（ステージ別6デザイン）
    ├── Onboarding.tsx        ← ★絶対に触るな（確定版）
    └── SplashAnimation.tsx
```

---

## 6. 日常の開発コマンド

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

### パターン②：TestFlight に新しいビルドを送る（月1〜2回）

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

## 7. 触っていいか一覧

| ファイル / フォルダ | 判断 | 理由 |
|---|---|---|
| `app/` 以下 | **自由に触る** | JS変更はOTAで即反映 |
| `lib/` 以下 | **自由に触る** | |
| `context/auth.tsx` | **自由に触る** | |
| `components/KotoBird.tsx` | **自由に触る** | |
| `targets/share-extension/ShareViewController.swift` | 触れる（要フルビルド） | Swift変更はOTA不可 |
| `components/Onboarding.tsx` | **絶対触るな** | 確定版。変えると壊れる |
| `scripts/patch-expo-swift.py` | 慎重に触る | EASビルドの根幹 |
| `ios/Podfile` | 慎重に触る | Swiftバージョン強制設定の根幹（RevenueCat除外設定あり・2026-06-30） |
| `ios/` 以下（Podfile以外） | **触るな** | EAS Buildがそのまま使用 |
| `credentials/ios/` | **触るな** | 証明書ファイル本体 |

---

## 8. デザインルール（必ず守る）

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

## 9. Koto キャラクター ステージ別デザイン

| ステージ | Lv | 名前 | デザイン |
|---|---|---|---|
| 1 | 1〜5 | ひよこ | 素のKoto・フラッシュカードを持つ |
| 2 | 6〜9 | 小学生 | 黄色い通学帽 ＋ 左手に水筒 |
| 3 | 10〜14 | 高校生 | 学ラン（金ボタン・立ち衿）＋ 左に学生鞄・右に辞書 |
| 4 | 15〜19 | ビジネス | スーツ（ネクタイ・眼鏡）＋ 左にスマホ・右にスーツケース |
| 5 | 20〜24 | 研究者 | 白衣（ポケット・ペン・眼鏡）＋ 右にクリップボード |
| 6 | 25〜30 | 卒業生 | ガウン・卒業帽・眼鏡 ＋ 右に卒業証書・スパークル・後光 |

ステージ変わるタイミング: **Lv 6, 10, 15, 20, 25** でKotoが進化する。
デザイン確認: `koto-preview.html` をブラウザで開く。
実装ファイル: `components/KotoBird.tsx`・`lib/gamification.ts`

---

## 10. 既知のバグ・未解決事項

| 内容 | 状況 |
|---|---|
| iOS の通知設定が一部機能しない | `lib/notifications.ts` の権限フロー問題・未修正 |
| 言語別フィルタリング未実装 | スペイン語と英語の単語が同じリストに混在する。将来対応予定（工数30〜45分）。 |

---

## 11. よくあるエラー

| 症状 | 対処 |
|---|---|
| `eas build` 失敗 | Apple Developer Portal で `group.jp.kotoclip.app` App Group を確認 |
| 証明書上限エラー | https://developer.apple.com/account/resources/certificates/list で古い Distribution 証明書を削除 |
| `eas submit` 失敗 | `eas.json` に `ascAppId: "6765753980"` が入っているか確認 |
| SDK version issue（Apple拒否） | `eas.json` の `image` が `"latest"` になっているか確認 |
| ホームが接続エラー | Render cold start（最大30秒）→「再試行」ボタンを押す。cron-job.orgでのkeep-aliveping設定済み（10分おき）なので基本的には起きないはず |
| AI例文が出ない | server.py のデプロイ確認 |
| Share Extension が毎回ログイン要求 | Apple Developer Portal で App Group 作成 → 再ビルド |
| RevenueCatの「App Store Connection」で.p8アップロード時にエラー | **2種類のキーが必要**。①App Store Connect API Key（`AuthKey_XXXXXXXXXX.p8`・EAS Build用と共通）と②In-App Purchase Key（`SubscriptionKey_XXXXXXXXXX.p8`・Users and Access → Integrations → In-App Purchaseで別途発行）。RevenueCatの画面には両方の入力欄がある |
| RevenueCatで新規ネイティブモジュール追加後にビルドが不安 | `ios/Podfile`のpost_installが全podをSwift 5.0に強制する設定になっている。podspecがSwift 5.7以上を要求するライブラリ（RevenueCat等）を追加する場合は、対象podをこの強制から除外すること（12章参照） |

---

## 12. ビルドの仕組み（EAS Build）

```
npm install
  └── postinstall → scripts/patch-expo-swift.py（Swiftパッチ自動適用）
pod install（ios/Podfileを使用）
  └── post_install: 名前に"Purchases"を含まないpodだけSwift 5.0 + SWIFT_STRICT_CONCURRENCY=minimalに強制
xcodebuild archive → IPA export → TestFlight upload（--auto-submit時）
```

**なぜパッチが必要か:**
expo SDK 55のネイティブコードにSwift 6 concurrencyエラーが含まれている。
Podfileで全podをSwift 5.0モードにしてactor isolationを抑制しつつ、
それでも残るSendable系エラーをpatch-expo-swift.pyで個別修正している。

**RevenueCat系podは対象外（2026-06-30追加）:**
`react-native-purchases`（RNPurchases）・`PurchasesHybridCommon` はpodspecで
`swift_version = '5.7'`を要求しており、全pod一律5.0強制のままだと構文エラーになりうる。
RevenueCat公式トラブルシューティングも「PodfileでSWIFT_VERSIONを上書きしないこと」と明記している。
そのため `ios/Podfile` の post_install で `next if target.name =~ /Purchases/i` を追加し、
RevenueCat系podだけこの強制から除外している。
**新しいネイティブライブラリを追加するときは、同様にpodspecの要求Swiftバージョンを確認し、
必要なら同じ除外パターンを検討すること。**

**保留中の技術的負債（2026-06-30時点）:**
`npx expo install --check` で10個のExpoパッケージ（expo本体・expo-notifications・expo-web-browser等）が
SDK推奨バージョンよりわずかに古いことが判明している。あえて更新していない理由は、
`scripts/patch-expo-swift.py` が現在インストールされているバージョンの
ソースコードを一言一句ピンポイントで書き換えるパッチだから。バージョンを上げると
パッチが当たらなくなり（`WARN: pattern not found`と警告は出るがビルドは止まらない）、
過去に直したSwiftコンパイルエラーが再発するリスクがある。
更新する場合は、パッチが引き続き当たるか個別に検証してから行うこと。

---

## 13. システム構成

```
iOSアプリ（このリポジトリ）
ブラウザ拡張・Webアプリ（soichiromaxmax-hash/KotoClip リポジトリ）
          ↓ HTTPS
FastAPI サーバー: https://kotoclip.onrender.com
（Render.com 無料プラン → 15分でスリープ・初回最大30秒かかる）
          ↓
Supabase（本番DB + Auth）
```

---

## 14. Apple Developer Portal の確認場所

- **App Group（設定済み・変更不要）:** https://developer.apple.com/account/resources/identifiers/list
  - `jp.kotoclip.app` → `group.jp.kotoclip.app`
  - `jp.kotoclip.app.share` → `group.jp.kotoclip.app`
- **Distribution 証明書（上限3枚）:** https://developer.apple.com/account/resources/certificates/list
  - 上限に達したら古いものを削除してからビルドする

---

## 15. 禁止事項

| 禁止 | 理由 |
|---|---|
| `Onboarding.tsx` を編集 | 確定版。壊すと直すのが困難 |
| ミュートカラーに `#6B7280` | 正解は `#8F99A8` |
| クイズに穴埋め追加 | 廃止済み。ユーザー評価が低い |
| Expo Goで確認 | SharedStorageネイティブモジュールが動かない |

---

## 16. Claude Code を使う場合

```powershell
cd "C:\Users\SoichiroKamibeppu(MC\KotoClipApp"
claude
```

- `CLAUDE.md` — プロジェクト概要（Claude が自動で読む）
- `.claude/skills/` — 詳細仕様ファイル（必要に応じて参照）

**注意:** Claude Code はプロジェクトディレクトリで起動しないと `CLAUDE.md` を読まず、
ファイルの場所を把握していない状態で会話が始まる。必ず `cd` してから起動すること。
