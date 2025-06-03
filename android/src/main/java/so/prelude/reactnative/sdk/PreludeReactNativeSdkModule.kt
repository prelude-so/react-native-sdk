package so.prelude.reactnative.sdk

import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import so.prelude.android.sdk.Configuration
import so.prelude.android.sdk.Configuration.Companion.DEFAULT_REQUEST_TIMEOUT
import so.prelude.android.sdk.DispatchStatusListener
import so.prelude.android.sdk.Endpoint
import so.prelude.android.sdk.Prelude
import java.net.URL

class PreludeReactNativeSdkModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("PreludeReactNativeSdk")

        Events("onDispatchingSignals")

        AsyncFunction("dispatchSignals") { sdkKey: String, endpointUrl: String?, timeoutMilliseconds: Long? ->
            dispatchSignals(endpointUrl, sdkKey, timeoutMilliseconds)
        }

        AsyncFunction("verifySilent") Coroutine { sdkKey: String, requestUrl: String ->
            verifySilent(
                sdkKey = sdkKey,
                requestUrl = requestUrl
            )
        }
    }

    private fun dispatchSignals(
        endpointUrl: String?,
        sdkKey: String,
        timeoutMilliseconds: Long?
    ): String? {
        val endpoint: Endpoint = endpointUrl?.let {
            Endpoint.Custom(it)
        } ?: Endpoint.Default

        val context = appContext.reactContext
        return context?.let {
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

    private suspend fun verifySilent(
        sdkKey: String,
        requestUrl: String,
    ): String? {
        val context = appContext.reactContext

        if (context == null) {
            throw IllegalStateException(
                "Invalid React Android Context. Cannot perform silent verification"
            )
        }

        if (sdkKey.isBlank() || requestUrl.isBlank()) {
            throw IllegalArgumentException("SDK Key and Request URL must both be provided.")
        }

        val prelude = Prelude(context.applicationContext, sdkKey)

        return prelude.verifySilent(URL(requestUrl)).getOrNull()
    }
}
