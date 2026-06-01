#!/usr/bin/env python3
"""
EAS Build 用 Swift パッチスクリプト（シンプル版）
npm postinstall として実行される。

方針:
- Podfile の SWIFT_STRICT_CONCURRENCY='minimal' + GCC_TREAT_WARNINGS_AS_ERRORS='NO'
  が actor isolation エラーを警告化・抑制する
- このスクリプトは Podfile 設定だけでは消えない Sendable 系エラーのみ修正する
  （Sendable 宣言と non-Sendable 型の矛盾 → 明示的なコンパイルエラーになるため）
"""
from pathlib import Path

root = Path(__file__).parent.parent  # KotoClipApp/
nm   = root / 'node_modules'
total = 0

def patch(path_str: str, replacements: list) -> bool:
    global total
    p = nm / path_str
    if not p.exists():
        return False
    text = orig = p.read_text()
    for old, new in replacements:
        text = text.replace(old, new)
    if text != orig:
        p.write_text(text)
        print(f'  patched: {path_str}')
        total += 1
        return True
    return False

# ── expo-modules-core ─────────────────────────────────────────────────────────

# URLAuthenticationChallengeForwardSender:
# Sendable 宣言クラスに non-Sendable な completionHandler プロパティ → エラー
patch(
    'expo-modules-core/ios/DevTools/URLAuthenticationChallengeForwardSender.swift',
    [
        (
            'internal final class URLAuthenticationChallengeForwardSender: NSObject, URLAuthenticationChallengeSender {',
            'internal final class URLAuthenticationChallengeForwardSender: NSObject, URLAuthenticationChallengeSender, @unchecked Sendable {'
        ),
        (
            '  let completionHandler: (URLSession.AuthChallengeDisposition, URLCredential?) -> Void',
            '  let completionHandler: @Sendable (URLSession.AuthChallengeDisposition, URLCredential?) -> Void'
        ),
        (
            '  init(completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {',
            '  init(completionHandler: @Sendable @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {'
        ),
    ]
)

# URLSessionSessionDelegateProxy:
# Sendable 宣言クラスに可変の delegateMap プロパティ → エラー
patch(
    'expo-modules-core/ios/DevTools/URLSessionSessionDelegateProxy.swift',
    [
        (
            'public final class URLSessionSessionDelegateProxy: NSObject, URLSessionDataDelegate {',
            'public final class URLSessionSessionDelegateProxy: NSObject, URLSessionDataDelegate, @unchecked Sendable {'
        ),
        (
            '    completionHandler: @escaping (URLSession.ResponseDisposition) -> Void',
            '    completionHandler: @Sendable @escaping (URLSession.ResponseDisposition) -> Void'
        ),
        (
            '    completionHandler: @escaping (URLRequest?) -> Void',
            '    completionHandler: @Sendable @escaping (URLRequest?) -> Void'
        ),
        (
            '    completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void',
            '    completionHandler: @Sendable @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void'
        ),
    ]
)

# PersistentFileLog:
# non-Sendable なクロージャ型を @Sendable に
patch(
    'expo-modules-core/ios/Core/Logging/PersistentFileLog.swift',
    [
        (
            'public typealias PersistentFileLogFilter = (String) -> Bool',
            'public typealias PersistentFileLogFilter = @Sendable (String) -> Bool'
        ),
        (
            'public typealias PersistentFileLogCompletionHandler = (Error?) -> Void',
            'public typealias PersistentFileLogCompletionHandler = @Sendable (Error?) -> Void'
        ),
    ]
)

# ExpoRequestInterceptorProtocol:
# non-Sendable なクロージャ型の引数
patch(
    'expo-modules-core/ios/DevTools/ExpoRequestInterceptorProtocol.swift',
    [
        (
            '    completionHandler: @escaping (URLSession.ResponseDisposition) -> Void',
            '    completionHandler: @Sendable @escaping (URLSession.ResponseDisposition) -> Void'
        ),
        (
            '    completionHandler: @escaping (URLRequest?) -> Void',
            '    completionHandler: @Sendable @escaping (URLRequest?) -> Void'
        ),
        (
            '    completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void',
            '    completionHandler: @Sendable @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void'
        ),
    ]
)

# ── expo-notifications ────────────────────────────────────────────────────────

# CategoriesModule: @unchecked Sendable のみ（actor isolation は Podfile の Swift 5.0 + minimal で抑制）
# actor CategoryManager の変換は Swift 5.0 モードで @MainActor が unknown になるため行わない
patch(
    'expo-notifications/ios/ExpoNotifications/Notifications/Categories/CategoriesModule.swift',
    [
        (
            'open class CategoriesModule: Module {',
            'open class CategoriesModule: Module, @unchecked Sendable {'
        ),
    ]
)

# TriggerRecords: Record 型を Sendable に
patch(
    'expo-notifications/ios/ExpoNotifications/Notifications/TriggerRecords.swift',
    [
        ('struct CategoryActionOptionsRecord: Record {',  'struct CategoryActionOptionsRecord: Record, Sendable {'),
        ('struct CategoryTextInputActionRecord: Record {', 'struct CategoryTextInputActionRecord: Record, Sendable {'),
        ('public struct CategoryActionRecord: Record {',   'public struct CategoryActionRecord: Record, Sendable {'),
        ('public struct CategoryOptionsRecord: Record {',  'public struct CategoryOptionsRecord: Record, Sendable {'),
        ('public struct CategoryRecord: Record {',         'public struct CategoryRecord: Record, Sendable {'),
    ]
)

# iOS 26 で追加された isRepeatedDay API を除去（Xcode 16.3 では未定義）
patch(
    'expo-notifications/ios/ExpoNotifications/Notifications/DateComponentsSerializer.swift',
    [
        (
            '    if #available(iOS 26.0, *) {\n      serializedComponents["isRepeatedDay"] = dateComponents.isRepeatedDay ?? false\n    }\n\n',
            ''
        ),
    ]
)

# ── expo-web-browser ──────────────────────────────────────────────────────────

patch(
    'expo-web-browser/ios/WebBrowserModule.swift',
    [
        (
            'final public class WebBrowserModule: Module {',
            'final public class WebBrowserModule: Module, @unchecked Sendable {'
        ),
    ]
)

print(f'\n✅ patch-expo-swift.py 完了: {total} ファイルを修正')
