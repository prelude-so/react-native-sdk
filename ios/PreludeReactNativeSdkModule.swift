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
  }
}
