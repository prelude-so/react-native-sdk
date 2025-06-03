import Foundation

extension String {
    /// Drop a given prefix from the string.
    /// - Parameter prefix: the prefix to drop.
    /// - Returns: the string without the prefix.
    func dropPrefix(_ prefix: String) -> String {
        guard hasPrefix(prefix) else {
            return self
        }

        return String(dropFirst(prefix.count))
    }
}
