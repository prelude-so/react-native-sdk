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
`minSdkVersion 26` and `compileSdkVersion 35` or later.

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

## Web

Web goes through `react-native-web`, like any React Native library: add it plus
a web bundler (webpack, Rspack, Vite, …) if your app doesn't already build for
web. On web the SDK delegates to `@prelude.so/js-sdk`, which runs signal
collection in a Web Worker and ships prebuilt — let your bundler consume it
as-is (e.g. don't run `@prelude.so/js-sdk` through the React Native Babel
preset). Follow the js-sdk web setup guidance for bundler specifics.

## Notes

- Apple SDK installation is skipped automatically on platforms other than macOS. On
  macOS, set `PRELUDE_SKIP_APPLE_SDK=1` to skip it for web-only or Android-only
  installs. Downloads and extraction happen in a temporary directory; failures
  warn and let package installation continue without changing an existing SDK.
  The Apple SDK may then be missing or out of date. Before building iOS, unset
  the skip flag and run `npm rebuild --foreground-scripts @prelude.so/react-native-sdk-standalone` on
  macOS to retry. Transient request failures retain the existing five-attempt
  retry policy; the installer warns and preserves the existing SDK when those
  attempts are exhausted.
- Web accepts `timeout_milliseconds` / `max_retries` for parity but ignores them.
