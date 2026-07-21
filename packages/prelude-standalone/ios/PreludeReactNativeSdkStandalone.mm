#import <React/RCTBridgeModule.h>

// Exposes the Swift class to React. On the old architecture this registers a
// legacy bridge module; on the New Architecture it is bridged automatically via
// TurboModule interop (enabled by default in current RN templates). If strict
// first-class TurboModule conformance is required, implement the codegen
// `NativePreludeReactNativeSdkStandaloneSpec` protocol and forward to the Swift
// class here.
@interface RCT_EXTERN_MODULE(PreludeReactNativeSdkStandalone, NSObject)

RCT_EXTERN_METHOD(dispatchSignals:(NSString *)sdkKey
                  endpoint:(NSString * _Nullable)endpoint
                  timeoutMilliseconds:(NSNumber * _Nullable)timeoutMilliseconds
                  implementedFeaturesRawValue:(NSNumber * _Nullable)implementedFeaturesRawValue
                  maxRetries:(NSNumber * _Nullable)maxRetries
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(verifySilent:(NSString *)sdkKey
                  requestUrl:(NSString *)requestUrl
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

@end
