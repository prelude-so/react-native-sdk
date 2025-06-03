import Foundation

/// Sysctl is a namespace for system control information.
enum Sysctl {
    /// Get string value for a given set of keys.
    /// - Parameter keys: the keys to query.
    /// - Returns: the string value, if any.
    public static func string(for keys: [Int32]) throws -> String? {
        try data(for: keys).withUnsafeBufferPointer { pointer -> String? in
            pointer.baseAddress.flatMap { String(validatingUTF8: $0) }
        }
    }

    /// Get value for a given set of keys.
    /// - Parameters:
    ///   - to: the type of the value.
    ///   - keys: the keys to query.
    /// - Returns: the value, if any.
    public static func value<T>(to _: T.Type, for keys: [Int32]) throws -> T? {
        try data(for: keys).withUnsafeBufferPointer { pointer -> T? in
            pointer.baseAddress?.withMemoryRebound(to: T.self, capacity: 1) { $0.pointee }
        }
    }

    private static func data(for keys: [Int32]) throws -> [Int8] {
        try keys.withUnsafeBufferPointer { keysPointer throws -> [Int8] in
            let keysCount = UInt32(keys.count)

            var size = 0

            var errno = Darwin.sysctl(UnsafeMutablePointer<Int32>(mutating: keysPointer.baseAddress),
                                      keysCount, nil, &size, nil, 0)
            guard errno == ERR_SUCCESS else {
                throw SDKError.systemError("Cannot execute preflight sysctl call")
            }

            let data = [Int8](repeating: 0, count: size)

            errno = data.withUnsafeBufferPointer { dataPointer -> Int32 in
                Darwin.sysctl(UnsafeMutablePointer<Int32>(mutating: keysPointer.baseAddress),
                              keysCount, UnsafeMutableRawPointer(mutating: dataPointer.baseAddress),
                              &size, nil, 0)
            }
            guard errno == ERR_SUCCESS else {
                throw SDKError.systemError("Cannot execute sysctl call")
            }

            return data
        }
    }
}
