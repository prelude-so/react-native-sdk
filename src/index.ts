import PreludeReactNativeSdkModule from './PreludeReactNativeSdkModule';

export async function dispatchSignals(
  configuration: {
    sdk_key: string;
    endpoint?: string;
    timeout_milliseconds?: number;
    implemented_features?: Features[];
  } = {sdk_key: ''}): Promise<string> {
  return await PreludeReactNativeSdkModule.dispatchSignals(
      configuration.sdk_key,
      configuration.endpoint,
      configuration.timeout_milliseconds,
      toRawValue(configuration.implemented_features || []),
  );
}

export async function verifySilent(configuration: { sdk_key: string, request_url: string }): Promise<string> {
  return await PreludeReactNativeSdkModule.verifySilent(configuration.sdk_key, configuration.request_url);
}

export enum Features {
  SilentVerification = 1 << 0,
}

function toRawValue(features: Features[]): number {
  return features.reduce((acc, feature) => acc | feature, 0);
}