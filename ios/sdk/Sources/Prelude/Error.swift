import Foundation

/// SDKError is the error type for the Prelude SDK.
public enum SDKError: Error {
    /// A configuration error.
    case configurationError(String)

    /// An internal error.
    case internalError(String)

    /// A request error.
    case requestError(String)

    /// A system error.
    case systemError(String)
}
