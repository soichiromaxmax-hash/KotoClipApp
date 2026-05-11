---
name: build
description: EAS Build・TestFlight・App Store 申請手順・ロードマップ・将来実装予定を調べるとき
---

# ビルド・リリース手順

## 前提
- Expo Go では動かない（SharedStorage ネイティブモジュールのため）
- すべての確認は EAS Build → TestFlight で行う

## EAS Build（iOS）
```bash
cd "C:/Users/SoichiroKamibeppu(MC/KotoClipApp"
eas build --platform ios --profile production
```
15〜25分で IPA 生成 → 自動で App Store Connect にアップロード

## Apple Developer 設定
| 項目 | 値 |
|---|---|
| バンドルID | `jp.kotoclip.app` |
| App Group | `group.jp.kotoclip.app` |
| EAS Project ID | `f90b1ad4-f8a9-4345-84f5-e1a5d443dbad` |

## app.json buildNumber の更新ルール
ビルドを提出するたびに `buildNumber` を +1 する（現在: **39**）。
`app.json` の `ios.buildNumber` フィールドを文字列で更新する。

## TestFlight確認チェックリスト
- [ ] スプラッシュアニメーション（約5秒、詰まったら6.5秒後に強制終了する）
- [ ] オンボーディング（初回インストールのみ表示・2回目以降は出ない）
- [ ] 全画面フォント（Koto=LobsterTwo, Clip=SpaceGrotesk）
- [ ] ホーム：単語あり → 統計が正しく表示される
- [ ] ホーム：タブを切り替えて戻ってもスピナーが出ない（キャッシュ表示）
- [ ] ホーム：学習完了後に戻ると統計が更新されている
- [ ] 単語帳空状態（KotoBird + 「最初の単語を追加する」ボタン）
- [ ] 「最初の単語を追加する」ボタン → 追加タブへ遷移（`/add` 404にならない）
- [ ] 「AIで意味を自動入力」ボタン → 自動翻訳、メモが消えない
- [ ] 保存成功「保存できました。あとで復習に出てきます。」
- [ ] ログアウト確認ダイアログ
- [ ] 設定：通知設定4トグル（毎日リマインダー・ストリーク・マイルストーン・週次）
- [ ] 設定：リマインダー時刻ピッカー（0:00〜23:30 24h表記）
- [ ] 設定 → 「KotoClipの使い方」→ 使い方画面
- [ ] Share Extension（App Group 設定後に確認）
- [ ] AI再翻訳ボタン（単語詳細）

## App Store Connect
- スクリーンショット: iPhone 6.9" (1320×2868px) 最低3枚 + 5.5インチも必須
- プライバシーポリシーURL: https://kotoclip.onrender.com/privacy.html
- カテゴリ: 教育 / 年齢区分: 4歳以上

## 現在のフェーズ（2026-05-10）
- Build #39 ソースコード修正完了。未コミット。
- 次ステップ: git commit → push → EAS Build 実行 → TestFlight 確認 → App Store 審査

## 完了済み ✅
- [x] Apple Developer Program 登録（$99/年）
- [x] EAS Build 設定（eas.json・app.json・EAS Project ID）
- [x] iOS Share Extension 実装（Swift + Config Plugin）
- [x] プライバシーポリシー公開
- [x] アプリアイコン（1024×1024px）配置済み
- [x] ITSAppUsesNonExemptEncryption: false 設定済み
- [x] expo-notifications プラグイン設定済み（Build #38〜）
- [x] 通知設定画面実装（毎日リマインダー・週次サマリー・マイルストーン・ストリーク）
- [x] homeCache リセット（学習完了・認証期限切れ時）
- [x] オンボーディング初回のみ表示（onboardingChecked ref）

## 未完了 ⏳（優先順）
1. **git commit & push & EAS Build**: Build #39 をビルドして TestFlight に配信
2. **Share Extension 動作確認**: App Group `group.jp.kotoclip.app` を Developer Portal で作成・紐付け → 再ビルド
3. App Store Connect でメタデータ入力・審査提出

## 将来実装予定（公開後）
1. 100語上限 + 課金誘導UI
2. AI解説月10回制限
3. RevenueCat 導入（サブスク）
4. 問題バリエーション複数化（意味→単語・穴埋め・例文選択）
5. 多言語対応（`native_language` / `learning_language` 設計あり）
6. Android 対応（adaptiveIcon 設定済み・Share Extension は別途実装が必要）

## よくあるトラブル
| 状況 | 対処 |
|---|---|
| tsc エラー: `expo-router/react-navigation` not found | `from 'expo-router'` に変更する |
| tsc エラー: `expo-router/js-tabs` not found | `haptic-tab.tsx` を `Pressable` ベースで書き直す |
| `eas build` 失敗 | Apple Developer Portal で App Group 作成済みか確認 |
| フォントが出ない | `_layout.tsx` の `useFonts` 呼び出し確認 |
| SharedStorage エラー | Expo Go を使っていないか確認 |
| ホーム統計が全部0 | `lib/api.ts` の `getStats` でフィールドマッピング済み（due_count→due 等）。サーバー側フィールド名を変えたら要更新 |
| Share Extension「ログインしてください」| App Group が Developer Portal で未作成 or 紐付け未設定 |
| スプラッシュが永遠に出る | `SplashAnimation.tsx` の 6.5 秒強制終了タイマーが発火するはず。発火しない場合は `fontsLoaded` の問題 |
| ホームに戻っても統計が更新されない | `study.tsx` の `resetHomeCache()` 呼び出しを確認 |
