import {
  dispatchSignals as jsDispatchSignals,
  performSilentVerification,
  Features as JsFeatures,
} from "@prelude.so/js-sdk";

// Web implementation of the Prelude RN SDK native module. Expo's bundler
// resolves this file (`.web.ts`) on web targets; the matching
// `PreludeReactNativeSdkModule.ts` keeps handling iOS/Android via JSI.
//
// Note: `timeoutMilliseconds` and `maxRetries` are accepted for API parity
// but are no-ops on web — @prelude.so/js-sdk uses its own defaults.

const ALL_FEATURES: JsFeatures[] = [JsFeatures.SilentVerification];

function fromRawValue(raw?: number | null): JsFeatures[] {
  if (!raw) return [];
  return ALL_FEATURES.filter((f) => (raw & f) !== 0);
}

export default {
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
