import ExpoModulesCore

public class SharedStorageModule: Module {
  private let suite = "group.jp.kotoclip.app"

  public func definition() -> ModuleDefinition {
    Name("SharedStorage")

    Function("setItem") { (key: String, value: String) in
      UserDefaults(suiteName: self.suite)?.set(value, forKey: key)
    }

    Function("removeItem") { (key: String) in
      UserDefaults(suiteName: self.suite)?.removeObject(forKey: key)
    }
  }
}
