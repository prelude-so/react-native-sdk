import Foundation

extension Date {
    /// Format the date in RFC 3339 format.
    /// - Returns: the formatted date string.
    func RFC3339Format() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
        formatter.timeZone = TimeZone(secondsFromGMT: 0)

        return formatter.string(from: self)
    }
}
