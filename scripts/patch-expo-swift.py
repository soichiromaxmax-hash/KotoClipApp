#!/usr/bin/env python3
"""
EAS Build 用 Swift パッチスクリプト
npm postinstall として実行され、expo パッケージの Swift 6 非互換コードを修正する。
ci_post_clone.sh（Codemagic用）から必要な部分を移植。
"""
from pathlib import Path

root = Path(__file__).parent.parent  # KotoClipApp/
nm   = root / 'node_modules'
total = 0

def patch_file(path: Path, replacements: list[tuple[str, str]]) -> bool:
    if not path.exists():
        return False
    text = orig = path.read_text()
    for old, new in replacements:
        text = text.replace(old, new)
    if text != orig:
        path.write_text(text)
        print(f'  patched: {path.relative_to(root)}')
        return True
    return False

# ── 1. expo-modules-core ──────────────────────────────────────────────────────
emc = nm / 'expo-modules-core' / 'ios'
patched = 0
for path in emc.rglob('*.swift'):
    text = orig = path.read_text()

    text = text.replace('import UIKit', '@preconcurrency import UIKit')
    text = text.replace('import SwiftUI', '@preconcurrency import SwiftUI')

    if path.name == 'SwiftUIHostingView.swift':
        text = text.replace(
            'internal protocol AnyExpoSwiftUIHostingView {',
            '@MainActor internal protocol AnyExpoSwiftUIHostingView {'
        )
        text = text.replace(
            'public final class HostingView<Props: ViewProps, ContentView: View<Props>>: ExpoView, @MainActor AnyExpoSwiftUIHostingView {',
            '@MainActor public final class HostingView<Props: ViewProps, ContentView: View<Props>>: ExpoView, AnyExpoSwiftUIHostingView {'
        )

    if path.name == 'SwiftUIVirtualView.swift':
        text = text.replace(
            '    override func updateProps(_ rawProps: [String: Any]) {',
            '    override func updateProps(_ rawProps: [String: Any]) {\n      let rawPropsBox = NonisolatedUnsafeVar(rawProps)\n      MainActor.assumeIsolated {'
        )
        text = text.replace(
            '    override func removeFromSuperview() {',
            '    override func removeFromSuperview() {\n      MainActor.assumeIsolated {'
        )
        text = text.replace(
            '      super.removeFromSuperview()\n    }',
            '      super.removeFromSuperview()\n      }\n    }'
        )
        text = text.replace(
            '        try props.updateRawProps(rawProps, appContext: appContext)',
            '        try props.updateRawProps(rawPropsBox.value, appContext: appContext)'
        )
        text = text.replace(
            'extension ExpoSwiftUI.SwiftUIVirtualView: @MainActor ExpoSwiftUI.ViewWrapper {',
            '@MainActor extension ExpoSwiftUI.SwiftUIVirtualView: ExpoSwiftUI.ViewWrapper {'
        )

    if path.name == 'DynamicSwiftUIViewType.swift':
        text = text.replace(
            '      return view.contentView',
            '      return MainActor.assumeIsolated { view.contentView }'
        )
        text = text.replace(
            '    return view.getContentView()',
            '    return MainActor.assumeIsolated { view.getContentView() }'
        )

    if path.name == 'ExpoSwiftUI.swift':
        text = text.replace(
            '  public protocol ViewWrapper {',
            '  @MainActor public protocol ViewWrapper {'
        )

    if path.name == 'SwiftUIViewFrameObserver.swift':
        text = text.replace(
            '        callback(CGRect(origin: view.frame.origin, size: newValue.size))',
            '        let origin = MainActor.assumeIsolated { view.frame.origin }\n        callback(CGRect(origin: origin, size: newValue.size))'
        )

    if path.name == 'URLAuthenticationChallengeForwardSender.swift':
        text = text.replace(
            'internal final class URLAuthenticationChallengeForwardSender: NSObject, URLAuthenticationChallengeSender {',
            'internal final class URLAuthenticationChallengeForwardSender: NSObject, URLAuthenticationChallengeSender, @unchecked Sendable {'
        )
        text = text.replace(
            '  let completionHandler: (URLSession.AuthChallengeDisposition, URLCredential?) -> Void',
            '  let completionHandler: @Sendable (URLSession.AuthChallengeDisposition, URLCredential?) -> Void'
        )
        text = text.replace(
            '  init(completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {',
            '  init(completionHandler: @Sendable @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {'
        )

    if path.name == 'URLSessionSessionDelegateProxy.swift':
        text = text.replace(
            'public final class URLSessionSessionDelegateProxy: NSObject, URLSessionDataDelegate {',
            'public final class URLSessionSessionDelegateProxy: NSObject, URLSessionDataDelegate, @unchecked Sendable {'
        )
        for old, new in [
            ('    completionHandler: @escaping (URLSession.ResponseDisposition) -> Void',
             '    completionHandler: @Sendable @escaping (URLSession.ResponseDisposition) -> Void'),
            ('    completionHandler: @escaping (URLRequest?) -> Void',
             '    completionHandler: @Sendable @escaping (URLRequest?) -> Void'),
            ('    completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void',
             '    completionHandler: @Sendable @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void'),
        ]:
            text = text.replace(old, new)

    if path.name == 'PersistentFileLog.swift':
        text = text.replace(
            'public typealias PersistentFileLogFilter = (String) -> Bool',
            'public typealias PersistentFileLogFilter = @Sendable (String) -> Bool'
        )
        text = text.replace(
            'public typealias PersistentFileLogCompletionHandler = (Error?) -> Void',
            'public typealias PersistentFileLogCompletionHandler = @Sendable (Error?) -> Void'
        )

    if path.name == 'SharedObject.swift':
        text = text.replace(
            'open class SharedObject: AnySharedObject {',
            'open class SharedObject: AnySharedObject, @unchecked Sendable {'
        )

    if path.name == 'JSLoggerModule.swift':
        text = text.replace(
            'public final class JSLoggerModule: Module {',
            'public final class JSLoggerModule: Module, @unchecked Sendable {'
        )

    if path.name == 'EventObservingDefinition.swift':
        text = text.replace(
            'public typealias ClosureType = () -> Void',
            'public typealias ClosureType = @Sendable () -> Void'
        )

    if text != orig:
        path.write_text(text)
        patched += 1

print(f'expo-modules-core: {patched} files patched')
total += patched

# ── 2. expo-notifications ─────────────────────────────────────────────────────
cats = nm / 'expo-notifications/ios/ExpoNotifications/Notifications/Categories/CategoriesModule.swift'
if patch_file(Path(cats), [
    ('actor CategoryManager {', '@MainActor final class CategoryManager {'),
    ('open class CategoriesModule: Module {', 'open class CategoriesModule: Module, @unchecked Sendable {'),
]):
    total += 1

records = nm / 'expo-notifications/ios/ExpoNotifications/Notifications/TriggerRecords.swift'
if patch_file(Path(records), [
    ('struct CategoryActionOptionsRecord: Record {', 'struct CategoryActionOptionsRecord: Record, Sendable {'),
    ('struct CategoryTextInputActionRecord: Record {', 'struct CategoryTextInputActionRecord: Record, Sendable {'),
    ('public struct CategoryActionRecord: Record {', 'public struct CategoryActionRecord: Record, Sendable {'),
    ('public struct CategoryOptionsRecord: Record {', 'public struct CategoryOptionsRecord: Record, Sendable {'),
    ('public struct CategoryRecord: Record {', 'public struct CategoryRecord: Record, Sendable {'),
]):
    total += 1

# DateComponents 互換パッチ（iOS 26 で追加された API を除去）
date_ser = nm / 'expo-notifications/ios/ExpoNotifications/Notifications/DateComponentsSerializer.swift'
if patch_file(Path(date_ser), [
    ('    if #available(iOS 26.0, *) {\n      serializedComponents["isRepeatedDay"] = dateComponents.isRepeatedDay ?? false\n    }\n\n', ''),
]):
    total += 1

# ── 3. expo-web-browser ───────────────────────────────────────────────────────
wb = nm / 'expo-web-browser/ios/WebBrowserModule.swift'
if patch_file(Path(wb), [
    ('final public class WebBrowserModule: Module {', 'final public class WebBrowserModule: Module, @unchecked Sendable {'),
]):
    total += 1

wb_sess = nm / 'expo-web-browser/ios/WebBrowserSession.swift'
if patch_file(Path(wb_sess), [
    ('internal class WebBrowserSession: NSObject, SFSafariViewControllerDelegate, UIAdaptivePresentationControllerDelegate {',
     '@MainActor internal class WebBrowserSession: NSObject, SFSafariViewControllerDelegate, UIAdaptivePresentationControllerDelegate {'),
    ('  func safariViewControllerDidFinish(_ controller: SFSafariViewController) {\n    finish(type: "cancel")\n  }',
     '  nonisolated func safariViewControllerDidFinish(_ controller: SFSafariViewController) {\n    MainActor.assumeIsolated { finish(type: "cancel") }\n  }'),
    ('  func presentationControllerDidDismiss(_ presentationController: UIPresentationController) {\n    finish(type: "cancel")\n  }',
     '  nonisolated func presentationControllerDidDismiss(_ presentationController: UIPresentationController) {\n    MainActor.assumeIsolated { finish(type: "cancel") }\n  }'),
]):
    total += 1

# ── 4. expo-splash-screen ─────────────────────────────────────────────────────
splash = nm / 'expo-splash-screen/ios/SplashScreenManager.swift'
if patch_file(Path(splash), [
    ('class SplashScreenManager: NSObject, RCTReloadListener {',
     '@MainActor class SplashScreenManager: NSObject, @preconcurrency RCTReloadListener {'),
    ('@objc static let shared = SplashScreenManager()',
     '@MainActor @objc static let shared = SplashScreenManager()'),
    ('  func didReceiveReloadCommand() {\n    showSplashScreen()\n  }',
     '  nonisolated func didReceiveReloadCommand() {\n    MainActor.assumeIsolated { showSplashScreen() }\n  }'),
]):
    total += 1

print(f'\nTotal patched: {total} files')
