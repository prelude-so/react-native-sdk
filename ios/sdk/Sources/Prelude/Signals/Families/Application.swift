import Foundation

extension Application: CollectableFamily {
    static func collect() -> Application {
        var name: String? {
            Bundle.main.infoDictionary?["CFBundleName"] as? String
        }

        var version: String? {
            Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String
        }

        var buildVersion: String? {
            Bundle.main.infoDictionary?["CFBundleVersion"] as? String
        }

        var bundleId: String? {
            Bundle.main.infoDictionary?["CFBundleIdentifier"] as? String
        }

        return Application(
            name: name,
            version: version,
            platform: .apple(.init(buildVersion: buildVersion,
                                   bundleId: bundleId))
        )
    }
}
