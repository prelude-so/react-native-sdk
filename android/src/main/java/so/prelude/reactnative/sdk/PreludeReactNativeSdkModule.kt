package so.prelude.reactnative.sdk

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import so.prelude.android.sdk.Configuration
import so.prelude.android.sdk.Configuration.Companion.DEFAULT_REQUEST_TIMEOUT
import so.prelude.android.sdk.DispatchStatusListener
import so.prelude.android.sdk.Endpoint
import so.prelude.android.sdk.Prelude

class PreludeReactNativeSdkModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("PreludeReactNativeSdk")

        Events("onDispatchingSignals")

        AsyncFunction("dispatchSignals") { sdkKey: String, endpointUrl: String?, timeoutMilliseconds: Long? ->

            val endpoint: Endpoint = endpointUrl?.let {
                Endpoint.Custom(it)
            } ?: Endpoint.Default

            val context = appContext.reactContext
            context?.let {
                Prelude(
                    Configuration(
                        it.applicationContext,
                        sdkKey,
                        endpoint,
                        requestTimeout = timeoutMilliseconds ?: DEFAULT_REQUEST_TIMEOUT
                    )
                )
                    .dispatchSignals { status: DispatchStatusListener.Status, dispatchId ->
                        sendEvent(
                            "onDispatchingSignals", mapOf(
                                "status" to status,
                                "dispatchID" to dispatchId
                            )
                        )
                    }
            }
        }
    }
}
