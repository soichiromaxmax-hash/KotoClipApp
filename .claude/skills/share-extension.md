---
name: share-extension
description: iOS Share Extension・SharedStorage Native Module・App Group の実装詳細を調べるとき
---

# iOS Share Extension

## 概要
iPhoneで任意のテキストを選択→共有→KotoClip で単語を追加する機能。
EAS Build の prebuild 時に Config Plugin が自動で Xcode プロジェクトへ組み込む。

## ファイル構成

```
targets/share-extension/
  ShareViewController.swift       Swift 実装本体
modules/shared-storage/
  ios/SharedStorageModule.swift   Expo Native Module
  index.ts                        TypeScript ラッパー
  package.json / expo-module.config.json
plugins/
  withShareExtension.js           Config Plugin
```

## ShareViewController.swift

- クラス: `ShareViewController: UIViewController`
- `private let APP_GROUP = "group.jp.kotoclip.app"`
- `private let API_BASE  = "https://kotoclip.onrender.com/api"`

### 状態遷移
```
loading → preview(意味表示) → adding → success（1.4秒後自動close）
                                     → noToken（ログイン案内）
                                     → failure（エラー表示）
```

### 処理フロー
1. `extensionContext.inputItems` から `public.plain-text` を取得
2. `UserDefaults(suiteName: APP_GROUP)?["vocab_token"]` でトークン読み取り
3. `GET /api/lookup?word=<word>` → 翻訳プレビュー表示
   - URL 構築: `URLComponents + URLQueryItem`（`urlQueryAllowed` は使わない — `&` `=` が混入してクエリ破壊するため）
4. ユーザー確認 → `POST /api/words` で単語追加
5. 成功後 1.4 秒で `extensionContext.completeRequest()`

## SharedStorage Native Module

`modules/shared-storage/ios/SharedStorageModule.swift`:
```swift
public class SharedStorageModule: Module {
  private let suite = "group.jp.kotoclip.app"
  public func definition() -> ModuleDefinition {
    Name("SharedStorage")
    Function("setItem")    { (key: String, value: String) in ... }
    Function("removeItem") { (key: String) in ... }
  }
}
```

`modules/shared-storage/index.ts`:
- iOS のみ動作。Android / Expo Go では try/catch で無害にスキップ。
- `import SharedStorage from 'shared-storage'`（package.json: `"file:./modules/shared-storage"`）

## トークン共有フロー
```
ログイン / トークンリフレッシュ
  → lib/api.ts saveTokens()
  → SharedStorage.setItem('vocab_token', access)
  → UserDefaults(suite: group.jp.kotoclip.app)

ログアウト
  → clearTokens()
  → SharedStorage.removeItem('vocab_token')

Share Extension 起動時
  → UserDefaults(suite: group.jp.kotoclip.app)['vocab_token'] を読み取り
  → Authorization: Bearer <token> でAPI呼び出し
```

## Config Plugin（withShareExtension.js）

EAS Build prebuild 時に以下を自動実行:
1. `addAppGroupsEntitlement` — メインアプリの entitlements に App Group 追加
2. `copyExtensionFiles` — Swift・Info.plist・entitlements を `ios/ShareExtension/` にコピー
3. `addXcodeTarget` — ShareExtension ターゲット追加・ビルドフェーズ設定・Embed App Extensions

### Bundle ID
- メインアプリ: `jp.kotoclip.app`
- Share Extension: `jp.kotoclip.app.share`

## Apple Developer Portal での手動設定（EAS Build 前に必要）

1. Identifiers → App Groups → `+` → `group.jp.kotoclip.app` を作成
2. Identifiers → App IDs → `jp.kotoclip.app` → App Groups 機能を有効化して上記グループを紐付け
3. （EAS が自動で Provisioning Profile を再生成する）

## Info.plist（自動生成）

```xml
<key>NSExtension</key>
<dict>
  <key>NSExtensionActivationRule</key>
  <dict>
    <key>NSExtensionActivationSupportsText</key><true/>
  </dict>
  <key>NSExtensionPrincipalClass</key>
  <string>$(PRODUCT_MODULE_NAME).ShareViewController</string>
  <key>NSExtensionPointIdentifier</key>
  <string>com.apple.share-services</string>
</dict>
```
