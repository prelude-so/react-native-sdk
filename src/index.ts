import PreludeReactNativeSdkModule from './PreludeReactNativeSdkModule';

export async function dispatchSignals(
  configuration: {
    sdk_key: string;
    endpoint?: string;
    timeout_milliseconds?: number;
  }): Promise<string> {
  return await PreludeReactNativeSdkModule.dispatchSignals(configuration.sdk_key, configuration.endpoint, configuration.timeout_milliseconds);
}

export async function verifySilent(configuration: { sdk_key: string, request_url: string }): Promise<string> {
  return await PreludeReactNativeSdkModule.verifySilent(configuration.sdk_key, configuration.request_url);
}
