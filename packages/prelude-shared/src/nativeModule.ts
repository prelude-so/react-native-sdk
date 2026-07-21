// Shape of the native module injected into `makeApi`.
// Implemented natively (iOS/Android) or by the web delegate.
export interface PreludeNativeModule {
  dispatchSignals(
    sdkKey: string,
    endpoint?: string,
    timeoutMilliseconds?: number,
    implementedFeaturesRawValue?: number,
    maxRetries?: number,
  ): Promise<string>;

  verifySilent(sdkKey: string, requestUrl: string): Promise<string>;
}
