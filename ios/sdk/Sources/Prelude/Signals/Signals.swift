import Foundation
import Network

protocol CollectableFamily: Hashable {
    static func collect() -> Self
}

extension Signals {
    init() {
        id = dispatchId()
        timestamp = Date()
        application = Application.collect()
        device = Device.collect()
        hardware = Hardware.collect()
        network = Network.collect()
    }
}

public enum SignalsScope {
    case full, silentVerification
}

extension Prelude {
    /// Collect and dispatch signals to the Prelude API, relying on the default 2 seconds timeout.
    /// - Parameter scope: signals data gathering scope.
    public func dispatchSignals(
        scope: SignalsScope = .full
    ) async throws -> String {
        try await dispatchSignals(
            scope: scope,
            timeout: configuration.timeout,
            maxRetries: configuration.maxRetries
        )
    }

    /// Collect and dispatch signals to the Prelude API, relying on the default 2 seconds timeout. It then
    /// calls the completion handler with the result.
    /// - Parameter scope: signals data gathering scope.
    /// - Parameter completion: the completion handler.
    public func dispatchSignals(
        scope: SignalsScope = .full,
        completion: @escaping (Result<String, Error>) -> Void
    ) throws {
        Task {
            do {
                try await completion(.success(dispatchSignals(scope: scope)))
            } catch {
                completion(.failure(error))
            }
        }
    }

    /// Collect and dispatch signals to the Prelude API.
    /// - Parameter scope: signals data gathering scope.
    /// - Parameter timeout: timeout for the dispatch operation HTTP requests.
    @available(iOS 16, *)
    public func dispatchSignals(
        scope: SignalsScope = .full,
        timeout: Duration
    ) async throws -> String {
        try await dispatchSignals(
            scope: scope,
            timeout: timeout.timeInterval(),
            maxRetries: configuration.maxRetries,
        )
    }

    /// Collect and dispatch signals to the Prelude API. It then calls the completion handler with the result.
    /// - Parameter scope: signals data gathering scope.
    /// - Parameter timeout: timeout for the dispatch operation HTTP requests.
    /// - Parameter completion: the completion handler.
    @available(iOS 16, *)
    public func dispatchSignals(
        scope: SignalsScope = .full,
        timeout: Duration,
        completion: @escaping (Result<String, Error>) -> Void
    ) throws {
        Task {
            do {
                try await completion(.success(
                    dispatchSignals(
                        scope: scope,
                        timeout: timeout.timeInterval(),
                        maxRetries: self.configuration.maxRetries,
                    ),
                ))
            } catch {
                completion(.failure(error))
            }
        }
    }

    /// Collect and dispatch signals to the Prelude API.
    /// - Parameter scope: signals data gathering scope.
    /// - Parameter timeout: timeout for the dispatch operation HTTP requests.
    /// - Parameter maxRetries: maximum number of automatic network retries in case of server error or timeout.
    public func dispatchSignals(
        scope: SignalsScope = .full,
        timeout: TimeInterval,
        maxRetries: Int,
    ) async throws -> String {
        guard let endpointURL = URL(string: configuration.endpointAddress) else {
            throw SDKError.configurationError("cannot parse dispatch URL")
        }

        let signals = Signals()
        let payload = generatePayload(signals: signals, secret: retrieveTeamId())
        let userAgent = buildUserAgent()
        let availableNetworks = await AvailableNetworks.read()

        try await withThrowingTaskGroup(of: Void.self) { group in
            switch availableNetworks {
            case .none:
                throw SDKError.requestError("there are no available network interfaces to report the signals.")
            case .lanAndCellular:
                addNetworkTask(
                    group: &group,
                    sdkKey: configuration.sdkKey,
                    endpointURL: endpointURL,
                    userAgent: userAgent,
                    dispatchId: signals.id,
                    timeout: timeout,
                    maxRetries: maxRetries,
                    interfaceType: .cellular
                )
                if scope == .full {
                    addNetworkTask(
                        group: &group,
                        sdkKey: configuration.sdkKey,
                        endpointURL: endpointURL,
                        userAgent: userAgent,
                        dispatchId: signals.id,
                        timeout: timeout,
                        maxRetries: maxRetries,
                        payload: payload
                    )
                }
            case .onlyLan, .onlyCellular:
                addNetworkTask(
                    group: &group,
                    sdkKey: configuration.sdkKey,
                    endpointURL: endpointURL,
                    userAgent: userAgent,
                    dispatchId: signals.id,
                    timeout: timeout,
                    maxRetries: maxRetries,
                    payload: scope == .full ? payload : nil
                )
            }

            do {
                try await group.waitForAll()
            } catch {
                throw SDKError.requestError("one or more requests failed to execute: \(error)")
            }
        }

        return signals.id
    }

    /// Collect and dispatch signals to the Prelude API. It then calls the completion handler with the result.
    /// - Parameter scope: signals data gathering scope.
    /// - Parameter timeout: timeout for the dispatch operation HTTP requests.
    /// - Parameter completion: the completion handler.
    public func dispatchSignals(
        scope: SignalsScope = .full,
        timeout: TimeInterval,
        maxRetries: Int,
        completion: @escaping (Result<String, Error>) -> Void
    ) throws {
        Task {
            do {
                try await completion(.success(dispatchSignals(scope: scope, timeout: timeout, maxRetries: maxRetries)))
            } catch {
                completion(.failure(error))
            }
        }
    }

    private func addNetworkTask(
        group: inout ThrowingTaskGroup<Void, any Error>,
        sdkKey: String,
        endpointURL: URL,
        userAgent: String,
        dispatchId: String,
        timeout: TimeInterval,
        maxRetries: Int,
        interfaceType: NWInterface.InterfaceType? = nil,
        payload: Data? = nil
    ) {
        group.addTask {
            var request = Request(
                endpointURL.appendingPathComponent("/v1/signals"),
                method: payload != nil ? "POST" : "OPTIONS"
            )
            request.header("Connection", "close")
            request.header("User-Agent", userAgent)
            request.header("X-SDK-DispatchID", dispatchId)
            request.header("X-SDK-Key", sdkKey)
            if let interfaceType {
                request.interfaceType(interfaceType)
            }
            if let payload {
                request.header("Content-Encoding", "deflate")
                request.header("Content-Type", "application/vnd.prelude.signals")
                request.body(payload)
            }
            request.timeout(timeout)
            request.maxRetries(maxRetries)

            _ = try await request.send()
        }
    }
}
