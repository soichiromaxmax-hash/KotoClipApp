# KotoClip 完全引継ぎメモ

**このドキュメントを読めば、何も知らない状態から開発を再開できる。**

---

## 1. このアプリは何か

英語を読みながら出会った単語を保存し、スペースド・リピティション（間隔反復）で復習するアプリ。

**3つのクライアント**が同じサーバーを共有している：
1. **iOSアプリ**（このリポジトリ / React Native / Expo）
2. **ブラウザ拡張**（Chrome / Edge / Firefox）→ `soichiromaxmax-hash/KotoClip` リポジトリ
3. **Webアプリ**（React CDN）→ 同上

---

## 2. システム全体の構成

```
iOSアプリ（このリポジトリ）
ブラウザ拡張（KotoClip リポジトリ）
Webアプリ（KotoClip リポジトリ）
          ↓ HTTPS
FastAPI サーバー: https://kotoclip.onrender.com
（Render.com 無料プラン → 15分でスリープ・初回30秒かかる）
          ↓
Supabase（本番DB + Auth）/ SQLite（ローカル開発）
```

**重要：** Render.com の無料プランは15分で寝る。
アプリ起動時に `_layout.tsx` の `useRenderWarmup()` がバックグラウンドでpingを送ってウォームアップする。

---

## 3. 必要なアカウント（オーナーから受け取る）

| サービス | 用途 |
|---|---|
| Apple Developer（$99/年） | EAS Build・証明書・App Store提出 |
| Expo / EAS（soichiromax） | `eas build` / `eas submit` コマンド |
| App Store Connect | TestFlight・審査提出 |
| Render.com | サーバー自動デプロイ |
| Supabase | DB・認証 |
| Google AI Studio | Gemini API（AI翻訳） |

---

## 4. 全ファイルの役割

```
KotoClipApp/
├── app.json              Expo設定（バンドルID・権限）
├── eas.json              EAS Build/Submit設定（ascAppId は未設定・要追加）
│
├── app/
│   ├── _layout.tsx       ルートレイアウト・認証ゲート・フォント・warm-upping
│   ├── flashcard.tsx     フラッシュカード画面（10枚バッチ）
│   ├── how-to.tsx        使い方説明画面
│   ├── add.tsx           単語追加（スタック版）
│   ├── auth/login.tsx    ログイン・新規登録
│   ├── word/[id].tsx     単語詳細・AI再翻訳・削除
│   └── (tabs)/
│       ├── _layout.tsx   タブバー定義
│       ├── index.tsx     ホーム（統計・CTAカード・空状態）
│       ├── study.tsx     クイズ練習（4択のみ・スケジュール/フリー）
│       ├── add.tsx       単語追加タブ
│       ├── words.tsx     単語一覧（フィルター・ソート・お気に入り）
│       ├── settings.tsx  設定（通知・時刻・iOS通知リンク・ログアウト）
│       └── wild.tsx      野生検出（タブバー非表示）
│
├── lib/
│   ├── api.ts            全API呼び出しはここ経由（認証・リフレッシュ自動処理）
│   └── shareCard.ts      SNS共有カードの発火条件管理
│
├── context/auth.tsx      認証コンテキスト（useAuth フック）
│
├── components/
│   ├── KotoBird.tsx      黄色い鳥キャラ（空状態に全画面で使う）
│   ├── Onboarding.tsx    オンボーディング（触らない）
│   ├── SplashAnimation.tsx スプラッシュ
│   └── share/            SNS共有カード関連
│
├── modules/shared-storage/ iOSネイティブモジュール
│   └── ios/SharedStorageModule.swift  App GroupのUserDefaultsアクセス
│
├── plugins/withShareExtension.js  EAS BuildでShare Extensionを自動組み込み
│
└── targets/share-extension/
    └── ShareViewController.swift  Share Extension本体（Swift）
```

---

## 5. 重要なファイルの詳細

### `lib/api.ts` — APIクライアント

```ts
// 主要メソッド
api.getStats()           // ホーム統計（due/total/mastered/streak）
api.getDue(10)           // SRS復習対象
api.getAllWords(10, true) // ランダム10語（クイズ練習）
api.postReview(id, rating, elapsed) // 復習結果送信
api.listWords()          // 単語一覧
api.addWord(payload)     // 単語追加
api.lookup(word)         // AI翻訳（認証不要）
api.getSettings() / updateSetting(key, value)
api.login / signup / logout
```

- 401 → refresh_token で自動再取得 → 失敗したらログイン画面
- トークンは AsyncStorage + App Group UserDefaults の両方に保存

### `app/(tabs)/study.tsx` — クイズ練習

- 4択のみ（穴埋めは廃止・追加禁止）
- `QuizQuestion` 1つで choice（単語→意味）と reverse（意味→単語）に対応
- 復習結果保存失敗時にリトライUIを表示

### `targets/share-extension/ShareViewController.swift`

- 認証不要で `/api/lookup?word=` を呼んでAI翻訳表示
- 保存時のみトークンをチェック。なければLogin画面
- App Group `group.jp.kotoclip.app` でメインアプリとトークン共有

---

## 6. デザインルール（必ず守る）

**色の唯一の正解：** `anki_app/frontend/style.css` の `:root`

| 色名 | 値 | 注意 |
|---|---|---|
| 背景 | `#0E1116` | |
| メインカラー（ティール） | `#2DD4BF` | |
| ミュートテキスト | `#8F99A8` | **`#6B7280` は間違い** |
| 正解 | `#7CFFB2` | |
| 不正解 | `#FF6B6B` | |

**フォント：** LobsterTwo_700Bold（Koto）/ SpaceGrotesk_700Bold（Clip）

**KotoBird（黄色い鳥）：**
- `components/KotoBird.tsx` の1種類のみ。絵文字で代替しない
- 推奨サイズ: ホーム=130・単語帳=100・クイズ=82・ローディング=76

---

## 7. APIエンドポイント一覧

サーバー: `https://kotoclip.onrender.com/api`

| パス | 認証 | 用途 |
|---|---|---|
| `GET /stats` | 要 | ホーム統計 |
| `GET /words` | 要 | 単語一覧 |
| `POST /words` | 要 | 単語追加 |
| `DELETE /words/{id}` | 要 | 単語削除 |
| `POST /study/review` | 要 | 復習結果送信 |
| `GET /study/due` | 要 | 復習期限済み単語 |
| `GET /study/all` | 要 | ランダム単語 |
| `GET /study/choices/{id}` | 要 | 選択肢取得 |
| `GET /lookup?word=` | **不要** | AI翻訳・例文 |
| `GET /ext-version` | **不要** | 拡張バージョン確認 |
| `POST /auth/login` | なし | ログイン |
| `POST /auth/signup` | なし | 新規登録 |
| `POST /auth/refresh` | なし | トークン更新 |
| `GET /settings` | 要 | 通知設定 |
| `POST /settings` | 要 | 通知設定更新 |

---

## 8. 現在の状態（2026-05-06）

**最新ビルド: Build #21**（EAS ID: `39929ac5-83c8-442c-b77c-21eacd6cf38c`）
**TestFlight 未提出。**

| 機能 | 状態 |
|---|---|
| スプラッシュ・オンボーディング | ✅ |
| ホーム・学習・単語帳・設定 | ✅ |
| クイズ練習（4択のみ） | ✅ |
| Share Extension | ✅ |
| SNS共有カード | ✅ |
| 収益化・分析・SNS共有Phase2 | ❌ 未実装 |

---

## 9. すぐにやること

**TestFlight に提出：**
```
cd "C:\Users\SoichiroKamibeppu(MC\KotoClipApp" && eas submit --platform ios --id 39929ac5-83c8-442c-b77c-21eacd6cf38c
```

初回はApp Store ConnectへのログインとascAppIdの入力を求められる。
App Store ConnectのURLから数字を取得して `eas.json` に追記しておく：
```json
"submit": {
  "production": {
    "ios": { "ascAppId": "【URLの数字】" }
  }
}
```

---

## 10. 開発ワークフロー

```
# 新しいビルドを作る
cd "C:\Users\SoichiroKamibeppu(MC\KotoClipApp" && eas build --platform ios

# TestFlightに提出（ビルドID は上記コマンドの出力から取得）
cd "C:\Users\SoichiroKamibeppu(MC\KotoClipApp" && eas submit --platform ios --id 【ビルドID】
```

- Expo Go では動かない（SharedStorageネイティブモジュールのため）
- 全確認は TestFlight で行う

---

## 11. 禁止事項

| 禁止 | 理由 |
|---|---|
| `Onboarding.tsx` を編集 | 確定版・壊すと直すのが困難 |
| ミュートカラーに `#6B7280` | 正解は `#8F99A8` |
| クイズに穴埋め追加 | 廃止済み・ユーザー評価が低い |
| `_migrate()` を通さないDBスキーマ変更 | 本番データが壊れる |
| Expo Goで確認 | SharedStorageが動かない |
| TikTokをSNS共有に追加 | 廃止済み |

---

## 12. よくあるエラー

| 症状 | 対処 |
|---|---|
| `eas submit` 失敗 | eas.json に ascAppId を追加 |
| `eas build` 失敗 | Apple Developer Portal で `group.jp.kotoclip.app` を作成済みか確認 |
| ホームが接続エラー | Render cold start（最大30秒）→「再試行」ボタンを押す |
| AI例文が出ない | server.py のデプロイ確認・maxOutputTokens=1000 を確認 |
| Share Extensionが毎回ログイン要求 | Apple Developer Portal でApp Group作成→再ビルド |
| フォントが出ない | `_layout.tsx` の `useFonts` を確認 |
| SNS共有カードが出ない | AsyncStorage `koto_share_state_v1` を削除してリセット |

---

## 13. Claude Code を使う場合

このプロジェクトには Claude Code 用の設定が入っている：

- `CLAUDE.md` — プロジェクト概要（Claude が自動で読む）
- `.claude/skills/` — 詳細仕様ファイル（Claude が必要に応じて参照）

Claude Code でこのリポジトリを開くと、自動で `CLAUDE.md` を読んでプロジェクトを理解した状態で会話できる。
詳細な仕様が必要になったら「share-extensionの仕様を見せて」などと言えばスキルファイルを参照する。
