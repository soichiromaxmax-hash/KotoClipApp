import UIKit
import SwiftUI

private let APP_GROUP = "group.jp.kotoclip.app"
private let API_BASE  = "https://kotoclip.onrender.com/api"
private let TEAL      = Color(red: 0.176, green: 0.831, blue: 0.749)

// MARK: - State
private enum ShareState: Equatable {
    case loading
    case preview(meaning: String)
    case adding
    case success
    case noToken
    case loggingIn
    case loginError(String)
    case failure(String)
}

// MARK: - ViewModel
@MainActor
private class ShareVM: ObservableObject {
    @Published var state: ShareState = .loading

    let word: String
    let complete: () -> Void

    init(word: String, complete: @escaping () -> Void) {
        self.word = word
        self.complete = complete
    }

    func load() {
        guard storedToken() != nil else { state = .noToken; return }
        state = .loading
        Task {
            do {
                let meaning = try await lookup(word: word)
                state = .preview(meaning: meaning)
            } catch let err as URLError where err.code == .userAuthenticationRequired {
                state = .noToken
            } catch {
                state = .failure("翻訳を取得できませんでした")
            }
        }
    }

    func login(email: String, password: String) {
        state = .loggingIn
        Task {
            do {
                guard let url = URL(string: "\(API_BASE)/auth/login") else { throw URLError(.badURL) }
                var req = URLRequest(url: url, timeoutInterval: 15)
                req.httpMethod = "POST"
                req.setValue("application/json", forHTTPHeaderField: "Content-Type")
                req.httpBody = try JSONSerialization.data(withJSONObject: ["email": email, "password": password])
                let (data, res) = try await URLSession.shared.data(for: req)
                guard let http = res as? HTTPURLResponse else { throw URLError(.badServerResponse) }
                if http.statusCode == 401 || http.statusCode == 400 {
                    state = .loginError("メールアドレスまたはパスワードが違います")
                    return
                }
                guard http.statusCode < 300 else { throw URLError(.badServerResponse) }
                let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
                guard let access = json?["access_token"] as? String else {
                    state = .loginError("ログインに失敗しました")
                    return
                }
                let refresh = (json?["refresh_token"] as? String) ?? ""
                let ud = UserDefaults(suiteName: APP_GROUP)
                ud?.set(access, forKey: "vocab_token")
                ud?.set(refresh, forKey: "vocab_refresh")
                ud?.synchronize()
                // ログイン成功 → 単語を検索
                load()
            } catch {
                state = .loginError("接続に失敗しました。ネットワークを確認してください。")
            }
        }
    }

    func add(meaning: String) {
        guard storedToken() != nil else { state = .noToken; return }
        state = .adding
        Task {
            do {
                try await post(word: word, meaning: meaning)
                state = .success
                try? await Task.sleep(nanoseconds: 1_400_000_000)
                complete()
            } catch let err as URLError where err.code == .userAuthenticationRequired {
                state = .failure("ログインが切れています。アプリを開いてください。")
            } catch {
                state = .failure("追加に失敗しました。もう一度お試しください。")
            }
        }
    }

    func cancel() { complete() }

    // MARK: - Token helpers

    private func storedToken() -> String? {
        UserDefaults(suiteName: APP_GROUP)?.string(forKey: "vocab_token")
    }

    private func refreshToken() async throws -> String {
        let ud = UserDefaults(suiteName: APP_GROUP)
        guard let refresh = ud?.string(forKey: "vocab_refresh"), !refresh.isEmpty else {
            throw URLError(.userAuthenticationRequired)
        }
        guard let url = URL(string: "\(API_BASE)/auth/refresh") else { throw URLError(.badURL) }
        var req = URLRequest(url: url, timeoutInterval: 15)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try JSONSerialization.data(withJSONObject: ["refresh_token": refresh])
        let (data, res) = try await URLSession.shared.data(for: req)
        guard let http = res as? HTTPURLResponse, http.statusCode < 300 else {
            throw URLError(.userAuthenticationRequired)
        }
        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        guard let newAccess = json?["access_token"] as? String else {
            throw URLError(.userAuthenticationRequired)
        }
        let newRefresh = (json?["refresh_token"] as? String) ?? refresh
        ud?.set(newAccess, forKey: "vocab_token")
        ud?.set(newRefresh, forKey: "vocab_refresh")
        return newAccess
    }

    // 401 時に refresh → retry する汎用フェッチ
    private func authedData(url: URL, method: String = "GET", body: Data? = nil) async throws -> Data {
        guard var token = storedToken() else { throw URLError(.userAuthenticationRequired) }

        func makeRequest(_ t: String) -> URLRequest {
            var r = URLRequest(url: url, timeoutInterval: 20)
            r.httpMethod = method
            r.setValue("Bearer \(t)", forHTTPHeaderField: "Authorization")
            if let body {
                r.setValue("application/json", forHTTPHeaderField: "Content-Type")
                r.httpBody = body
            }
            return r
        }

        let (data, res) = try await URLSession.shared.data(for: makeRequest(token))
        if let http = res as? HTTPURLResponse, http.statusCode == 401 {
            token = try await refreshToken()
            let (retryData, retryRes) = try await URLSession.shared.data(for: makeRequest(token))
            guard let http2 = retryRes as? HTTPURLResponse, http2.statusCode < 300 else {
                throw URLError(.userAuthenticationRequired)
            }
            return retryData
        }
        guard let http = res as? HTTPURLResponse, http.statusCode < 300 else {
            throw URLError(.badServerResponse)
        }
        return data
    }

    // MARK: - API calls

    private func lookup(word: String) async throws -> String {
        var comps = URLComponents(string: "\(API_BASE)/lookup")!
        comps.queryItems = [URLQueryItem(name: "word", value: word)]
        guard let url = comps.url else { throw URLError(.badURL) }
        let data = try await authedData(url: url)
        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        return (json?["meaning"] as? String) ?? word
    }

    private func post(word: String, meaning: String) async throws {
        guard let url = URL(string: "\(API_BASE)/words") else { throw URLError(.badURL) }
        let body = try JSONSerialization.data(withJSONObject: [
            "word": word,
            "meaning": meaning,
            "source_type": "share_extension",
        ])
        _ = try await authedData(url: url, method: "POST", body: body)
    }
}

// MARK: - Root View
private struct ShareView: View {
    let word: String
    @StateObject private var vm: ShareVM

    init(word: String, complete: @escaping () -> Void) {
        self.word = word
        _vm = StateObject(wrappedValue: ShareVM(word: word, complete: complete))
    }

    var body: some View {
        VStack(spacing: 0) {
            Capsule()
                .fill(Color(.systemGray4))
                .frame(width: 36, height: 4)
                .padding(.top, 10)

            HStack {
                Text("KotoClip")
                    .font(.headline).bold()
                    .foregroundColor(TEAL)
                Spacer()
                Button("キャンセル") { vm.cancel() }
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            .padding(.horizontal, 20)
            .padding(.top, 14)

            Divider().padding(.top, 12)

            Group {
                switch vm.state {
                case .loading:              LoadingView(label: "翻訳を取得中...")
                case .preview(let m):       PreviewView(word: word, meaning: m, vm: vm)
                case .adding:               LoadingView(label: "追加しています...")
                case .success:              SuccessView()
                case .noToken:              LoginView(vm: vm)
                case .loggingIn:            LoadingView(label: "ログイン中...")
                case .loginError(let m):    LoginView(vm: vm, errorMessage: m)
                case .failure(let m):       FailView(message: m, vm: vm)
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 24)

            Spacer()
        }
        .background(Color(.systemBackground))
        .onAppear { vm.load() }
    }
}

private struct LoadingView: View {
    let label: String
    var body: some View {
        VStack(spacing: 14) {
            ProgressView().scaleEffect(1.2)
            Text(label).font(.subheadline).foregroundColor(.secondary)
        }
        .padding(.top, 30)
    }
}

private struct PreviewView: View {
    let word: String
    let meaning: String
    let vm: ShareVM

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            VStack(alignment: .leading, spacing: 6) {
                Text(word)
                    .font(.title2).bold()
                    .foregroundColor(.primary)
                Text(meaning)
                    .font(.body)
                    .foregroundColor(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(14)
            .background(Color(.secondarySystemBackground))
            .cornerRadius(12)

            Button {
                vm.add(meaning: meaning)
            } label: {
                Text("単語帳に追加")
                    .font(.headline).bold()
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 15)
                    .background(TEAL)
                    .foregroundColor(Color(red: 0.055, green: 0.067, blue: 0.086))
                    .cornerRadius(12)
            }
        }
    }
}

private struct SuccessView: View {
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 56))
                .foregroundColor(TEAL)
            Text("単語帳に追加しました")
                .font(.headline)
        }
        .padding(.top, 30)
    }
}

private struct MessageView: View {
    let icon: String
    let msg: String
    var body: some View {
        VStack(spacing: 14) {
            Image(systemName: icon)
                .font(.system(size: 48))
                .foregroundColor(.orange)
            Text(msg)
                .font(.subheadline)
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)
        }
        .padding(.top, 20)
    }
}

private struct LoginView: View {
    let vm: ShareVM
    var errorMessage: String? = nil
    @State private var email: String = ""
    @State private var password: String = ""

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("KotoClipにログイン")
                .font(.headline).bold()
                .foregroundColor(.primary)
            if let err = errorMessage {
                Text(err)
                    .font(.caption)
                    .foregroundColor(.red)
                    .multilineTextAlignment(.leading)
            }
            TextField("メールアドレス", text: $email)
                .textContentType(.emailAddress)
                .keyboardType(.emailAddress)
                .autocapitalization(.none)
                .autocorrectionDisabled()
                .padding(10)
                .background(Color(.secondarySystemBackground))
                .cornerRadius(8)
            SecureField("パスワード", text: $password)
                .padding(10)
                .background(Color(.secondarySystemBackground))
                .cornerRadius(8)
            Button {
                vm.login(email: email.trimmingCharacters(in: .whitespaces), password: password)
            } label: {
                Text("ログイン")
                    .font(.headline).bold()
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 13)
                    .background(TEAL)
                    .foregroundColor(Color(red: 0.055, green: 0.067, blue: 0.086))
                    .cornerRadius(12)
            }
            .disabled(email.isEmpty || password.isEmpty)
            .opacity((email.isEmpty || password.isEmpty) ? 0.5 : 1)
        }
        .padding(.top, 4)
    }
}

private struct FailView: View {
    let message: String
    let vm: ShareVM
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 44))
                .foregroundColor(.orange)
            Text(message)
                .font(.subheadline)
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)
            Button("もう一度") { vm.load() }
                .foregroundColor(TEAL)
        }
        .padding(.top, 20)
    }
}

// MARK: - Entry Point
class ShareViewController: UIViewController {

    override func viewDidLoad() {
        super.viewDidLoad()
        extractText { [weak self] word in
            guard let self else { return }
            let host = UIHostingController(
                rootView: ShareView(word: word) {
                    self.extensionContext?.completeRequest(returningItems: nil)
                }
            )
            self.addChild(host)
            host.view.translatesAutoresizingMaskIntoConstraints = false
            self.view.addSubview(host.view)
            NSLayoutConstraint.activate([
                host.view.topAnchor.constraint(equalTo: self.view.topAnchor),
                host.view.bottomAnchor.constraint(equalTo: self.view.bottomAnchor),
                host.view.leadingAnchor.constraint(equalTo: self.view.leadingAnchor),
                host.view.trailingAnchor.constraint(equalTo: self.view.trailingAnchor),
            ])
            host.didMove(toParent: self)
        }
    }

    private func extractText(_ completion: @escaping (String) -> Void) {
        guard let item = extensionContext?.inputItems.first as? NSExtensionItem else {
            cancel(); return
        }

        let providers = item.attachments ?? []
        let typeIds = ["public.plain-text", "public.text", "public.url"]

        for typeId in typeIds {
            for provider in providers where provider.hasItemConformingToTypeIdentifier(typeId) {
                provider.loadItem(forTypeIdentifier: typeId, options: nil) { [weak self] data, _ in
                    let text: String
                    if let url = data as? URL {
                        text = url.absoluteString
                    } else {
                        text = (data as? String) ?? ""
                    }
                    let clipped = self?.bestClip(from: text) ?? ""
                    guard !clipped.isEmpty else {
                        DispatchQueue.main.async { self?.cancel() }
                        return
                    }
                    DispatchQueue.main.async { completion(clipped) }
                }
                return
            }
        }
        cancel()
    }

    private func bestClip(from text: String) -> String {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty { return "" }

        let separators = CharacterSet.whitespacesAndNewlines.union(.punctuationCharacters)
        let tokens = trimmed
            .components(separatedBy: separators)
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty && $0.range(of: "[A-Za-z]", options: .regularExpression) != nil }

        if tokens.count == 1, let only = tokens.first {
            return only
        }

        if trimmed.count <= 80, !trimmed.contains("http") {
            return trimmed
        }

        return tokens.first ?? trimmed
    }

    private func cancel() {
        extensionContext?.cancelRequest(withError: NSError(domain: "kotoclip", code: 0))
    }
}
