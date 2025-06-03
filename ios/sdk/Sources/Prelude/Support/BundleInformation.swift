import Foundation

func retrieveTeamId() -> String? {
    BundleInformation.read()?.teamIdentifier.first
}

private enum BundleKeys: String, CodingKey {
    case teamIdentifier = "TeamIdentifier"
}

private struct BundleInformation: Decodable {
    var teamIdentifier: [String]

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: BundleKeys.self)
        let teamIdentifier: [String] = (try? container.decode([String].self, forKey: .teamIdentifier)) ?? []

        self.teamIdentifier = teamIdentifier
    }

    static func read() -> Self? {
        let profilePath: String? = Bundle.main.path(forResource: "embedded", ofType: "mobileprovision")
        guard let path = profilePath else { return nil }
        return Self.read(from: path)
    }

    private static func read(from profilePath: String) -> Self? {
        guard let plistDataString = try? NSString(
            contentsOfFile: profilePath,
            encoding: String.Encoding.isoLatin1.rawValue
        ) else {
            return nil
        }

        let scanner = Scanner(string: plistDataString as String)
        _ = scanner.scanUpToString("<plist")
        let extractedPlist: NSString? = scanner.scanUpToString("</plist>") as? NSString

        guard let plist = extractedPlist?.appending("</plist>").data(using: .isoLatin1) else { return nil }
        let decoder = PropertyListDecoder()
        do {
            return try decoder.decode(Self.self, from: plist)
        } catch {
            return nil
        }
    }
}
