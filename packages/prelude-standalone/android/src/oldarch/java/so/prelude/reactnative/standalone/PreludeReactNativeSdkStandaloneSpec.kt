package so.prelude.reactnative.standalone

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

// Old Architecture: hand-written base mirroring the codegen spec.
abstract class PreludeReactNativeSdkStandaloneSpec(context: ReactApplicationContext) :
  ReactContextBaseJavaModule(context) {

  @ReactMethod
  abstract fun dispatchSignals(
    sdkKey: String,
    endpoint: String?,
    timeoutMilliseconds: Double?,
    implementedFeaturesRawValue: Double?,
    maxRetries: Double?,
    promise: Promise,
  )

  @ReactMethod
  abstract fun verifySilent(sdkKey: String, requestUrl: String, promise: Promise)
}
