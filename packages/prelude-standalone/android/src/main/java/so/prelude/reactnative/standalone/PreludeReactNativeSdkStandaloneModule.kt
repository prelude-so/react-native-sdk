package so.prelude.reactnative.standalone

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import so.prelude.android.sdk.Configuration
import so.prelude.android.sdk.Endpoint
import so.prelude.android.sdk.Features
import so.prelude.android.sdk.Prelude
import java.net.URL

@ReactModule(name = PreludeReactNativeSdkStandaloneModule.NAME)
class PreludeReactNativeSdkStandaloneModule(private val reactContext: ReactApplicationContext) :
  PreludeReactNativeSdkStandaloneSpec(reactContext) {

  private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

  override fun getName(): String = NAME

  override fun dispatchSignals(
    sdkKey: String,
    endpoint: String?,
    timeoutMilliseconds: Double?,
    implementedFeaturesRawValue: Double?,
    maxRetries: Double?,
    promise: Promise,
  ) {
    scope.launch {
      try {
        val resolvedEndpoint =
          endpoint?.let { Endpoint.Custom(address = it) } ?: Endpoint.Default
        val config = Configuration(
          context = reactContext.applicationContext,
          sdkKey = sdkKey,
          endpoint = resolvedEndpoint,
          requestTimeout = timeoutMilliseconds?.toLong() ?: 10000L,
          implementedFeatures = Features.fromRawValue(implementedFeaturesRawValue?.toLong() ?: 0L),
          maxRetries = maxRetries?.toInt() ?: 3,
        )
        promise.resolve(Prelude(config).dispatchSignals().getOrThrow())
      } catch (e: Throwable) {
        promise.reject("PRELUDE_DISPATCH_ERROR", e.message, e)
      }
    }
  }

  override fun verifySilent(sdkKey: String, requestUrl: String, promise: Promise) {
    scope.launch {
      try {
        if (sdkKey.isBlank() || requestUrl.isBlank()) {
          throw IllegalArgumentException("SDK Key and Request URL must both be provided.")
        }
        val prelude = Prelude(reactContext.applicationContext, sdkKey)
        promise.resolve(prelude.verifySilent(URL(requestUrl)).getOrThrow())
      } catch (e: Throwable) {
        promise.reject("PRELUDE_VERIFY_ERROR", e.message, e)
      }
    }
  }

  override fun invalidate() {
    scope.cancel()
    super.invalidate()
  }

  companion object {
    const val NAME = "PreludeReactNativeSdkStandalone"
  }
}
