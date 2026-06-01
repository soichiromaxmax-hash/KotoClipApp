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
# Swift 5.0 モードでは `: @MainActor Protocol` 構文が未対応 → @MainActor を除去
# （Podfile の SWIFT_STRICT_CONCURRENCY='minimal' で actor isolation は抑制済み）

patch(
    'expo-modules-core/ios/Core/Views/SwiftUI/SwiftUIHostingView.swift',
    [
        (
            'public final class HostingView<Props: ViewProps, ContentView: View<Props>>: ExpoView, @MainActor AnyExpoSwiftUIHostingView {',
            'public final class HostingView<Props: ViewProps, ContentView: View<Props>>: ExpoView, AnyExpoSwiftUIHostingView {'
        ),
    ]
)

patch(
    'expo-modules-core/ios/Core/Views/SwiftUI/SwiftUIVirtualView.swift',
    [
        (
            'extension ExpoSwiftUI.SwiftUIVirtualView: @MainActor ExpoSwiftUI.ViewWrapper {',
            'extension ExpoSwiftUI.SwiftUIVirtualView: ExpoSwiftUI.ViewWrapper {'
        ),
    ]
)

patch(
    'expo-modules-core/ios/Core/Views/ViewDefinition.swift',
    [
        (
            'extension UIView: @MainActor AnyArgument {',
            'extension UIView: AnyArgument {'
        ),
    ]
)

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

# ── expo-router Toolbar iOS 26 API patches ───────────────────────────────────
# Xcode 16.3 (iOS 18 SDK) は iOS 26 API を知らない。
# if #available(iOS 26.0, *) はランタイムガードであり、コンパイル時には型チェックが走る。
# → iOS 26 API 呼び出しを stub に置換してコンパイルエラーを除去する。

# RouterToolbarModule.swift: UIBarButtonItem.Style.prominent は iOS 26 専用
_router_module = nm / 'expo-router/ios/Toolbar/RouterToolbarModule.swift'
if _router_module.exists():
    _t = _o = _router_module.read_text()
    _t = _t.replace('return .prominent', 'return .done')
    if _t != _o:
        _router_module.write_text(_t)
        print('  patched: RouterToolbarModule.swift (.prominent → .done)')
        total += 1
    else:
        print('  WARN: RouterToolbarModule.swift - pattern not found (already patched?)')
else:
    print('  WARN: RouterToolbarModule.swift not found')

# RouterToolbarHostView.swift: hidesSharedBackground / sharesBackground は iOS 26 専用
_router_host = nm / 'expo-router/ios/Toolbar/RouterToolbarHostView.swift'
if _router_host.exists():
    _t = _o = _router_host.read_text()
    _t = _t.replace('item.hidesSharedBackground = hidesSharedBackground', '_ = hidesSharedBackground')
    _t = _t.replace('item.sharesBackground = sharesBackground', '_ = sharesBackground')
    if _t != _o:
        _router_host.write_text(_t)
        print('  patched: RouterToolbarHostView.swift (iOS 26 properties stubbed)')
        total += 1
    else:
        print('  WARN: RouterToolbarHostView.swift - patterns not found (already patched?)')
else:
    print('  WARN: RouterToolbarHostView.swift not found')

# RouterToolbarItemView.swift: 複数の iOS 26 API
_router_item = nm / 'expo-router/ios/Toolbar/RouterToolbarItemView.swift'
if _router_item.exists():
    _t = _o = _router_item.read_text()

    # Fix 1: searchBarPlacementBarButtonItem (UINavigationItem, iOS 26 専用)
    _t = _t.replace(
        'item = controller.navigationItem.searchBarPlacementBarButtonItem',
        'currentBarButtonItem = nil\n      return'
    )

    # Fix 2: hidesSharedBackground / sharesBackground (UIBarButtonItem, iOS 26 専用)
    _t = _t.replace('item.hidesSharedBackground = hidesSharedBackground', '_ = hidesSharedBackground')
    _t = _t.replace('item.sharesBackground = sharesBackground', '_ = sharesBackground')

    # Fix 3: UIBarButtonItem.Badge ブロック (iOS 26 専用) - ブレース数を数えて削除
    if 'UIBarButtonItem.Badge' in _t:
        import re as _re
        _badge_pos = _t.find('UIBarButtonItem.Badge')
        _avail_search = 'if #available(iOS 26.0, *)'
        _blk_start = _t.rfind(_avail_search, 0, _badge_pos)
        if _blk_start != -1:
            # ブロック開始行の先頭まで戻る
            _line_start = _t.rfind('\n', 0, _blk_start)
            if _line_start == -1:
                _line_start = 0
            # ブレースを数えてブロック末尾を見つける
            _depth = 0
            _end = _blk_start
            while _end < len(_t):
                if _t[_end] == '{':
                    _depth += 1
                elif _t[_end] == '}':
                    _depth -= 1
                    if _depth == 0:
                        _end += 1
                        break
                _end += 1
            _t = _t[:_line_start] + _t[_end:]
            print('  patched: RouterToolbarItemView.swift (iOS 26 Badge block removed)')
        else:
            print('  WARN: RouterToolbarItemView.swift - Badge block start not found')
    else:
        print('  INFO: RouterToolbarItemView.swift - UIBarButtonItem.Badge not found (already patched?)')

    if _t != _o:
        _router_item.write_text(_t)
        print('  patched: RouterToolbarItemView.swift (iOS 26 APIs stubbed)')
        total += 1
    else:
        print('  WARN: RouterToolbarItemView.swift - NO changes made')
else:
    print('  WARN: RouterToolbarItemView.swift not found')

print(f'\n✅ patch-expo-swift.py 完了: {total} ファイルを修正')
