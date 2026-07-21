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

// getEnforcing resolves the TurboModule on the New Architecture and falls back
// to the legacy bridge module on the old one.
export default TurboModuleRegistry.getEnforcing<Spec>(
  'PreludeReactNativeSdkStandalone',
);
