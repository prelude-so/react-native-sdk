package so.prelude.reactnative.standalone

import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.turbomodule.core.interfaces.TurboModule

// Old Architecture: hand-written base mirroring the codegen spec. Implementing
// TurboModule makes the bridge read @ReactMethod annotations from this class;
// annotations are not inherited, so concrete overrides would expose nothing.
abstract class PreludeReactNativeSdkStandaloneSpec(context: ReactApplicationContext) :
  ReactContextBaseJavaModule(context),
  TurboModule {

  @ReactMethod
  @DoNotStrip
  abstract fun dispatchSignals(
    sdkKey: String,
    endpoint: String?,
    timeoutMilliseconds: Double?,
    implementedFeaturesRawValue: Double?,
    maxRetries: Double?,
    promise: Promise,
  )

  @ReactMethod
  @DoNotStrip
  abstract fun verifySilent(sdkKey: String, requestUrl: String, promise: Promise)
}
