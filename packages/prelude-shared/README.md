# @prelude.so/react-native-sdk-shared

Shared runtime for the Prelude React Native SDKs. Installed automatically as a
dependency of the public SDK packages; you normally don't add it directly.

Exposes:

- `makeApi(nativeModule)` — builds the public `dispatchSignals` / `verifySilent`
  surface over an injected native module.
- `Features` — the shared feature flags.
- `@prelude.so/react-native-sdk-shared/web` — the `@prelude.so/js-sdk`-backed
  delegate used by each package's `.web` resolver (kept on a separate entry so it
  never enters the native bundle).

Consumed by `@prelude.so/react-native-sdk-standalone` (and, once migrated, the
Expo `@prelude.so/react-native-sdk`).
