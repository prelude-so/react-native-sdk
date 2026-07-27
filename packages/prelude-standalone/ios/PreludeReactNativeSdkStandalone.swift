import Foundation
import React

// Prelude Swift symbols (Prelude, Configuration, Endpoint, Features) come from
// the vendored SDK sources compiled into this pod. RCTPromise* block types come
// from React-Core (imported above), pulled in by install_modules_dependencies.
@objc(PreludeReactNativeSdkStandalone)
public class PreludeReactNativeSdkStandalone: NSObject {

  @objc(dispatchSignals:endpoint:timeoutMilliseconds:implementedFeaturesRawValue:maxRetries:resolve:reject:)
  public func dispatchSignals(
    _ sdkKey: String,
    endpoint: String?,
    timeoutMilliseconds: NSNumber,
    implementedFeaturesRawValue: NSNumber,
    maxRetries: NSNumber,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    let endpointValue: Endpoint = endpoint != nil ? .custom(endpoint!) : .default
    let timeout = TimeInterval(truncating: timeoutMilliseconds) / 1000

    let rawFeatures = implementedFeaturesRawValue.int64Value
    let features = Features(rawValue: UInt64(rawFeatures >= 0 ? rawFeatures : 0))

    let configuration = Configuration(
      sdkKey: sdkKey,
      endpoint: endpointValue,
      implementedFeatures: features,
      timeout: timeout,
      maxRetries: maxRetries.intValue
    )

    Task {
      do {
        resolve(try await Prelude(configuration).dispatchSignals())
      } catch {
        reject("PRELUDE_DISPATCH_ERROR", error.localizedDescription, error)
      }
    }
  }

  @objc(verifySilent:requestUrl:resolve:reject:)
  public func verifySilent(
    _ sdkKey: String,
    requestUrl: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    if sdkKey.isEmpty || requestUrl.isEmpty {
      reject("ILLEGAL_ARGUMENTS_EMPTY_FIELD",
             "SDK Key and Request URL must both be provided.", nil)
      return
    }
    guard let url = URL(string: requestUrl) else {
      reject("ILLEGAL_ARGUMENTS_INVALID_URL",
             "Request URL must be a valid URL.", nil)
      return
    }

    let configuration = Configuration(sdkKey: sdkKey)
    Task {
      do {
        resolve(try await Prelude(configuration).verifySilent(url: url))
      } catch {
        reject("PRELUDE_VERIFY_ERROR", error.localizedDescription, error)
      }
    }
  }

  @objc static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
