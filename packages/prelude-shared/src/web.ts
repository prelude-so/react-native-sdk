import {
  dispatchSignals as jsDispatchSignals,
  performSilentVerification,
  Features as JsFeatures,
} from "@prelude.so/js-sdk";
import type { PreludeNativeModule } from "./nativeModule";

// Web delegate: satisfies PreludeNativeModule by forwarding to @prelude.so/js-sdk.
// Imported only from the `.web` resolver, so it never reaches the native
// (iOS/Android) bundle.
//
// Note: `timeoutMilliseconds` and `maxRetries` are accepted for API parity but
// are no-ops on web — the JS SDK uses its own defaults.

const ALL_FEATURES: JsFeatures[] = [JsFeatures.SilentVerification];

function fromRawValue(raw?: number | null): JsFeatures[] {
  if (!raw) return [];
  return ALL_FEATURES.filter((f) => (raw & f) !== 0);
}

const webNativeModule: PreludeNativeModule = {
  async dispatchSignals(
    sdkKey: string,
    endpoint?: string,
    _timeoutMilliseconds?: number,
    implementedFeaturesRawValue?: number,
    _maxRetries?: number,
  ): Promise<string> {
    return jsDispatchSignals(sdkKey, {
      url: endpoint,
      implementedFeatures: fromRawValue(implementedFeaturesRawValue),
    });
  },

  async verifySilent(sdkKey: string, requestUrl: string): Promise<string> {
    if (!sdkKey || !requestUrl) {
      throw new Error("SDK Key and Request URL must both be provided.");
    }
    return performSilentVerification(requestUrl);
  },
};

export default webNativeModule;
