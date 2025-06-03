import Foundation

@available(iOS 16, *)
extension Duration {
    /// Convert the duration to a time interval.
    /// - Returns: the time interval.
    func timeInterval() -> TimeInterval {
        Double(components.seconds) + Double(components.attoseconds) * 1e-18
    }
}
