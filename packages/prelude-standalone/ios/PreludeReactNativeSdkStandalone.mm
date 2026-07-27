#import <React/RCTBridgeModule.h>

// Exposes the Swift class to React. On the old architecture this registers a
// legacy bridge module; on the New Architecture it is bridged automatically via
// TurboModule interop (enabled by default in current RN templates). If strict
// first-class TurboModule conformance is required, implement the codegen
// `NativePreludeReactNativeSdkStandaloneSpec` protocol and forward to the Swift
// class here.
@interface RCT_EXTERN_MODULE(PreludeReactNativeSdkStandalone, NSObject)

// The bridge requires NSNumber arguments to be nonnull; the JavaScript layer
// resolves optional numeric configuration to defaults before calling.
RCT_EXTERN_METHOD(dispatchSignals:(NSString *)sdkKey
                  endpoint:(NSString * _Nullable)endpoint
                  timeoutMilliseconds:(nonnull NSNumber *)timeoutMilliseconds
                  implementedFeaturesRawValue:(nonnull NSNumber *)implementedFeaturesRawValue
                  maxRetries:(nonnull NSNumber *)maxRetries
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(verifySilent:(NSString *)sdkKey
                  requestUrl:(NSString *)requestUrl
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

@end
