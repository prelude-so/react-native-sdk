package so.prelude.reactnative.sdk

import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import so.prelude.android.sdk.Configuration
import so.prelude.android.sdk.Configuration.Companion.DEFAULT_REQUEST_TIMEOUT
import so.prelude.android.sdk.Endpoint
import so.prelude.android.sdk.Prelude
import java.net.URL

class PreludeReactNativeSdkModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("PreludeReactNativeSdk")

        AsyncFunction("dispatchSignals") Coroutine { sdkKey: String, endpointUrl: String?, timeoutMilliseconds: Long? ->
            dispatchSignals(endpointUrl, sdkKey, timeoutMilliseconds)
        }

        AsyncFunction("verifySilent") Coroutine { sdkKey: String, requestUrl: String ->
            verifySilent(
                sdkKey = sdkKey,
                requestUrl = requestUrl
            )
        }
    }

    private suspend fun dispatchSignals(
        endpointUrl: String?,
        sdkKey: String,
        timeoutMilliseconds: Long?
    ): String {
        val endpoint: Endpoint = endpointUrl?.let {
            Endpoint.Custom(it)
        } ?: Endpoint.Default

        val context = appContext.reactContext
            ?: throw IllegalStateException(
                "Invalid React Android Context. Cannot dispatch signals"
            )

        val config = Configuration(
            context.applicationContext,
            sdkKey,
            endpoint,
            requestTimeout = timeoutMilliseconds ?: DEFAULT_REQUEST_TIMEOUT
        )
        val prelude = Prelude(config)
                
        return prelude.dispatchSignals().getOrThrow()
    }

    private suspend fun verifySilent(
        sdkKey: String,
        requestUrl: String,
    ): String {
        val context = appContext.reactContext
            ?: throw IllegalStateException(
                "Invalid React Android Context. Cannot perform silent verification"
            )

        if (sdkKey.isBlank() || requestUrl.isBlank()) {
            throw IllegalArgumentException("SDK Key and Request URL must both be provided.")
        }

        val prelude = Prelude(context.applicationContext, sdkKey)

        return prelude.verifySilent(URL(requestUrl)).getOrThrow()
    }
}
