import ExpoModulesCore

public class PreludeReactNativeSdkModule: Module {
    public func definition() -> ModuleDefinition {
        Name("PreludeReactNativeSdk")

        AsyncFunction("dispatchSignals") { (sdkKey: String, endpointUrl: String?, timeoutMilliseconds: Int64?, implementedFeaturesRawValue: Int64?, maxRetries: Int?) in
            let endpoint = endpointUrl != nil ? Endpoint.custom(endpointUrl!) : .default
            let timeout = timeoutMilliseconds != nil ? TimeInterval(timeoutMilliseconds!) / 1000 : 10.0

            let implementedFeatures: Features
            if let rawValue = implementedFeaturesRawValue {
                let uintRawValue = rawValue >= 0 ? rawValue : 0
                implementedFeatures = Features(rawValue: UInt64(uintRawValue))
            } else {
                implementedFeatures = []
            }
            let maxRetries = maxRetries ?? 3

            let configuration = Configuration(
                sdkKey: sdkKey,
                endpoint: endpoint,
                implementedFeatures: implementedFeatures,
                timeout: timeout,
                maxRetries: maxRetries
            )

            let prelude = Prelude(configuration)

            return try await prelude.dispatchSignals()
        }

        AsyncFunction("verifySilent") { (sdkKey: String, requestUrl: String) in
            if sdkKey.isEmpty || requestUrl.isEmpty {
                throw Exception(name: "IllegalArguments",
                                description: "SDK Key and Request URL must both be provided.",
                                code: "ILLEGAL_ARGUMENTS_EMPTY_FIELD")
            }

            let configuration = Configuration(
                sdkKey: sdkKey
            )

            let prelude = Prelude(configuration)

            guard let url = URL(string: requestUrl) else {
                throw Exception(name: "IllegalArguments",
                                description: "Request URL must be a valid URL.",
                                code: "ILLEGAL_ARGUMENTS_INVALID_URL")
            }

            return try await prelude.verifySilent(url: url)
        }
    }
}
