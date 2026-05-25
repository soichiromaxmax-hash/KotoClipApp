#!/bin/sh
# Xcode Cloud: ci_post_clone.sh
# Runs after git clone. Installs deps, patches node_modules, runs pod install.
set -eo pipefail

cd "$CI_WORKSPACE"
echo "=== KotoClip ci_post_clone: $CI_WORKSPACE ==="

# ── Node.js ──────────────────────────────────────────────────────────────────
if ! command -v node >/dev/null 2>&1; then
    echo "[node] Installing via Homebrew..."
    brew install node
fi
echo "[node] $(node --version) / npm $(npm --version)"

export RNS_GAMMA_ENABLED=0

# ── npm install ───────────────────────────────────────────────────────────────
npm install

# ── 1. Patch expo-modules-core ────────────────────────────────────────────────
python3 << 'PYEOF'
from pathlib import Path

root = Path('node_modules/expo-modules-core/ios')
patched = 0

for path in root.rglob('*.swift'):
    text = path.read_text()
    original = text
    text = text.replace('import UIKit', '@preconcurrency import UIKit')
    text = text.replace('import SwiftUI', '@preconcurrency import SwiftUI')
    if path.name == 'ExpoReactDelegate.swift':
        text = text.replace(
            'public class ExpoReactDelegate: NSObject {',
            '@MainActor public class ExpoReactDelegate: NSObject {'
        )
        text = text.replace(
            '.first(where: { _ in true }) ?? UIViewController()',
            '.first(where: { _ in true }) ?? MainActor.assumeIsolated { UIViewController() }'
        )
    if path.name == 'ViewDefinition.swift':
        text = text.replace(
            'extension UIView: @MainActor AnyArgument {',
            '@MainActor extension UIView: AnyArgument {'
        )
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
            '    override func mountChildComponentView(_ childComponentView: UIView, index: Int) {',
            '    override func mountChildComponentView(_ childComponentView: UIView, index: Int) {\n      MainActor.assumeIsolated {'
        )
        text = text.replace(
            '    override func unmountChildComponentView(_ childComponentView: UIView, index: Int) {',
            '    override func unmountChildComponentView(_ childComponentView: UIView, index: Int) {\n      MainActor.assumeIsolated {'
        )
        text = text.replace(
            '    override func removeFromSuperview() {',
            '    override func removeFromSuperview() {\n      MainActor.assumeIsolated {'
        )
        text = text.replace(
            'extension ExpoSwiftUI.SwiftUIVirtualView: @MainActor ExpoSwiftUI.ViewWrapper {',
            '@MainActor extension ExpoSwiftUI.SwiftUIVirtualView: ExpoSwiftUI.ViewWrapper {'
        )
        text = text.replace(
            '  func getWrappedView() -> Any {',
            '  @MainActor func getWrappedView() -> Any {'
        )
        text = text.replace(
            '      } catch let error {\n        log.error("Updating props for \\(self) has failed: \\(error.localizedDescription)")\n      }\n    }',
            '      } catch let error {\n        log.error("Updating props for \\(self) has failed: \\(error.localizedDescription)")\n      }\n      }\n    }'
        )
        text = text.replace(
            '      props.children = children\n      props.objectWillChange.send()\n    }',
            '      props.children = children\n      props.objectWillChange.send()\n      }\n    }'
        )
        text = text.replace(
            '        props.objectWillChange.send()\n      }\n    }',
            '        props.objectWillChange.send()\n      }\n      }\n    }'
        )
        text = text.replace(
            '      super.removeFromSuperview()\n    }',
            '      super.removeFromSuperview()\n      }\n    }'
        )
        text = text.replace(
            '        try props.updateRawProps(rawProps, appContext: appContext)',
            '        try props.updateRawProps(rawPropsBox.value, appContext: appContext)'
        )
    if path.name == 'DynamicSwiftUIViewType.swift':
        text = text.replace(
            '      return view.contentView',
            '      return MainActor.assumeIsolated { view.contentView }'
        )
        text = text.replace(
            '    if let provider = appContext.findView(withTag: viewTag, ofType: ExpoSwiftUI.ViewWrapper.self),\n       let innerView = provider.getWrappedView() as? ViewType {\n      return innerView\n    }',
            '    if let provider = appContext.findView(withTag: viewTag, ofType: ExpoSwiftUI.ViewWrapper.self) {\n      if let innerView: ViewType = MainActor.assumeIsolated({ provider.getWrappedView() as? ViewType }) {\n        return innerView\n      }\n    }'
        )
        text = text.replace(
            '    return view.getContentView()',
            '    return MainActor.assumeIsolated { view.getContentView() }'
        )
    if path.name == 'DynamicRawType.swift':
        text = text.replace(
            '    if let objectBuilder = result as? JavaScriptObjectBuilder {',
            '    if let objectBuilder = result as? JavaScriptObjectBuilder {\n      let objectBuilderBox = NonisolatedUnsafeVar(objectBuilder)'
        )
        text = text.replace(
            '        return try objectBuilder.build(appContext: appContext)',
            '        return try objectBuilderBox.value.build(appContext: appContext)'
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
    if path.name == 'JSLoggerModule.swift':
        text = text.replace(
            'public final class JSLoggerModule: Module {',
            'public final class JSLoggerModule: Module, @unchecked Sendable {'
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
    if path.name == 'PersistentFileLog.swift':
        text = text.replace(
            'public typealias PersistentFileLogFilter = (String) -> Bool',
            'public typealias PersistentFileLogFilter = @Sendable (String) -> Bool'
        )
        text = text.replace(
            'public typealias PersistentFileLogCompletionHandler = (Error?) -> Void',
            'public typealias PersistentFileLogCompletionHandler = @Sendable (Error?) -> Void'
        )
    if path.name == 'LoggerTimer.swift':
        text = text.replace(
            'typealias LoggerTimerStopBlock = () -> Double',
            'typealias LoggerTimerStopBlock = @Sendable () -> Double'
        )
    if path.name == 'Logger.swift':
        text = text.replace(
            'public typealias LoggerTimerFormatterBlock = (_ duration: Double) -> String',
            'public typealias LoggerTimerFormatterBlock = @Sendable (_ duration: Double) -> String'
        )
    if path.name == 'EventObservingDefinition.swift':
        text = text.replace(
            'public typealias ClosureType = () -> Void',
            'public typealias ClosureType = @Sendable () -> Void'
        )
        text = text.replace(
            'init(type: EventObservingType, event: String?, _ closure: @Sendable @escaping ClosureType) {',
            'init(type: EventObservingType, event: String?, _ closure: @escaping ClosureType) {'
        )
    if path.name == 'ConcurrentFunctionDefinition.swift':
        text = text.replace(
            'typealias ClosureType = (Args) async throws -> ReturnType',
            'typealias ClosureType = @Sendable (Args) async throws -> ReturnType'
        )
    if path.name == 'SharedObject.swift':
        text = text.replace(
            'open class SharedObject: AnySharedObject {',
            'open class SharedObject: AnySharedObject, @unchecked Sendable {'
        )
        text = text.replace(
            '    runtime.schedule { [weak self, weak appContext] in',
            '    let selfBox = NonisolatedUnsafeVar(self as SharedObject?)\n    let argumentPairsBox = NonisolatedUnsafeVar(argumentPairs)\n    runtime.schedule { [weak appContext] in'
        )
        text = text.replace(
            '      guard let appContext, let runtime = try? appContext.runtime, let jsObject = self?.getJavaScriptObject() else {',
            '      guard let appContext, let runtime = try? appContext.runtime, let jsObject = selfBox.value?.getJavaScriptObject() else {'
        )
        text = text.replace(
            '      let arguments = argumentPairs.map { argument, dynamicType in',
            '      let arguments = argumentPairsBox.value.map { argument, dynamicType in'
        )
    if path.name == 'ConcurrentFunctionFactories.swift':
        text = text.replace(
            '@_implicitSelfCapture _ closure: @escaping () async throws -> R',
            '@_implicitSelfCapture _ closure: @Sendable @escaping () async throws -> R'
        )
        text = text.replace(
            '@_implicitSelfCapture _ closure: @escaping (A0, repeat each A) async throws -> R',
            '@_implicitSelfCapture _ closure: @Sendable @escaping (A0, repeat each A) async throws -> R'
        )
    if path.name == 'ObjectFactories.swift':
        text = text.replace(
            'public func OnStartObserving(_ event: String? = nil, @_implicitSelfCapture _ closure: @escaping () -> Void) -> EventObservingDefinition {',
            'public func OnStartObserving(_ event: String? = nil, @_implicitSelfCapture _ closure: @Sendable @escaping () -> Void) -> EventObservingDefinition {'
        )
        text = text.replace(
            'public func OnStopObserving(_ event: String? = nil, @_implicitSelfCapture _ closure: @escaping () -> Void) -> EventObservingDefinition {',
            'public func OnStopObserving(_ event: String? = nil, @_implicitSelfCapture _ closure: @Sendable @escaping () -> Void) -> EventObservingDefinition {'
        )
    if path.name == 'ExpoRequestInterceptorProtocol.swift':
        text = text.replace(
            '    completionHandler: @escaping (URLSession.ResponseDisposition) -> Void',
            '    completionHandler: @Sendable @escaping (URLSession.ResponseDisposition) -> Void'
        )
        text = text.replace(
            '    completionHandler: @escaping (URLRequest?) -> Void',
            '    completionHandler: @Sendable @escaping (URLRequest?) -> Void'
        )
        text = text.replace(
            '    completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void',
            '    completionHandler: @Sendable @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void'
        )
    if path.name == 'URLSessionSessionDelegateProxy.swift':
        text = text.replace(
            '    completionHandler: @escaping (URLSession.ResponseDisposition) -> Void',
            '    completionHandler: @Sendable @escaping (URLSession.ResponseDisposition) -> Void'
        )
        text = text.replace(
            '    completionHandler: @escaping (URLRequest?) -> Void',
            '    completionHandler: @Sendable @escaping (URLRequest?) -> Void'
        )
        text = text.replace(
            '    completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void',
            '    completionHandler: @Sendable @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void'
        )
    if text != original:
        path.write_text(text)
        patched += 1

print('expo-modules-core patched files:', patched)
PYEOF

# ── 2. Patch extra Expo iOS modules ──────────────────────────────────────────
python3 << 'PYEOF'
import re
from pathlib import Path

patched = 0

def patch(p, old, new):
    global patched
    if not p.exists(): return
    t = p.read_text()
    n = t.replace(old, new)
    if n != t:
        p.write_text(n)
        patched += 1

system_ui = Path('node_modules/expo-system-ui/ios/ExpoSystemUI/ExpoSystemUIModule.swift')
if system_ui.exists():
    t = system_ui.read_text(); o = t
    t = t.replace(
        '    EXUtilities.performSynchronously {\n      // Get the root view controller of the delegate window.\n      if let window = UIApplication.shared.delegate?.window, let backgroundColor = window?.rootViewController?.view.backgroundColor?.cgColor {\n        color = EXUtilities.hexString(with: backgroundColor)\n      }\n    }',
        '    EXUtilities.performSynchronously {\n      MainActor.assumeIsolated {\n        // Get the root view controller of the delegate window.\n        if let window = UIApplication.shared.delegate?.window, let backgroundColor = window?.rootViewController?.view.backgroundColor?.cgColor {\n          color = EXUtilities.hexString(with: backgroundColor)\n        }\n      }\n    }'
    )
    t = t.replace(
        '    EXUtilities.performSynchronously {\n      if color == nil {\n        if let window = UIApplication.shared.delegate?.window {\n          // Uses required reason API based on the following reason: CA92.1\n          UserDefaults.standard.removeObject(forKey: colorKey)\n          let interfaceStyle = window?.traitCollection.userInterfaceStyle\n          window?.backgroundColor = nil\n\n          switch interfaceStyle {\n          case .dark:\n            window?.rootViewController?.view.backgroundColor = .black\n          case .light:\n            window?.rootViewController?.view.backgroundColor = .white\n          default:\n            window?.rootViewController?.view.backgroundColor = .white\n          }\n        }\n        return\n      }\n      UserDefaults.standard.set(color, forKey: colorKey)\n      let backgroundColor = EXUtilities.uiColor(color)\n      // Set the app-wide window, this could have future issues when running multiple React apps,\n      // i.e. dev client can\'t use expo-system-ui.\n      // Without setting the window backgroundColor, native-stack modals will show the wrong color.\n      if let window = UIApplication.shared.delegate?.window {\n        window?.backgroundColor = backgroundColor\n        window?.rootViewController?.view.backgroundColor = backgroundColor\n      }\n    }',
        '    EXUtilities.performSynchronously {\n      MainActor.assumeIsolated {\n        if color == nil {\n          if let window = UIApplication.shared.delegate?.window {\n            // Uses required reason API based on the following reason: CA92.1\n            UserDefaults.standard.removeObject(forKey: colorKey)\n            let interfaceStyle = window?.traitCollection.userInterfaceStyle\n            window?.backgroundColor = nil\n\n            switch interfaceStyle {\n            case .dark:\n              window?.rootViewController?.view.backgroundColor = .black\n            case .light:\n              window?.rootViewController?.view.backgroundColor = .white\n            default:\n              window?.rootViewController?.view.backgroundColor = .white\n            }\n          }\n          return\n        }\n        UserDefaults.standard.set(color, forKey: colorKey)\n        let backgroundColor = EXUtilities.uiColor(color)\n        // Set the app-wide window, this could have future issues when running multiple React apps,\n        // i.e. dev client can\'t use expo-system-ui.\n        // Without setting the window backgroundColor, native-stack modals will show the wrong color.\n        if let window = UIApplication.shared.delegate?.window {\n          window?.backgroundColor = backgroundColor\n          window?.rootViewController?.view.backgroundColor = backgroundColor\n        }\n      }\n    }'
    )
    if t != o: system_ui.write_text(t); patched += 1

splash = Path('node_modules/expo-splash-screen/ios/SplashScreenManager.swift')
if splash.exists():
    t = splash.read_text(); o = t
    t = t.replace('class SplashScreenManager: NSObject, RCTReloadListener {', '@MainActor class SplashScreenManager: NSObject, @preconcurrency RCTReloadListener {')
    t = t.replace('@objc static let shared = SplashScreenManager()', '@MainActor @objc static let shared = SplashScreenManager()')
    t = t.replace('  func didReceiveReloadCommand() {\n    showSplashScreen()\n  }', '  nonisolated func didReceiveReloadCommand() {\n    MainActor.assumeIsolated {\n      showSplashScreen()\n    }\n  }')
    t = t.replace('  private func isLoadingViewVisible() -> Bool {', '  nonisolated private func isLoadingViewVisible() -> Bool {')
    t = t.replace('    guard let loadingView else {\n      return false\n    }\n\n    return !loadingView.isHidden', '    MainActor.assumeIsolated {\n      guard let loadingView else {\n        return false\n      }\n\n      return !loadingView.isHidden\n    }')
    if t != o: splash.write_text(t); patched += 1

splash_mod = Path('node_modules/expo-splash-screen/ios/SplashScreenModule.swift')
if splash_mod.exists():
    t = splash_mod.read_text(); o = t
    t = t.replace('      SplashScreenManager.shared.setOptions(options: options)', '      MainActor.assumeIsolated {\n        SplashScreenManager.shared.setOptions(options: options)\n      }')
    t = t.replace('      SplashScreenManager.shared.hide()', '      MainActor.assumeIsolated {\n        SplashScreenManager.shared.hide()\n      }')
    t = t.replace('        SplashScreenManager.shared.hide()', '        MainActor.assumeIsolated {\n          SplashScreenManager.shared.hide()\n        }')
    t = t.replace('      SplashScreenManager.shared.preventAutoHideCalled = true', '      MainActor.assumeIsolated {\n        SplashScreenManager.shared.preventAutoHideCalled = true\n      }')
    t = t.replace('      SplashScreenManager.shared.removeObservers()', '      MainActor.assumeIsolated {\n        SplashScreenManager.shared.removeObservers()\n      }')
    if t != o: splash_mod.write_text(t); patched += 1

patch(Path('node_modules/expo-symbols/ios/SymbolEffects.swift'), 'internal protocol EffectAdding {', '@MainActor internal protocol EffectAdding {')
patch(Path('node_modules/expo-sharing/ios/SharingModule.swift'), 'public final class SharingModule: Module {', 'public final class SharingModule: Module, @unchecked Sendable {')

sharing = Path('node_modules/expo-sharing/ios/SharingModule.swift')
if sharing.exists():
    t = sharing.read_text(); o = t
    t = t.replace(
        '      let activityController = UIActivityViewController(activityItems: [url], applicationActivities: nil)\n      activityController.title = options.dialogTitle\n\n      activityController.completionWithItemsHandler = { type, completed, _, _ in\n        // user shared an item\n        if type != nil && completed {\n          promise.resolve(nil)\n        }\n\n        // dismissed without action\n        if type == nil && !completed {\n          promise.resolve(nil)\n        }\n      }\n\n      guard let currentViewcontroller = appContext?.utilities?.currentViewController() else {\n        throw MissingCurrentViewControllerException()\n      }\n\n      // Apple docs state that `UIActivityViewController` must be presented in a\n      // popover on iPad https://developer.apple.com/documentation/uikit/uiactivityviewcontroller\n      if UIDevice.current.userInterfaceIdiom == .pad {\n        let rect = options.anchor\n        let viewFrame = currentViewcontroller.view.frame\n\n        activityController.popoverPresentationController?.sourceRect = CGRect(\n          x: rect?.x ?? viewFrame.midX,\n          y: rect?.y ?? viewFrame.maxY,\n          width: rect?.width ?? 0,\n          height: rect?.height ?? 0\n        )\n        activityController.popoverPresentationController?.sourceView = currentViewcontroller.view\n        activityController.modalPresentationStyle = .pageSheet\n      }\n\n      currentViewcontroller.present(activityController, animated: true)',
        '      try MainActor.assumeIsolated {\n        let activityController = UIActivityViewController(activityItems: [url], applicationActivities: nil)\n        activityController.title = options.dialogTitle\n\n        activityController.completionWithItemsHandler = { type, completed, _, _ in\n          // user shared an item\n          if type != nil && completed {\n            promise.resolve(nil)\n          }\n\n          // dismissed without action\n          if type == nil && !completed {\n            promise.resolve(nil)\n          }\n        }\n\n        guard let currentViewcontroller = appContext?.utilities?.currentViewController() else {\n          throw MissingCurrentViewControllerException()\n        }\n\n        // Apple docs state that `UIActivityViewController` must be presented in a\n        // popover on iPad https://developer.apple.com/documentation/uikit/uiactivityviewcontroller\n        if UIDevice.current.userInterfaceIdiom == .pad {\n          let rect = options.anchor\n          let viewFrame = currentViewcontroller.view.frame\n\n          activityController.popoverPresentationController?.sourceRect = CGRect(\n            x: rect?.x ?? viewFrame.midX,\n            y: rect?.y ?? viewFrame.maxY,\n            width: rect?.width ?? 0,\n            height: rect?.height ?? 0\n          )\n          activityController.popoverPresentationController?.sourceView = currentViewcontroller.view\n          activityController.modalPresentationStyle = .pageSheet\n        }\n\n        currentViewcontroller.present(activityController, animated: true)\n      }'
    )
    t = t.replace(
        '      return try await withThrowingTaskGroup(of: (Int, ExpoResolvedSharePayload).self) { [weak self] group in\n        guard let self else {\n          return []\n        }\n',
        '      return try await withThrowingTaskGroup(of: (Int, ExpoResolvedSharePayload).self) { group in\n'
    )
    if t != o: sharing.write_text(t); patched += 1

wb_mod = Path('node_modules/expo-web-browser/ios/WebBrowserModule.swift')
if wb_mod.exists():
    t = wb_mod.read_text(); o = t
    t = t.replace('final public class WebBrowserModule: Module {', 'final public class WebBrowserModule: Module, @unchecked Sendable {')
    t = t.replace(
        '      self.currentWebBrowserSession = WebBrowserSession(url: url, options: options) { [promise] type in\n        promise.resolve(["type": type])\n        self.currentWebBrowserSession = nil\n      } didPresent: {\n        self.vcDidPresent = true\n      }\n\n      self.currentWebBrowserSession?.open()',
        '      MainActor.assumeIsolated {\n        self.currentWebBrowserSession = WebBrowserSession(url: url, options: options) { [promise] type in\n          promise.resolve(["type": type])\n          self.currentWebBrowserSession = nil\n        } didPresent: {\n          self.vcDidPresent = true\n        }\n\n        self.currentWebBrowserSession?.open()\n      }'
    )
    t = t.replace(
        '      currentWebBrowserSession?.dismiss { type in\n        self.currentWebBrowserSession = nil\n        promise.resolve(["type": type])\n      }',
        '      MainActor.assumeIsolated {\n        currentWebBrowserSession?.dismiss { type in\n          self.currentWebBrowserSession = nil\n          promise.resolve(["type": type])\n        }\n      }'
    )
    t = t.replace(
        '      self.currentAuthSession = WebAuthSession(authUrl: authUrl, redirectUrl: redirectUrl, options: options)\n      self.currentAuthSession?.open(promise)',
        '      MainActor.assumeIsolated {\n        self.currentAuthSession = WebAuthSession(authUrl: authUrl, redirectUrl: redirectUrl, options: options)\n        self.currentAuthSession?.open(promise)\n      }'
    )
    t = t.replace(
        '      guard self.currentAuthSession?.isOpen != true else {\n        throw WebBrowserAlreadyOpenException()\n      }\n      MainActor.assumeIsolated {\n        self.currentAuthSession = WebAuthSession(authUrl: authUrl, redirectUrl: redirectUrl, options: options)\n        self.currentAuthSession?.open(promise)\n      }',
        '      try MainActor.assumeIsolated {\n        guard self.currentAuthSession?.isOpen != true else {\n          throw WebBrowserAlreadyOpenException()\n        }\n        self.currentAuthSession = WebAuthSession(authUrl: authUrl, redirectUrl: redirectUrl, options: options)\n        self.currentAuthSession?.open(promise)\n      }'
    )
    t = t.replace(
        '      self.currentAuthSession?.dismiss()\n      self.currentAuthSession = nil',
        '      MainActor.assumeIsolated {\n        self.currentAuthSession?.dismiss()\n        self.currentAuthSession = nil\n      }'
    )
    if t != o: wb_mod.write_text(t); patched += 1

wb_sess = Path('node_modules/expo-web-browser/ios/WebBrowserSession.swift')
if wb_sess.exists():
    t = wb_sess.read_text(); o = t
    t = t.replace('internal class WebBrowserSession: NSObject, SFSafariViewControllerDelegate, UIAdaptivePresentationControllerDelegate {', '@MainActor internal class WebBrowserSession: NSObject, SFSafariViewControllerDelegate, UIAdaptivePresentationControllerDelegate {')
    t = t.replace('  func safariViewControllerDidFinish(_ controller: SFSafariViewController) {\n    finish(type: "cancel")\n  }', '  nonisolated func safariViewControllerDidFinish(_ controller: SFSafariViewController) {\n    MainActor.assumeIsolated {\n      finish(type: "cancel")\n    }\n  }')
    t = t.replace('  func presentationControllerDidDismiss(_ presentationController: UIPresentationController) {\n    finish(type: "cancel")\n  }', '  nonisolated func presentationControllerDidDismiss(_ presentationController: UIPresentationController) {\n    MainActor.assumeIsolated {\n      finish(type: "cancel")\n    }\n  }')
    if t != o: wb_sess.write_text(t); patched += 1

notif_badge = Path('node_modules/expo-notifications/ios/ExpoNotifications/Badge/BadgeModule.swift')
if notif_badge.exists():
    t = notif_badge.read_text(); o = t
    t = t.replace('      return RCTSharedApplication()?.applicationIconBadgeNumber ?? 0', '      return MainActor.assumeIsolated {\n        RCTSharedApplication()?.applicationIconBadgeNumber ?? 0\n      }')
    if t != o: notif_badge.write_text(t); patched += 1

notif_records = Path('node_modules/expo-notifications/ios/ExpoNotifications/Notifications/TriggerRecords.swift')
if notif_records.exists():
    t = notif_records.read_text(); o = t
    for old, new in [
        ('struct CategoryActionOptionsRecord: Record {', 'struct CategoryActionOptionsRecord: Record, Sendable {'),
        ('struct CategoryTextInputActionRecord: Record {', 'struct CategoryTextInputActionRecord: Record, Sendable {'),
        ('public struct CategoryActionRecord: Record {', 'public struct CategoryActionRecord: Record, Sendable {'),
        ('public struct CategoryOptionsRecord: Record {', 'public struct CategoryOptionsRecord: Record, Sendable {'),
        ('public struct CategoryRecord: Record {', 'public struct CategoryRecord: Record, Sendable {'),
    ]:
        t = t.replace(old, new)
    if t != o: notif_records.write_text(t); patched += 1

notif_cats = Path('node_modules/expo-notifications/ios/ExpoNotifications/Notifications/Categories/CategoriesModule.swift')
if notif_cats.exists():
    t = notif_cats.read_text(); o = t
    t = t.replace('import UIKit\n', 'import UIKit\n\nextension UNNotificationCategory: @unchecked Sendable {}\n')
    t = t.replace('actor CategoryManager {', '@MainActor final class CategoryManager {')
    t = t.replace('open class CategoriesModule: Module {', 'open class CategoriesModule: Module, @unchecked Sendable {')
    t = t.replace(
        '      let categories = await UNUserNotificationCenter.current().notificationCategories()\n      return filterAndSerializeCategories(categories)',
        '      return await withCheckedContinuation { continuation in\n        UNUserNotificationCenter.current().getNotificationCategories { categories in\n          continuation.resume(returning: categories.map { CategoryRecord($0) })\n        }\n      }'
    )
    if t != o: notif_cats.write_text(t); patched += 1

notif_date = Path('node_modules/expo-notifications/ios/ExpoNotifications/Notifications/DateComponentsSerializer.swift')
if notif_date.exists():
    t = notif_date.read_text(); o = t
    t = t.replace('    if #available(iOS 26.0, *) {\n      serializedComponents["isRepeatedDay"] = dateComponents.isRepeatedDay ?? false\n    }\n\n', '')
    if t != o: notif_date.write_text(t); patched += 1

for path_str, old, new in [
    ('node_modules/expo-notifications/ios/ExpoNotifications/Notifications/Handler/HandlerModule.swift',
     'open class HandlerModule: Module, NotificationDelegate, SingleNotificationHandlerTaskDelegate {',
     'open class HandlerModule: Module, NotificationDelegate, SingleNotificationHandlerTaskDelegate, @unchecked Sendable {'),
    ('node_modules/expo-notifications/ios/ExpoNotifications/Notifications/Scheduling/SchedulerModule.swift',
     'open class SchedulerModule: Module {', 'open class SchedulerModule: Module, @unchecked Sendable {'),
    ('node_modules/expo-notifications/ios/ExpoNotifications/Notifications/Presenting/PresentationModule.swift',
     'open class PresentationModule: Module {', 'open class PresentationModule: Module, @unchecked Sendable {'),
    ('node_modules/expo-notifications/ios/ExpoNotifications/Permissions/ExpoNotificationsPermissionsRequester.swift',
     'public class ExpoNotificationsPermissionsRequester: NSObject, EXPermissionsRequester {',
     'public class ExpoNotificationsPermissionsRequester: NSObject, EXPermissionsRequester, @unchecked Sendable {'),
]:
    patch(Path(path_str), old, new)

notif_center = Path('node_modules/expo-notifications/ios/ExpoNotifications/Notifications/NotificationCenterManager.swift')
if notif_center.exists():
    t = notif_center.read_text(); o = t
    t = t.replace('public class NotificationCenterManager: NSObject,', 'public class NotificationCenterManager: NSObject, @unchecked Sendable,')
    t = t.replace('  public static let shared = NotificationCenterManager()', '  public nonisolated(unsafe) static let shared = NotificationCenterManager()')
    if t != o: notif_center.write_text(t); patched += 1

notif_push = Path('node_modules/expo-notifications/ios/ExpoNotifications/PushToken/PushTokenModule.swift')
if notif_push.exists():
    t = notif_push.read_text(); o = t
    t = t.replace('public class PushTokenModule: Module, NotificationDelegate {', 'public class PushTokenModule: Module, NotificationDelegate, @unchecked Sendable {')
    t = t.replace('      UIApplication.shared.registerForRemoteNotifications()', '      MainActor.assumeIsolated {\n        UIApplication.shared.registerForRemoteNotifications()\n      }')
    t = t.replace('      UIApplication.shared.unregisterForRemoteNotifications()', '      MainActor.assumeIsolated {\n        UIApplication.shared.unregisterForRemoteNotifications()\n      }')
    if t != o: notif_push.write_text(t); patched += 1

for path_str, old, new in [
    ('node_modules/expo-linking/ios/ExpoLinkingModule.swift', 'public class ExpoLinkingModule: Module {', 'public class ExpoLinkingModule: Module, @unchecked Sendable {'),
    ('node_modules/expo-symbols/ios/SymbolView.swift', 'class SymbolView: ExpoView {', '@MainActor class SymbolView: ExpoView {'),
    ('node_modules/expo-haptics/ios/HapticsModule.swift', 'public class HapticsModule: Module {', 'public class HapticsModule: Module, @unchecked Sendable {'),
]:
    patch(Path(path_str), old, new)

linking_reg = Path('node_modules/expo-linking/ios/ExpoLinkingRegistry.swift')
if linking_reg.exists():
    t = linking_reg.read_text(); o = t
    t = t.replace('class ExpoLinkingRegistry {', 'class ExpoLinkingRegistry: @unchecked Sendable {')
    t = t.replace('  static let shared = ExpoLinkingRegistry()', '  nonisolated(unsafe) static let shared = ExpoLinkingRegistry()')
    if t != o: linking_reg.write_text(t); patched += 1

linear_grad = Path('node_modules/expo-linear-gradient/ios/LinearGradientLayer.swift')
if linear_grad.exists():
    t = linear_grad.read_text(); o = t
    t = t.replace('var defaultStartPoint = CGPoint(x: 0.5, y: 0.0)', 'let defaultStartPoint = CGPoint(x: 0.5, y: 0.0)')
    t = t.replace('var defaultEndPoint = CGPoint(x: 0.5, y: 1.0)', 'let defaultEndPoint = CGPoint(x: 0.5, y: 1.0)')
    t = t.replace('var defaultLocations: [CGFloat] = []', 'let defaultLocations: [CGFloat] = []')
    if t != o: linear_grad.write_text(t); patched += 1

haptics = Path('node_modules/expo-haptics/ios/HapticsModule.swift')
if haptics.exists():
    t = haptics.read_text(); o = t
    t = t.replace(
        '    AsyncFunction("notificationAsync") { (notificationType: NotificationType) in\n      let generator = UINotificationFeedbackGenerator()\n      generator.prepare()\n      generator.notificationOccurred(notificationType.toFeedbackType())\n    }',
        '    AsyncFunction("notificationAsync") { (notificationType: NotificationType) in\n      MainActor.assumeIsolated {\n        let generator = UINotificationFeedbackGenerator()\n        generator.prepare()\n        generator.notificationOccurred(notificationType.toFeedbackType())\n      }\n    }'
    )
    t = t.replace(
        '    AsyncFunction("impactAsync") { (style: ImpactStyle) in\n      let generator = UIImpactFeedbackGenerator(style: style.toFeedbackStyle())\n      generator.prepare()\n      generator.impactOccurred()\n    }',
        '    AsyncFunction("impactAsync") { (style: ImpactStyle) in\n      MainActor.assumeIsolated {\n        let generator = UIImpactFeedbackGenerator(style: style.toFeedbackStyle())\n        generator.prepare()\n        generator.impactOccurred()\n      }\n    }'
    )
    t = t.replace(
        '    AsyncFunction("selectionAsync") {\n      let generator = UISelectionFeedbackGenerator()\n      generator.prepare()\n      generator.selectionChanged()\n    }',
        '    AsyncFunction("selectionAsync") {\n      MainActor.assumeIsolated {\n        let generator = UISelectionFeedbackGenerator()\n        generator.prepare()\n        generator.selectionChanged()\n      }\n    }'
    )
    if t != o: haptics.write_text(t); patched += 1

font_alias = Path('node_modules/expo-font/ios/FontFamilyAliasManager.swift')
if font_alias.exists():
    t = font_alias.read_text(); o = t
    t = t.replace('private var fontFamilyAliases = [String: String]()', 'private nonisolated(unsafe) var fontFamilyAliases = [String: String]()')
    t = t.replace('private var hasSwizzled = false', 'private nonisolated(unsafe) var hasSwizzled = false')
    if t != o: font_alias.write_text(t); patched += 1

patch(Path('node_modules/expo-font/ios/FontUtilsModule.swift'),
      '          "scale": UIScreen.main.scale',
      '          "scale": MainActor.assumeIsolated { UIScreen.main.scale }')

patch(Path('node_modules/expo-application/ios/ApplicationModule.swift'),
      '      return UIDevice.current.identifierForVendor?.uuidString',
      '      return MainActor.assumeIsolated {\n        UIDevice.current.identifierForVendor?.uuidString\n      }')

dom_reg = Path('node_modules/@expo/dom-webview/ios/DomWebViewRegistry.swift')
if dom_reg.exists():
    t = dom_reg.read_text(); o = t
    t = t.replace('internal final class DomWebViewRegistry {', 'internal final class DomWebViewRegistry: @unchecked Sendable {')
    t = t.replace('  static var shared = DomWebViewRegistry()', '  nonisolated(unsafe) static var shared = DomWebViewRegistry()')
    if t != o: dom_reg.write_text(t); patched += 1

file_pick_h = Path('node_modules/expo-file-system/ios/FilePickingHandler.swift')
if file_pick_h.exists():
    t = file_pick_h.read_text(); o = t
    t = t.replace('  func presentDocumentPicker(', '  @MainActor func presentDocumentPicker(')
    t = t.replace(
        '    if UIDevice.current.userInterfaceIdiom == .pad {\n      let viewFrame = currentVc.view.frame\n      picker.popoverPresentationController?.sourceRect = CGRect(\n        x: viewFrame.midX,\n        y: viewFrame.maxY,\n        width: 0,\n        height: 0\n      )\n      picker.popoverPresentationController?.sourceView = currentVc.view\n      picker.modalPresentationStyle = .pageSheet\n    }\n\n    currentVc.present(picker, animated: true)',
        '    MainActor.assumeIsolated {\n      if UIDevice.current.userInterfaceIdiom == .pad {\n        let viewFrame = currentVc.view.frame\n        picker.popoverPresentationController?.sourceRect = CGRect(\n          x: viewFrame.midX,\n          y: viewFrame.maxY,\n          width: 0,\n          height: 0\n        )\n        picker.popoverPresentationController?.sourceView = currentVc.view\n        picker.modalPresentationStyle = .pageSheet\n      }\n\n      currentVc.present(picker, animated: true)\n    }'
    )
    if t != o: file_pick_h.write_text(t); patched += 1

file_pick_u = Path('node_modules/expo-file-system/ios/FilePickingUtils.swift')
if file_pick_u.exists():
    t = file_pick_u.read_text(); o = t
    t = t.replace('internal func createFilePicker(', '@MainActor internal func createFilePicker(')
    t = t.replace('internal func createDirectoryPicker(', '@MainActor internal func createDirectoryPicker(')
    if t != o: file_pick_u.write_text(t); patched += 1

fs_bg = Path('node_modules/expo-file-system/ios/Legacy/FileSystemBackgroundSessionHandler.swift')
if fs_bg.exists():
    t = fs_bg.read_text(); o = t
    t = t.replace(
        '  public func invokeCompletionHandler(forSessionIdentifier identifier: String) {\n    guard let completionHandler = completionHandlers[identifier] else {\n      return\n    }\n    DispatchQueue.main.async {\n      completionHandler()\n    }\n    completionHandlers.removeValue(forKey: identifier)\n  }',
        '  public nonisolated func invokeCompletionHandler(forSessionIdentifier identifier: String) {\n    MainActor.assumeIsolated {\n      guard let completionHandler = completionHandlers[identifier] else {\n        return\n      }\n      DispatchQueue.main.async {\n        completionHandler()\n      }\n      completionHandlers.removeValue(forKey: identifier)\n    }\n  }'
    )
    if t != o: fs_bg.write_text(t); patched += 1

fs_mod = Path('node_modules/expo-file-system/ios/FileSystemModule.swift')
if fs_mod.exists():
    t = fs_mod.read_text(); o = t
    t = t.replace(
        '      filePickingHandler.presentDocumentPicker(\n        picker: createDirectoryPicker(initialUri: initialUri),\n        isDirectory: true,\n        initialUri: initialUri,\n        mimeType: nil,\n        promise: promise\n      )',
        '      MainActor.assumeIsolated {\n        filePickingHandler.presentDocumentPicker(\n          picker: createDirectoryPicker(initialUri: initialUri),\n          isDirectory: true,\n          initialUri: initialUri,\n          mimeType: nil,\n          promise: promise\n        )\n      }'
    )
    t = t.replace(
        '      filePickingHandler.presentDocumentPicker(\n        picker: createFilePicker(initialUri: initialUri, mimeType: mimeType),\n        isDirectory: false,\n        initialUri: initialUri,\n        mimeType: mimeType,\n        promise: promise\n      )',
        '      MainActor.assumeIsolated {\n        filePickingHandler.presentDocumentPicker(\n          picker: createFilePicker(initialUri: initialUri, mimeType: mimeType),\n          isDirectory: false,\n          initialUri: initialUri,\n          mimeType: mimeType,\n          promise: promise\n        )\n      }'
    )
    if t != o: fs_mod.write_text(t); patched += 1

patch(Path('node_modules/expo-file-system/ios/Legacy/FileSystemLegacyModule.swift'),
      'public final class FileSystemLegacyModule: Module {',
      'public final class FileSystemLegacyModule: Module, @unchecked Sendable {')

log_box = Path('node_modules/@expo/log-box/ios/ExpoLogBoxWebViewWrapper.swift')
if log_box.exists():
    t = log_box.read_text(); o = t
    t = t.replace('        Task.detached {\n            await self.handleWebViewMessageAsync(message: message)\n        }', '        Task {\n            await self.handleWebViewMessageAsync(message: message)\n        }')
    if t != o: log_box.write_text(t); patched += 1

img_view = Path('node_modules/expo-image/ios/ImageView.swift')
if img_view.exists():
    t = img_view.read_text(); o = t
    t = t.replace('      let scale = window?.screen.scale ?? UIScreen.main.scale', '      let scale = window?.screen.scale ?? MainActor.assumeIsolated { UIScreen.main.scale }')
    t = t.replace('    let scale = window?.screen.scale ?? UIScreen.main.scale', '    let scale = window?.screen.scale ?? MainActor.assumeIsolated { UIScreen.main.scale }')
    t = t.replace('    return window?.screen.scale as? Double ?? UIScreen.main.scale', '    return window?.screen.scale as? Double ?? MainActor.assumeIsolated { UIScreen.main.scale }')
    t = t.replace('  func applySymbolEffect() {', '  @MainActor func applySymbolEffect() {')
    t = t.replace('  private func applySingleSymbolEffect(_ sfEffectItem: SFSymbolEffect) {', '  @MainActor private func applySingleSymbolEffect(_ sfEffectItem: SFSymbolEffect) {')
    t = t.replace('  private func applySymbolEffectiOS18(effect: SFSymbolEffectType, scope: SFSymbolEffectScope?, options: SymbolEffectOptions) {', '  @MainActor private func applySymbolEffectiOS18(effect: SFSymbolEffectType, scope: SFSymbolEffectScope?, options: SymbolEffectOptions) {')
    t = t.replace('  private func applySymbolEffectiOS26(effect: SFSymbolEffectType, scope: SFSymbolEffectScope?, options: SymbolEffectOptions) {', '  @MainActor private func applySymbolEffectiOS26(effect: SFSymbolEffectType, scope: SFSymbolEffectScope?, options: SymbolEffectOptions) {')
    t = t.replace('  func startSymbolAnimation() {', '  @MainActor func startSymbolAnimation() {')
    t = t.replace('  func stopSymbolAnimation() {', '  @MainActor func stopSymbolAnimation() {')
    t = t.replace(
        '  @available(iOS 26.0, tvOS 26.0, *)\n  @MainActor private func applySymbolEffectiOS26(effect: SFSymbolEffectType, scope: SFSymbolEffectScope?, options: SymbolEffectOptions) {\n    switch effect {\n    case .drawOn:\n      switch scope {\n      case .byLayer: sdImageView.addSymbolEffect(.drawOn.byLayer, options: options)\n      case .wholeSymbol: sdImageView.addSymbolEffect(.drawOn.wholeSymbol, options: options)\n      case .none: sdImageView.addSymbolEffect(.drawOn, options: options)\n      }\n    case .drawOff:\n      switch scope {\n      case .byLayer: sdImageView.addSymbolEffect(.drawOff.byLayer, options: options)\n      case .wholeSymbol: sdImageView.addSymbolEffect(.drawOff.wholeSymbol, options: options)\n      case .none: sdImageView.addSymbolEffect(.drawOff, options: options)\n      }\n    default:\n      break\n    }\n  }',
        '#if compiler(>=6.2)\n  @available(iOS 26.0, tvOS 26.0, *)\n  @MainActor private func applySymbolEffectiOS26(effect: SFSymbolEffectType, scope: SFSymbolEffectScope?, options: SymbolEffectOptions) {\n    switch effect {\n    case .drawOn:\n      switch scope {\n      case .byLayer: sdImageView.addSymbolEffect(.drawOn.byLayer, options: options)\n      case .wholeSymbol: sdImageView.addSymbolEffect(.drawOn.wholeSymbol, options: options)\n      case .none: sdImageView.addSymbolEffect(.drawOn, options: options)\n      }\n    case .drawOff:\n      switch scope {\n      case .byLayer: sdImageView.addSymbolEffect(.drawOff.byLayer, options: options)\n      case .wholeSymbol: sdImageView.addSymbolEffect(.drawOff.wholeSymbol, options: options)\n      case .none: sdImageView.addSymbolEffect(.drawOff, options: options)\n      }\n    default:\n      break\n    }\n  }\n#endif'
    )
    t = t.replace(
        '    default:\n      if #available(iOS 26.0, tvOS 26.0, *) {\n        applySymbolEffectiOS26(effect: effect, scope: scope, options: options)\n      }',
        '    default:\n      #if compiler(>=6.2)\n      if #available(iOS 26.0, tvOS 26.0, *) {\n        applySymbolEffectiOS26(effect: effect, scope: scope, options: options)\n      }\n      #endif'
    )
    if t != o: img_view.write_text(t); patched += 1

img_mod = Path('node_modules/expo-image/ios/ImageModule.swift')
if img_mod.exists():
    t = img_mod.read_text(); o = t
    t = t.replace(
        '      AsyncFunction("startAnimating") { (view: ImageView) in\n        if view.isSFSymbolSource {\n          view.startSymbolAnimation()\n        } else {\n          view.sdImageView.startAnimating()\n        }\n      }',
        '      AsyncFunction("startAnimating") { (view: ImageView) in\n        MainActor.assumeIsolated {\n          if view.isSFSymbolSource {\n            view.startSymbolAnimation()\n          } else {\n            view.sdImageView.startAnimating()\n          }\n        }\n      }'
    )
    t = t.replace(
        '      AsyncFunction("stopAnimating") { (view: ImageView) in\n        if view.isSFSymbolSource {\n          view.stopSymbolAnimation()\n        } else {\n          view.sdImageView.stopAnimating()\n        }\n      }',
        '      AsyncFunction("stopAnimating") { (view: ImageView) in\n        MainActor.assumeIsolated {\n          if view.isSFSymbolSource {\n            view.stopSymbolAnimation()\n          } else {\n            view.sdImageView.stopAnimating()\n          }\n        }\n      }'
    )
    if t != o: img_mod.write_text(t); patched += 1

dom_wv = Path('node_modules/@expo/dom-webview/ios/DomWebView.swift')
if dom_wv.exists():
    t = dom_wv.read_text(); o = t
    t = t.replace('  internal typealias SyncCompletionHandler = (String?) -> Void', '  internal typealias SyncCompletionHandler = @Sendable (String?) -> Void')
    t = t.replace(
        '    DispatchQueue.main.async { [weak self] in\n      self?.webView.evaluateJavaScript(script)\n    }',
        '    DispatchQueue.main.async { [weak self] in\n      MainActor.assumeIsolated {\n        self?.webView.evaluateJavaScript(script)\n      }\n    }'
    )
    if t != o: dom_wv.write_text(t); patched += 1

dom_wv_mod = Path('node_modules/@expo/dom-webview/ios/DomWebViewModule.swift')
if dom_wv_mod.exists():
    t = dom_wv_mod.read_text(); o = t
    t = t.replace(
        '      if let webView = DomWebViewRegistry.shared.get(webViewId: webViewId) {\n        webView.injectJavaScript(source)\n      }',
        '      if let webView = DomWebViewRegistry.shared.get(webViewId: webViewId) {\n        MainActor.assumeIsolated {\n          webView.injectJavaScript(source)\n        }\n      }'
    )
    t = t.replace(
        '      AsyncFunction("scrollTo") { (view: DomWebView, param: ScrollToParam) in\n        view.scrollTo(offset: CGPoint(x: param.x, y: param.y), animated: param.animated)\n      }',
        '      AsyncFunction("scrollTo") { (view: DomWebView, param: ScrollToParam) in\n        MainActor.assumeIsolated {\n          view.scrollTo(offset: CGPoint(x: param.x, y: param.y), animated: param.animated)\n        }\n      }'
    )
    t = t.replace(
        '      AsyncFunction("injectJavaScript") { (view: DomWebView, script: String) in\n        view.injectJavaScript(script)\n      }',
        '      AsyncFunction("injectJavaScript") { (view: DomWebView, script: String) in\n        MainActor.assumeIsolated {\n          view.injectJavaScript(script)\n        }\n      }'
    )
    if t != o: dom_wv_mod.write_text(t); patched += 1

keep_awake = Path('node_modules/expo-keep-awake/ios/KeepAwakeModule.swift')
if keep_awake.exists():
    t = keep_awake.read_text(); o = t
    t = t.replace(
        '      return DispatchQueue.main.sync {\n        return UIApplication.shared.isIdleTimerDisabled\n      }',
        '      return MainActor.assumeIsolated {\n        UIApplication.shared.isIdleTimerDisabled\n      }'
    )
    t = t.replace(
        '  DispatchQueue.main.async {\n    UIApplication.shared.isIdleTimerDisabled = activated\n  }',
        '  DispatchQueue.main.async {\n    MainActor.assumeIsolated {\n      UIApplication.shared.isIdleTimerDisabled = activated\n    }\n  }'
    )
    if t != o: keep_awake.write_text(t); patched += 1

expo_head = Path('node_modules/expo-router/ios/ExpoHeadModule.swift')
if expo_head.exists():
    t = expo_head.read_text(); o = t
    t = t.replace('var launchedActivity: NSUserActivity?', 'nonisolated(unsafe) var launchedActivity: NSUserActivity?')
    t = t.replace('internal class InvalidSchemeException: Exception {', 'internal class InvalidSchemeException: Exception, @unchecked Sendable {')
    if t != o: expo_head.write_text(t); patched += 1

lp_action = Path('node_modules/expo-router/ios/LinkPreview/LinkPreviewNativeActionView.swift')
if lp_action.exists():
    t = lp_action.read_text(); o = t
    t = t.replace('class LinkPreviewNativeActionView: RouterViewWithLogger, LinkPreviewMenuUpdatable {', 'class LinkPreviewNativeActionView: RouterViewWithLogger, @preconcurrency LinkPreviewMenuUpdatable {')
    t = t.replace(
        '          if instance[keyPath: storageKeyPath].updateAction {\n            instance.updateUiAction()\n          }\n          if instance[keyPath: storageKeyPath].updateMenu {\n            instance.updateMenu()\n          }',
        '          let shouldUpdateAction = instance[keyPath: storageKeyPath].updateAction\n          let shouldUpdateMenu = instance[keyPath: storageKeyPath].updateMenu\n          MainActor.assumeIsolated {\n            if shouldUpdateAction {\n              instance.updateUiAction()\n            }\n            if shouldUpdateMenu {\n              instance.updateMenu()\n            }\n          }'
    )
    if t != o: lp_action.write_text(t); patched += 1

patch(Path('node_modules/expo-router/ios/LinkPreview/LinkPreviewNativeView.swift'),
      'class NativeLinkPreviewView: RouterViewWithLogger, UIContextMenuInteractionDelegate,\n  RNSDismissibleModalProtocol, LinkPreviewMenuUpdatable {',
      'class NativeLinkPreviewView: RouterViewWithLogger, UIContextMenuInteractionDelegate,\n  @preconcurrency RNSDismissibleModalProtocol, @preconcurrency LinkPreviewMenuUpdatable {')
patch(Path('node_modules/expo-router/ios/LinkPreview/LinkZoomTransition.swift'),
      'class LinkZoomTransitionSource: LinkZoomExpoView, LinkPreviewIndirectTriggerProtocol {',
      'class LinkZoomTransitionSource: LinkZoomExpoView, @preconcurrency LinkPreviewIndirectTriggerProtocol {')
patch(Path('node_modules/expo-router/ios/LinkPreview/LinkPreviewNativeNavigation.swift'),
      'internal class LinkPreviewNativeNavigation {', '@MainActor internal class LinkPreviewNativeNavigation {')
patch(Path('node_modules/expo-router/ios/LinkPreview/RNScreensTabCompat.swift'),
      'enum RNScreensTabCompat {', '@MainActor enum RNScreensTabCompat {')

router_font = Path('node_modules/expo-router/ios/Toolbar/RouterFontUtils.swift')
if router_font.exists():
    t = router_font.read_text(); o = t
    t = t.replace('  static func setTitleStyle(fromConfig titleStyle: TitleStyle, for item: UIBarButtonItem) {', '  @MainActor static func setTitleStyle(fromConfig titleStyle: TitleStyle, for item: UIBarButtonItem) {')
    t = t.replace('  static func clearTitleStyle(for item: UIBarButtonItem) {', '  @MainActor static func clearTitleStyle(for item: UIBarButtonItem) {')
    if t != o: router_font.write_text(t); patched += 1

toolbar_host = Path('node_modules/expo-router/ios/Toolbar/RouterToolbarHostView.swift')
if toolbar_host.exists():
    t = toolbar_host.read_text(); o = t
    t = t.replace('class RouterToolbarHostView: RouterViewWithLogger, LinkPreviewMenuUpdatable {', 'class RouterToolbarHostView: RouterViewWithLogger, @preconcurrency LinkPreviewMenuUpdatable {')
    t = t.replace(
        '            if #available(iOS 26.0, *) {\n              if let hidesSharedBackground = menu.hidesSharedBackground {\n                item.hidesSharedBackground = hidesSharedBackground\n              }\n              if let sharesBackground = menu.sharesBackground {\n                item.sharesBackground = sharesBackground\n              }\n            }',
        '            #if compiler(>=6.2)\n            if #available(iOS 26.0, *) {\n              if let hidesSharedBackground = menu.hidesSharedBackground {\n                item.hidesSharedBackground = hidesSharedBackground\n              }\n              if let sharesBackground = menu.sharesBackground {\n                item.sharesBackground = sharesBackground\n              }\n            }\n            #endif'
    )
    if t != o: toolbar_host.write_text(t); patched += 1

toolbar_item = Path('node_modules/expo-router/ios/Toolbar/RouterToolbarItemView.swift')
if toolbar_item.exists():
    t = toolbar_item.read_text(); o = t
    t = t.replace(
        '      item = controller.navigationItem.searchBarPlacementBarButtonItem',
        '#if compiler(>=6.2)\n      item = controller.navigationItem.searchBarPlacementBarButtonItem\n#else\n      currentBarButtonItem = nil\n      return\n#endif'
    )
    t = t.replace(
        '    if #available(iOS 26.0, *) {\n      item.hidesSharedBackground = hidesSharedBackground\n      item.sharesBackground = sharesBackground\n    }',
        '    #if compiler(>=6.2)\n    if #available(iOS 26.0, *) {\n      item.hidesSharedBackground = hidesSharedBackground\n      item.sharesBackground = sharesBackground\n    }\n    #endif'
    )
    t = t.replace(
        '        if instance[keyPath: storageKeyPath].needsFullRebuild {\n          instance.performRebuild()\n        } else {\n          instance.performUpdate()\n        }',
        '        let needsFullRebuild = instance[keyPath: storageKeyPath].needsFullRebuild\n        MainActor.assumeIsolated {\n          if needsFullRebuild {\n            instance.performRebuild()\n          } else {\n            instance.performUpdate()\n          }\n        }'
    )
    if t != o: toolbar_item.write_text(t); patched += 1

toolbar_mod = Path('node_modules/expo-router/ios/Toolbar/RouterToolbarModule.swift')
if toolbar_mod.exists():
    t = toolbar_mod.read_text(); o = t
    t = t.replace(
        '      if #available(iOS 26.0, *) {\n        return .prominent\n      } else {\n        return .done\n      }',
        '#if compiler(>=6.2)\n      if #available(iOS 26.0, *) {\n        return .prominent\n      }\n#endif\n      return .done'
    )
    if t != o: toolbar_mod.write_text(t); patched += 1

web_auth = Path('node_modules/expo-web-browser/ios/WebAuthSession.swift')
if web_auth.exists():
    t = web_auth.read_text(); o = t
    t = t.replace('@MainActor private class PresentationContextProvider' if '@MainActor private class PresentationContextProvider' in t else 'private class PresentationContextProvider: NSObject, ASWebAuthenticationPresentationContextProviding {', '@MainActor private class PresentationContextProvider: NSObject, ASWebAuthenticationPresentationContextProviding {')
    t = t.replace('final internal class WebAuthSession {', '@MainActor final internal class WebAuthSession: @unchecked Sendable {')
    if t != o: web_auth.write_text(t); patched += 1

# RCTSwiftUIContainerView.swift: @preconcurrency imports
rct_cv = Path('node_modules/react-native/ReactApple/RCTSwiftUI/RCTSwiftUIContainerView.swift')
if rct_cv.exists():
    t = rct_cv.read_text(); o = t
    t = t.replace('import SwiftUI\nimport UIKit', '@preconcurrency import SwiftUI\n@preconcurrency import UIKit')
    if t != o: rct_cv.write_text(t); patched += 1

# RCTSwiftUIContainerViewObjC.h: hand-written header for ScanDependencies compatibility
rct_h = Path('node_modules/react-native/ReactApple/RCTSwiftUIWrapper/RCTSwiftUIContainerViewObjC.h')
rct_h.write_text('\n'.join([
    '#pragma once',
    '#import <Foundation/Foundation.h>',
    '#import <UIKit/UIKit.h>',
    '',
    '@interface RCTSwiftUIContainerView : NSObject',
    '- (instancetype)init;',
    '- (void)updateContentView:(UIView *)view;',
    '- (UIView * _Nullable)hostingView;',
    '- (UIView * _Nullable)contentView;',
    '- (void)updateBlurRadius:(NSNumber *)radius;',
    '- (void)updateGrayscale:(NSNumber *)grayscale;',
    '- (void)updateDropShadowWithStandardDeviation:(NSNumber *)standardDeviation x:(NSNumber *)x y:(NSNumber *)y color:(UIColor *)color;',
    '- (void)updateSaturation:(NSNumber *)saturation;',
    '- (void)updateContrast:(NSNumber *)contrast;',
    '- (void)updateHueRotate:(NSNumber *)degrees;',
    '- (void)updateLayoutWithBounds:(CGRect)bounds;',
    '- (void)resetStyles;',
    '@end',
    '',
]), encoding='utf-8')
patched += 1

# expo-notifications CategoriesModule: nonisolated init for CategoryManager
cats2 = Path('node_modules/expo-notifications/ios/ExpoNotifications/Notifications/Categories/CategoriesModule.swift')
if cats2.exists():
    t = cats2.read_text(); o = t
    t = t.replace(
        '  private var categories: Set<UNNotificationCategory>?\n\n  func setCategory',
        '  private var categories: Set<UNNotificationCategory>?\n\n  nonisolated init() {}\n\n  func setCategory'
    )
    if t != o: cats2.write_text(t); patched += 1

# expo-modules-core SwiftUIViewDefinition
swiftui_vd = Path('node_modules/expo-modules-core/ios/Core/Views/SwiftUI/SwiftUIViewDefinition.swift')
if swiftui_vd.exists():
    t = swiftui_vd.read_text(); o = t
    t = t.replace(
        '            let content = hostingUIView.getContentView()',
        '            let content = MainActor.assumeIsolated { hostingUIView.getContentView() }'
    )
    if t != o: swiftui_vd.write_text(t); patched += 1

# expo-file-system nullability
for h in Path('node_modules').rglob('EXSession*Delegate.h'):
    t = h.read_text(encoding='utf-8', errors='replace'); o = t
    import re
    t = re.sub(r'\(NSURLSession\s*\*\)', '(NSURLSession * _Nonnull)', t)
    t = re.sub(r'\(NSURLSessionTask\s*\*\)', '(NSURLSessionTask * _Nonnull)', t)
    t = re.sub(r'\(NSError\s*\*\)(\s*\w)', r'(NSError * _Nullable)\1', t)
    if t != o: h.write_text(t, encoding='utf-8'); patched += 1

print(f'extra expo iOS modules patched: {patched}')
PYEOF

# ── 3. Disable react-native-screens gamma ─────────────────────────────────────
python3 << 'PYEOF'
from pathlib import Path
p = Path('node_modules/react-native-screens/RNScreens.podspec')
t = p.read_text()
t = t.replace("gamma_project_enabled = ENV['RNS_GAMMA_ENABLED'] == '1'", "gamma_project_enabled = false")
p.write_text(t)
print('gamma disabled:', 'gamma_project_enabled = false' in t)
PYEOF

# ── 4. Patch Podfile for Swift concurrency ────────────────────────────────────
python3 << 'PYEOF'
from pathlib import Path

podfile_path = Path('ios/Podfile')
podfile = podfile_path.read_text()
lines = podfile.splitlines()

marker = "# KotoClip Swift 5.9 fix"
inject = """  {marker}
            installer.pods_project.targets.each do |target|
              target.build_configurations.each do |config|
                config.build_settings['SWIFT_VERSION'] = '5.0'
                config.build_settings['SWIFT_STRICT_CONCURRENCY'] = 'minimal'
                config.build_settings['GCC_TREAT_WARNINGS_AS_ERRORS'] = 'NO'
                if target.name.include?('ExpoFileSystem') || target.name.include?('expo-file-system')
                  config.build_settings['GCC_WARN_ABOUT_MISSING_FIELD_INITIALIZERS'] = 'NO'
                  config.build_settings['CLANG_WARN_NULLABLE_TO_NONNULL_CONVERSION'] = 'NO'
                end
                if target.name == 'RCTSwiftUI'
                  config.build_settings['DEFINES_MODULE'] = 'YES'
                  config.build_settings['CLANG_ENABLE_MODULES'] = 'YES'
                end
                if target.name == 'RCTSwiftUIWrapper'
                  config.build_settings['CLANG_ENABLE_MODULES'] = 'YES'
                  config.build_settings['CLANG_ENABLE_EXPLICIT_MODULES'] = 'NO'
                end
              end
            end
            installer.aggregate_targets.each do |aggregate_target|
              aggregate_target.user_project.native_targets.each do |target|
                target.build_configurations.each do |config|
                  config.build_settings['SWIFT_VERSION'] = '6.0'
                  config.build_settings['SWIFT_STRICT_CONCURRENCY'] = 'minimal'
                  config.build_settings['GCC_TREAT_WARNINGS_AS_ERRORS'] = 'NO'
                end
              end
              aggregate_target.user_project.save
            end
""".replace('{marker}', marker)

if marker not in podfile:
    result = []
    inserted = False
    for line in lines:
        result.append(line)
        if (not inserted) and line.strip() == 'post_install do |installer|':
            result.extend(inject.splitlines())
            inserted = True
    if inserted:
        podfile = "\n".join(result) + "\n"
    else:
        podfile = podfile.rstrip() + "\n\npost_install do |installer|\n" + inject + "\nend\n"

podfile_path.write_text(podfile)
print('Podfile patched')
PYEOF

# ── 5. Hermes prebuilt tarball + pod install ──────────────────────────────────
HERMES_VERSION="0.14.1"
HERMES_DIR="/tmp/hermes-engine-artifacts"
HERMES_TARBALL="${HERMES_DIR}/hermes-ios-${HERMES_VERSION}-hermes-ios-debug.tar.gz"
mkdir -p "$HERMES_DIR"
if [ ! -f "$HERMES_TARBALL" ]; then
    echo "[hermes] Downloading prebuilt tarball..."
    curl -L "https://repo1.maven.org/maven2/com/facebook/hermes/hermes-ios/${HERMES_VERSION}/hermes-ios-${HERMES_VERSION}-hermes-ios-debug.tar.gz" \
        -o "$HERMES_TARBALL"
fi
export HERMES_ENGINE_TARBALL_PATH="$HERMES_TARBALL"
echo "[hermes] Using: $HERMES_TARBALL"

cd ios && pod install && cd ..

# ── 6. Force Swift 5.0 (pods) / 6.0 (app) in pbxproj ─────────────────────────
python3 << 'PYEOF'
from pathlib import Path
import re

for path, version in [
    (Path('ios/Pods/Pods.xcodeproj/project.pbxproj'), '5.0'),
    (Path('ios/KotoClip.xcodeproj/project.pbxproj'), '6.0'),
]:
    if not path.exists():
        print(f'skip missing: {path}')
        continue
    t = path.read_text()
    o = t
    t = re.sub(r'SWIFT_VERSION = [^;]+;', f'SWIFT_VERSION = {version};', t)
    t = re.sub(r'SWIFT_STRICT_CONCURRENCY = [^;]+;', 'SWIFT_STRICT_CONCURRENCY = minimal;', t)
    if 'SWIFT_STRICT_CONCURRENCY = minimal;' not in t:
        t = t.replace(f'SWIFT_VERSION = {version};', f'SWIFT_VERSION = {version};\n\t\t\t\tSWIFT_STRICT_CONCURRENCY = minimal;')
    t = re.sub(r'GCC_TREAT_WARNINGS_AS_ERRORS = YES;', 'GCC_TREAT_WARNINGS_AS_ERRORS = NO;', t)
    path.write_text(t)
    print(f'patched {path} swift={version} changed={t!=o}')
PYEOF

# ── 6b. Force Apple Distribution signing in project-level Release config ───────
python3 << 'PYEOF'
from pathlib import Path

path = Path('ios/KotoClip.xcodeproj/project.pbxproj')
if path.exists():
    t = path.read_text()
    patched = t.replace(
        '"CODE_SIGN_IDENTITY[sdk=iphoneos*]" = "iPhone Developer";\n\t\t\t\tCOPY_PHASE_STRIP = YES;',
        '"CODE_SIGN_IDENTITY[sdk=iphoneos*]" = "Apple Distribution";\n\t\t\t\tCOPY_PHASE_STRIP = YES;'
    )
    if patched != t:
        path.write_text(patched)
        print('[signing] Patched CODE_SIGN_IDENTITY iPhone Developer -> Apple Distribution')
    else:
        print('[signing] Already Apple Distribution or pattern not found (no change needed)')
else:
    print('[signing] pbxproj not found, skipping')
PYEOF

# ── 7. AppIntentsSSUTraining Mach-O stub ──────────────────────────────────────
python3 << 'PYEOF'
import os, subprocess, tempfile, re
from pathlib import Path

stub_dir = Path('ios-stubs/AppIntentsSSUTraining.framework')
stub_dir.mkdir(parents=True, exist_ok=True)
for old in stub_dir.glob('*.tbd'):
    old.unlink()

stub_binary = stub_dir / 'AppIntentsSSUTraining'
sdk_path = subprocess.check_output(['xcrun', '--sdk', 'iphoneos', '--show-sdk-path'], text=True).strip()

with tempfile.NamedTemporaryFile(suffix='.c', mode='w', delete=False) as f:
    f.write('// stub\n')
    tmp_c = f.name
try:
    result = subprocess.run(
        ['xcrun', 'clang', '-arch', 'arm64', '-target', 'arm64-apple-ios16.0',
         '-isysroot', sdk_path, '-dynamiclib', '-fapplication-extension',
         '-Wl,-install_name,/System/Library/PrivateFrameworks/AppIntentsSSUTraining.framework/AppIntentsSSUTraining',
         tmp_c, '-o', str(stub_binary)],
        capture_output=True, text=True, timeout=60
    )
    if result.returncode != 0:
        raise SystemExit(f'clang stub failed: {result.stderr}')
    print(f'[AppIntentsSSUTraining] Mach-O stub created at {stub_binary}')
finally:
    os.unlink(tmp_c)

pbxproj = Path('ios/KotoClip.xcodeproj/project.pbxproj')
if pbxproj.exists():
    t = pbxproj.read_text()
    if 'AppIntentsSSUTraining' not in t:
        def add_settings(m):
            ind = m.group(1)
            return (ind + 'SKIP_INSTALL = YES;\n' +
                    ind + 'FRAMEWORK_SEARCH_PATHS = (\n' +
                    ind + '\t"$(PROJECT_DIR)/../ios-stubs",\n' +
                    ind + '\t"$(inherited)",\n' +
                    ind + ');\n' +
                    ind + 'OTHER_LDFLAGS = (\n' +
                    ind + '\t"-weak_framework",\n' +
                    ind + '\tAppIntentsSSUTraining,\n' +
                    ind + ');')
        patched = re.sub(r'^(\s+)SKIP_INSTALL = YES;$', add_settings, t, flags=re.MULTILINE)
        if patched != t:
            pbxproj.write_text(patched)
            print('[ShareExtension] Patched pbxproj with FRAMEWORK_SEARCH_PATHS and OTHER_LDFLAGS')
        else:
            print('[ShareExtension] SKIP_INSTALL not found in pbxproj')
    else:
        print('[ShareExtension] Already patched')
PYEOF

echo "=== ci_post_clone complete ==="
