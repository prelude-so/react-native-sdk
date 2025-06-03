import Foundation

func buildUserAgent() -> String {
    "Prelude/\(Version.versionString) Core/\(coreVersion()) (\(System.userAgentString()))"
}
