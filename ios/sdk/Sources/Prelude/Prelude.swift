import Foundation

/// Prelude is the main entrypoint to the Prelude SDK.
public struct Prelude {
    /// The configuration for the Prelude SDK instance.
    var configuration: Configuration

    /// Initialize the Prelude SDK.
    /// - Parameter configuration: the configuration for the Prelude SDK instance.
    public init(_ configuration: Configuration) {
        self.configuration = configuration
    }

    /// Initialize the Prelude SDK.
    /// - Parameter sdkKey: the SDK key. (Note: you can get one from the Prelude Dashboard)
    public init(sdkKey: String) {
        configuration = Configuration(sdkKey: sdkKey)
    }
}
