import Foundation

extension Prelude {
    /// Perform silent phone number verification towards the cellular carrier's network, relying on the
    /// default 10 seconds timeout.
    /// - Parameter url: the request URL received from the back-end server.
    /// - Returns: a string representing the check code to send back to the back-end server.
    public func verifySilent(
        url: URL
    ) async throws -> String {
        try await verifySilent(url: url, timeout: 10.0)
    }

    /// Perform silent phone number verification towards the cellular carrier's network.
    /// - Parameter url: the request URL received from the back-end server.
    /// - Parameter timeout: timeout for the dispatch operation HTTP requests.
    /// - Returns: a string representing the check code to send back to the back-end server.
    public func verifySilent(
        url: URL,
        timeout: TimeInterval
    ) async throws -> String {
        var request = Request(url, method: "GET")
        request.header("Connection", "close")
        request.header("User-Agent", buildUserAgent())
        request.followRedirects(true)
        request.interfaceType(.cellular)
        request.timeout(timeout)

        let data = try? await request.send()
        guard let data,
              let code = String(data: data, encoding: .utf8) else {
            throw SDKError.requestError("failed to execute silent verification request")
        }

        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase

        let response = try? decoder.decode(SilentCompleteResponse.self, from: data)
        guard let code = response?.code else {
            throw SDKError.requestError("failed to retrieve code from silent verification request")
        }

        return code
    }

    /// Perform silent phone number verification towards the cellular carrier's network.
    /// - Parameter url: the request URL received from the back-end server.
    /// - Parameter timeout: timeout for the dispatch operation HTTP requests.
    /// - Parameter completion: the completion handler.
    public func verifySilent(
        url: URL,
        timeout: TimeInterval = 10.0,
        completion: @escaping (Result<String, Error>) -> Void
    ) {
        Task {
            do {
                try await completion(.success(verifySilent(url: url, timeout: timeout)))
            } catch {
                completion(.failure(error))
            }
        }
    }

    /// Perform silent phone number verification towards the cellular carrier's network.
    /// - Parameter url: the request URL received from the back-end server.
    /// - Parameter timeout: timeout for the dispatch operation HTTP requests.
    /// - Returns: a string representing the check code to send back to the back-end server.
    @available(iOS 16, *)
    public func verifySilent(
        url: URL,
        timeout: Duration
    ) async throws -> String {
        try await verifySilent(url: url, timeout: timeout.timeInterval())
    }

    /// Perform silent phone number verification towards the cellular carrier's network.
    /// - Parameter url: the request URL received from the back-end server.
    /// - Parameter timeout: timeout for the dispatch operation HTTP requests.
    /// - Parameter completion: the completion handler.
    @available(iOS 16, *)
    public func verifySilent(
        url: URL,
        timeout: Duration = .seconds(10),
        completion: @escaping (Result<String, Error>) -> Void
    ) {
        Task {
            do {
                try await completion(.success(verifySilent(url: url, timeout: timeout.timeInterval())))
            } catch {
                completion(.failure(error))
            }
        }
    }
}

struct SilentCompleteResponse: Decodable {
    var code: String
}
