# Change Log

Prelude React Native SDK (Standalone) Change Log

## [0.1.2]

- Update native Android SDK to version 0.6.2. Failed host lookups are now
  retried instead of ending the request.

## [0.1.1]

- Fix Android module registration on the legacy bridge (Old Architecture):
  exported methods were not discovered, so the native module could not be
  resolved from JavaScript.
- Fix a crash when calling `dispatchSignals` without optional configuration on
  the legacy bridge (Old Architecture): null numeric arguments failed native
  argument parsing (requires `@prelude.so/react-native-sdk-shared` 0.1.1).
- Fix iOS legacy bridge rejection of `dispatchSignals`: numeric arguments are
  now `nonnull NSNumber` as the bridge requires, with defaults resolved in the
  JavaScript layer.
- Fix a header collision when consuming the pod with
  `use_frameworks! :linkage => :static`: the vendored
  `PreludeCore.xcframework` headers are no longer compiled as pod sources, so
  its per-slice copies can no longer collide.
- Select the New Architecture when the host app does not define
  `newArchEnabled`, as React Native 0.82 and later no longer do.
- Resolve the native module on first use instead of at import time, and
  report an unlinked module directly rather than as a failed property
  access.
- Document the Android `compileSdkVersion 35` requirement.

## [0.1.0]

- Initial release. Non-Expo React Native SDK exposing `dispatchSignals` and
  `verifySilent` via a backward-compatible TurboModule (New Architecture and
  legacy bridge). Wraps the native Android (`so.prelude.android:sdk`) and Apple
  SDKs; web delegates to `@prelude.so/js-sdk`.
