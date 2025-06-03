import Foundation
import Network

/// Request is a network HTTP request.
struct Request {
    private var url: URL

    private var method: String

    private var headers: [String: String]

    private var body: Data?

    private var followRedirects: Bool = false

    private var maxRedirects: Int = 20

    private var interfaceType: NWInterface.InterfaceType = .other

    private var timeout: TimeInterval = 2.0

    private var maxRetries: Int = 0

    private var retryAttempt: Int = 0

    /// Create a new network HTTP request.
    /// - Parameters:
    ///   - url: the request URL.
    ///   - method: the request method.
    init(_ url: URL, method: String = "GET") {
        self.url = url
        self.method = method
        headers = [:]
    }
}

extension Request {
    /// Set the request body.
    /// - Parameter data: the body data.
    mutating func body(_ data: Data) {
        body = data
    }

    /// Set the follow redirects flag.
    /// - Parameter state: the state of the flag.
    mutating func followRedirects(_ state: Bool) {
        followRedirects = state
    }

    /// Set a header key and value pair.
    /// - Parameters:
    ///   - key: the header key.
    ///   - value: the header value.
    mutating func header(_ key: String, _ value: String) {
        headers[key] = value
    }

    /// Set the interface type for the request.
    /// - Parameter type: the interface type.
    mutating func interfaceType(_ type: NWInterface.InterfaceType) {
        interfaceType = type
    }

    /// Set the timeout for the request.
    /// - Parameter timeout: the time interval.
    mutating func timeout(_ timeout: TimeInterval) {
        self.timeout = timeout
    }

    /// Set the max number of automatic retries in case of a timeout or server error.
    /// - Parameter maxRetries: the maximum number of retries.
    mutating func maxRetries(_ maxRetries: Int) {
        self.maxRetries = maxRetries
    }

    private func clone(maxRedirects: Int? = nil, retryAttempt: Int? = nil) -> Request {
        var request = Request(url, method: method)
        request.headers = headers
        request.followRedirects = followRedirects
        request.maxRedirects = maxRedirects ?? self.maxRedirects
        request.interfaceType = interfaceType
        request.timeout = timeout
        request.maxRetries = maxRetries
        request.retryAttempt = retryAttempt ?? self.retryAttempt
        return request
    }

    /// Send the HTTP request.
    /// - Parameter completion: the send completion handler.
    func send() async throws -> Data? {
        guard let host = url.host else {
            throw SDKError.internalError("missing URL host")
        }

        let parameters = NWParameters(tls: .init())
        parameters.preferNoProxies = true
        parameters.requiredInterfaceType = interfaceType

        let request = CFHTTPMessageCreateRequest(
            nil,
            method as CFString,
            url as CFURL,
            kCFHTTPVersion1_1
        ).takeRetainedValue()

        CFHTTPMessageSetHeaderFieldValue(request,
                                         "Host" as CFString,
                                         host as CFString)
        CFHTTPMessageSetHeaderFieldValue(request,
                                         "X-SDK-Request-Date" as CFString,
                                         ISO8601DateFormatter().string(from: Date()) as CFString)
        for (key, value) in headers {
            CFHTTPMessageSetHeaderFieldValue(request, key as CFString, value as CFString)
        }

        if let body {
            CFHTTPMessageSetHeaderFieldValue(
                request,
                "Content-Length" as CFString,
                String(body.count) as CFString
            )

            CFHTTPMessageSetBody(request, body as CFData)
        }

        guard let message = CFHTTPMessageCopySerializedMessage(request)?.takeRetainedValue() else {
            throw SDKError.internalError("cannot copy HTTP message")
        }

        let connection = NWConnection(to: NWEndpoint.url(url), using: parameters)
        let timer = deadline(for: connection, timeout: timeout)

        connection.stateUpdateHandler = { state in
            switch state {
            case .cancelled:
                timer.cancel()
            case .ready:
                connection.send(content: message as Data,
                                isComplete: true,
                                completion: .idempotent)
            default:
                break
            }
        }

        connection.start(queue: .connection)

        return try await withCheckedThrowingContinuation { continuation in
            connection.receiveMessage { content, _, isComplete, error in
                timer.cancel()

                if let error {
                    if isTimeoutError(error) {
                        self.handleRetry(continuation: continuation)
                    } else {
                        continuation.resume(throwing: SDKError.requestError(error.localizedDescription))
                    }
                    return
                }

                guard isComplete else {
                    continuation.resume(throwing: SDKError.requestError("Invalid HTTP response."))
                    return
                }

                if let content {
                    let response = CFHTTPMessageCreateEmpty(nil, false).takeRetainedValue()

                    _ = content.withUnsafeBytes { buf in
                        CFHTTPMessageAppendBytes(response,
                                                 buf.baseAddress!.assumingMemoryBound(to: UInt8.self),
                                                 buf.count)
                    }

                    switch parseHTTPMessage(response) {
                    case let .retryable(status):
                        self.handleRetry(continuation: continuation)

                    case let .failure(status):
                        continuation.resume(throwing: SDKError.requestError("HTTP server error: \(status)"))

                    case let .redirect(method, url):
                        if !self.followRedirects || self.maxRedirects == 0 {
                            continuation.resume(returning: nil)
                        } else {
                            var request = self.clone(maxRedirects: self.maxRedirects - 1)
                            Task {
                                do {
                                    let redirectResult = try await request.send()
                                    continuation.resume(returning: redirectResult)
                                } catch {
                                    continuation.resume(throwing: error)
                                }
                            }
                        }

                    case let .success(data):
                        continuation.resume(returning: data)
                    }
                } else {
                    continuation.resume(returning: nil)
                }
            }
        }
    }

    private func isTimeoutError(_ error: NWError) -> Bool {
        error.localizedDescription.contains("Operation canceled")
    }

    private func handleRetry(continuation: CheckedContinuation<Data?, Error>) {
        if maxRetries > 0, retryAttempt <= maxRetries {
            Task {
                let requestDelay = pow(2.0, Double(self.retryAttempt)) * 0.25
                let totalDelay = min(requestDelay, 10.0) // Cap at 10 seconds

                do {
                    try await Task.sleep(nanoseconds: UInt64(totalDelay * 1_000_000_000))

                    let result = try await self.clone(retryAttempt: self.retryAttempt + 1).send()
                    continuation.resume(returning: result)
                } catch {
                    continuation.resume(throwing: error)
                }
            }
        } else {
            continuation.resume(throwing: SDKError.requestError("Max retries reached"))
        }
    }

    private func deadline(for connection: NWConnection, timeout: TimeInterval) -> any DispatchSourceTimer {
        let timer = DispatchSource.makeTimerSource(queue: .deadline)
        timer.schedule(deadline: .now() + timeout)
        timer.setEventHandler { connection.cancel() }
        timer.resume()

        return timer
    }

    enum ParseHTTPMessageResult {
        case failure(Int)
        case redirect(String, URL)
        case retryable(Int)
        case success(Data?)
    }

    private func parseHTTPMessage(_ message: CFHTTPMessage) -> ParseHTTPMessageResult {
        let status = CFHTTPMessageGetResponseStatusCode(message)

        switch status {
        case 200 ..< 300:
            return .success(CFHTTPMessageCopyBody(message)?.takeRetainedValue() as? Data)

        case 300 ... 303, 307, 308:
            guard let location = CFHTTPMessageCopyHeaderFieldValue(message, "Location" as CFString)?
                .takeRetainedValue() as? String, let url = URL(string: location) else {
                return .failure(status)
            }
            return .redirect((307 ... 308).contains(status) ? method : "GET", url)

        case 500 ..< 600:
            return .retryable(status)

        default:
            return .failure(status)
        }
    }
}

extension DispatchQueue {
    static var connection = DispatchQueue(
        label: "so.prelude.connection.queue",
        qos: .default
    )

    static var deadline = DispatchQueue(
        label: "so.prelude.deadline.queue",
        qos: .background
    )
}
