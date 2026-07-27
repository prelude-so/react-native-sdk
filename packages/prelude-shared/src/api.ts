import type { PreludeNativeModule } from './nativeModule';
import { Features, toRawValue } from './features';

// The legacy bridge cannot parse null numeric arguments, so optional numbers
// always cross the bridge resolved to their documented defaults.
const DEFAULT_TIMEOUT_MILLISECONDS = 10000;
const DEFAULT_MAX_RETRIES = 3;

/**
 * Builds the public SDK surface over an injected native module. Each platform
 * supplies its own resolver: the native module on iOS/Android, and the
 * `@prelude.so/js-sdk`-backed delegate on web.
 */
export function makeApi(native: PreludeNativeModule) {
  /**
   * Dispatches signals to the Prelude service.
   *
   * @param configuration.sdk_key - Your Prelude SDK key
   * @param configuration.endpoint - Optional endpoint override (no trailing slash)
   * @param configuration.timeout_milliseconds - Optional per-request timeout in milliseconds
   * @param configuration.implemented_features - Optional implemented features (e.g. Silent Verification)
   * @param configuration.max_retries - Optional max automatic network retries
   * @returns A promise that resolves with the dispatch identifier
   */
  async function dispatchSignals(
    configuration: {
      sdk_key: string;
      endpoint?: string;
      timeout_milliseconds?: number;
      implemented_features?: Features[];
      max_retries?: number;
    } = { sdk_key: '' },
  ): Promise<string> {
    return native.dispatchSignals(
      configuration.sdk_key,
      configuration.endpoint,
      configuration.timeout_milliseconds ?? DEFAULT_TIMEOUT_MILLISECONDS,
      toRawValue(configuration.implemented_features || []),
      configuration.max_retries ?? DEFAULT_MAX_RETRIES,
    );
  }

  /**
   * Initiates silent verification of the user's phone number. Signals must be
   * dispatched beforehand with the `SilentVerification` feature enabled.
   *
   * @param configuration.sdk_key - Your Prelude SDK key
   * @param configuration.request_url - The URL to verify
   * @returns A promise that resolves with the verification result
   */
  async function verifySilent(configuration: {
    sdk_key: string;
    request_url: string;
  }): Promise<string> {
    return native.verifySilent(configuration.sdk_key, configuration.request_url);
  }

  return { dispatchSignals, verifySilent };
}
