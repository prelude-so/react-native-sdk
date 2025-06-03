import ExpoModulesCore

public class PreludeReactNativeSdkModule: Module {
  public func definition() -> ModuleDefinition {
    Name("PreludeReactNativeSdk")

    Events("onDispatchingSignals")

    AsyncFunction("dispatchSignals") { (sdkKey: String, endpointUrl: String?) in
        let endpoint = endpointUrl != nil ? Endpoint.custom(endpointUrl!) : .default
        
        let configuration = Configuration(
            sdkKey: sdkKey,
            endpoint: endpoint
        )

        let prelude = Prelude(configuration)

        do {
            let dispatchID = try await prelude.dispatchSignals()
            self.sendEvent("onDispatchingSignals", ["status": "SUCCESS", "dispatchID": dispatchID])
        } catch {
            self.sendEvent("onDispatchingSignals", ["status": "FAILURE", "dispatchID": error.localizedDescription])
        }
    }
      
    AsyncFunction("verifySilent") { (sdkKey: String, requestUrl: String) in
        if sdkKey.isEmpty || requestUrl.isEmpty {
            throw Exception(name: "IllegalArguments",
                      description: "SDK Key and Request URL must both be provided.",
                      code: "ILLEGAL_ARGUMENTS_EMPTY_FIELD"
            )
        }
        
        let configuration = Configuration(
            sdkKey: sdkKey,
        )

        let prelude = Prelude(configuration)

        guard let url = URL(string: requestUrl) else {
            throw Exception(name: "IllegalArguments",
                      description: "Request URL must be a valid URL.",
                      code: "ILLEGAL_ARGUMENTS_INVALID_URL"
            )
        }
        
        return try await prelude.verifySilent(url: url)
    }
  }
}
