import { EventSubscription } from 'expo-modules-core';

import PreludeReactNativeSdkModule from './PreludeReactNativeSdkModule';
import { DispatchingSignalsStatus } from './PreludeReactNativeSdk.types';

export async function dispatchSignals(configuration: { sdk_key: string, endpoint?: string }): Promise<void> {
  return await PreludeReactNativeSdkModule.dispatchSignals(configuration.sdk_key, configuration.endpoint);
}

export function onDispatchingSignals(listener: (event: DispatchingSignalsStatus) => void): EventSubscription {
  return PreludeReactNativeSdkModule.addListener('onDispatchingSignals', listener);
}

export { DispatchingSignalsStatus };
