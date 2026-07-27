import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

// Codegen spec. Trailing params are optional so callers can omit them; codegen
// maps them to nullable native types. `number` crosses the bridge as a double.
export interface Spec extends TurboModule {
  dispatchSignals(
    sdkKey: string,
    endpoint?: string,
    timeoutMilliseconds?: number,
    implementedFeaturesRawValue?: number,
    maxRetries?: number,
  ): Promise<string>;

  verifySilent(sdkKey: string, requestUrl: string): Promise<string>;
}

let resolved: Spec | undefined;

// Looked up on first call rather than at import time, so an unlinked module
// reports itself here instead of resurfacing later as a property access on
// undefined. Resolution covers the New Architecture and the legacy bridge.
function native(): Spec {
  if (resolved === undefined) {
    resolved =
      TurboModuleRegistry.get<Spec>('PreludeReactNativeSdkStandalone') ??
      undefined;
  }
  if (resolved === undefined) {
    throw new Error(
      'The PreludeReactNativeSdkStandalone native module is not available. ' +
        'Rebuild the app after installing the package: run `pod install` on ' +
        'iOS, or resync Gradle on Android.',
    );
  }
  return resolved;
}

const lazyModule: Spec = {
  dispatchSignals: (...args) => native().dispatchSignals(...args),
  verifySilent: (...args) => native().verifySilent(...args),
};

export default lazyModule;
