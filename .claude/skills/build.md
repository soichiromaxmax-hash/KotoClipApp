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
`eas.json` に `appVersionSource: "remote"` と `autoIncrement: true` が設定されているため、EAS が自動でビルド番号を管理する。`app.json` の `buildNumber` は EAS では無視される。

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

## 現在のフェーズ（2026-06-01）

| 項目 | 状態 |
|---|---|
| ビルドパイプライン | EAS Build のみ（Codemagic・Xcode Cloud は廃止済み）|
| TestFlight | 未提出（iOS 26 API エラーパッチ中）|
| OTA 更新（eas update） | EAS Build 成功後に利用可能 |

### 日常開発フロー

```bash
# JS/TSの変更（毎日の作業）← ビルド不要
cd "C:/Users/SoichiroKamibeppu(MC/KotoClipApp"
npx eas update --branch production --environment production --message "変更内容"
# iPhoneのアプリを完全に閉じて再起動で反映（1〜2分）

# Swift・ネイティブコードの変更
npx eas build --platform ios --profile production --auto-submit
# 30〜40分で TestFlight に自動送信
```

## 完了済み ✅
- [x] Apple Developer Program 登録（$99/年）
- [x] EAS Build 設定（eas.json・app.json・EAS Project ID）
- [x] iOS Share Extension 実装（Swift + Config Plugin）
- [x] プライバシーポリシー公開
- [x] アプリアイコン（1024×1024px）配置済み
- [x] ITSAppUsesNonExemptEncryption: false 設定済み
- [x] 通知設定画面実装（毎日リマインダー・週次サマリー・マイルストーン・ストリーク）
- [x] homeCache リセット（学習完了・認証期限切れ時）
- [x] オンボーディング初回のみ表示（onboardingChecked ref）
- [x] フラッシュカード終了後「違う10枚へ」ボタン追加
- [x] 通知 trigger フォーマット修正（SchedulableTriggerInputTypes.CALENDAR）

## 未完了 ⏳（優先順）
1. **EAS Build 実行**: `eas build --platform ios --profile production --auto-submit`（iOS 26 Toolbar パッチ適用済み、ビルド通過見込み）
2. **Share Extension 動作確認**: App Group `group.jp.kotoclip.app` を Developer Portal で作成・紐付け → 再ビルド
3. App Store Connect でメタデータ入力・審査提出
4. 起動時アクセスエラー（Render スリープ）の対策
5. iOS 通知許可ダイアログの初回表示確認

## リリース前（必須）
| 項目 | 内容 |
|---|---|
| 無料/有料区別 | free / premium フラグをサーバーで管理 |
| 単語数制限 | 無料は100語まで、課金で解除 |
| AI検索回数制限 | 無料は月10回まで |
| RevenueCat 導入 | iOS サブスク管理（App Store 課金に必要） |
| 学習言語設定 | 英語/スペイン語/中国語/日本語 |
| 説明言語設定 | 日本語/英語/スペイン語/中国語 |
| 言語別単語帳 | 学習言語ごとに単語帳・復習を分離 |
| Google/Apple ログイン | 登録ハードル削減（Apple ログインは Google を入れる場合に必須） |

## リリース後すぐ
| 項目 | 内容 |
|---|---|
| UI 多言語化 | ボタン・画面文言を日英西中に翻訳 |
| App Store 文言多言語化 | 英語/スペイン語/中国語のストア文言 |
| 言語別 AI 品質改善 | スペイン語活用形・中国語ピンイン等 |

## 中期（リリース後）
| 項目 | 内容 |
|---|---|
| 写真から OCR 読み込み | スクショから単語抽出 |
| 広告（無料ユーザー限定） | UX 確認しながら慎重に導入 |
| オフライン対応 | 単語帳・復習をオフラインで表示 |
| PC デスクトップアプリ | まずブラウザ拡張強化が先 |

## リリース前の最小ゴール
日本語 UI のまま、英語/スペイン語/中国語/日本語の単語を保存・復習でき、
無料ユーザーは単語数とAI検索に制限があり、有料で解除できる。

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
