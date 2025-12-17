import PreludeReactNativeSdkModule from './PreludeReactNativeSdkModule';

/**
 * Dispatches signals to the Prelude service.
 *
 * @param configuration - Configuration options for dispatching signals
 * @param configuration.sdk_key - Your Prelude SDK key
 * @param configuration.timeout_milliseconds - Optional timeout in milliseconds for the network requests
 * @param configuration.implemented_features - Optional array of implemented features. Required for certain features like Silent Verification
 * @param configuration.max_retries - Optional maximum number of automatic network retries in case of server failures
 * @returns A promise that resolves with the dispatchId result
 */
export async function dispatchSignals(
  configuration: {
    sdk_key: string;
    endpoint?: string;
    timeout_milliseconds?: number;
    implemented_features?: Features[];
    max_retries?: number;
  } = {sdk_key: ''}): Promise<string> {
  return await PreludeReactNativeSdkModule.dispatchSignals(
      configuration.sdk_key,
      configuration.endpoint,
      configuration.timeout_milliseconds,
      toRawValue(configuration.implemented_features || []),
      configuration.max_retries
  );
}

/**
 * Initiates a silent verification process of the user's phone number.
 *  The signals have to be dispatched beforehand using `dispatchSignals` with the `SilentVerification` feature enabled.
 *
 * @param configuration - Configuration options for verification
 * @param configuration.sdk_key - Your Prelude SDK key
 * @param configuration.request_url - The URL to verify
 * @returns A promise that resolves with the verification result
 */
export async function verifySilent(configuration: { sdk_key: string, request_url: string }): Promise<string> {
  return await PreludeReactNativeSdkModule.verifySilent(configuration.sdk_key, configuration.request_url);
}

export enum Features {
  SilentVerification = 1 << 0,
}

function toRawValue(features: Features[]): number {
  return features.reduce((acc, feature) => acc | feature, 0);
}