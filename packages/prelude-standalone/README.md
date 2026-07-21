# @prelude.so/react-native-sdk-standalone

Prelude React Native SDK with **no Expo dependency**. Same API as
`@prelude.so/react-native-sdk`, delivered as a plain React Native native module
(backward-compatible TurboModule) for apps that don't use Expo.

Which package do I install?

- Using Expo (managed or bare with Expo modules) → `@prelude.so/react-native-sdk`.
- Plain React Native, no Expo → this package.
- Web is identical in both (delegates to `@prelude.so/js-sdk`).

## Install

```
npm install @prelude.so/react-native-sdk-standalone
```

The RN Community CLI autolinks the native module. Rebuild after install
(`pod install` for iOS, gradle sync for Android). Android requires
`minSdkVersion 26`.

## Usage

```typescript
import * as Prelude from "@prelude.so/react-native-sdk-standalone";

const dispatchId = await Prelude.dispatchSignals({
  sdk_key: "YOUR_SDK_KEY", // platform-scoped: use the Apple/Android/Web key
});
```

`dispatchSignals` also accepts `endpoint` (no trailing slash),
`timeout_milliseconds`, `implemented_features`, and `max_retries`.

Silent verification (dispatch signals first with the `SilentVerification`
feature enabled):

```typescript
const result = await Prelude.verifySilent({
  sdk_key: "YOUR_SDK_KEY",
  request_url: "https://...",
});
```

## Notes

- iOS pulls the Apple SDK sources on install. Set `PRELUDE_SKIP_APPLE_SDK=1` to
  skip that download (e.g. web-only or Android-only CI).
- Web accepts `timeout_milliseconds` / `max_retries` for parity but ignores them.
