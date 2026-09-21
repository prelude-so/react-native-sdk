# Prelude React Native SDKs


Prelude ships two React Native SDKs with an identical API. Use `@prelude.so/react-native-sdk` for Expo apps (managed, or bare with Expo modules), and `@prelude.so/react-native-sdk-standalone` for plain React Native apps that don't use Expo. Web behaves the same in both (it delegates to `@prelude.so/js-sdk`).

### Using the Expo React Native SDK

The Expo React Native SDK allows you to capture certain device signals (both in Android and iOS) that will be reported back to Prelude and perform silent verification of mobile devices.

It is provided as an Expo module that you can integrate into your React Native Expo Application.

### Requirements

- iOS deployment target **15.1+**
- Android minimum SDK **API 26** (Android 8.0), if your application has a lower value you need to raise it
- Built and tested against Expo SDK **52** / React Native **0.76**; the peer ranges themselves are unpinned

### Setup

#### Using NPM

The SDK is available in npm. You can install the SDK dependency directly using `npm`:

```
npm install @prelude.so/react-native-sdk
```

#### Using Bun

Bun requires you to trust the `postinstall` script:

```
bun add --trust @prelude.so/react-native-sdk
```

#### Using pnpm

pnpm v10+ requires explicit permission for `postinstall` scripts:

```
pnpm add --allow-build=@prelude.so/react-native-sdk @prelude.so/react-native-sdk
```

You will need to have the Prelude SDK key that you generate in the [Prelude dashboard](https://app.prelude.so/) for your account.

***Important: When you generate the SDK key in the Prelude dashboard, you will be able to copy it, so keep it somewhere you can retrieve it later, as the dashboard will not allow you to display the same key again. The SDK key is a publishable, client-side key that ships inside your app, so this is about not losing it, not about keeping it secret.***

Because the React Native SDK bridges into the native iOS and Android SDKs at runtime, SDK keys are scoped per platform. Generate one key with the **Apple** platform and one with the **Android** platform in the dashboard, then select the appropriate key at runtime based on `Platform.OS`.

#### Gathering Device Signals

**Note**: Starting with v0.3.0 of the SDK, we have removed the status event and made the `dispatchSignals` function return a promise that resolves to the dispatch identifier, simplifying its usage.

To collect the device signals in your application, you can use code like this:

```typescript
...
// Import the SDK types
import * as PreludeReactNativeSdk from '@prelude.so/react-native-sdk';
...

...
// Submit the signals in any of your app event handlers (here is a button example)
<Button title={`Dispatch Signals`} onPress={ async () =>
  {
    try {
        const dispatchId = await PreludeReactNativeSdk.dispatchSignals({
          sdk_key: "YOUR_SDK_KEY", // Replace with your Prelude SDK key
        });

        // Handle the dispatch ID as needed,
        // e.g., store it or continue with verification here
        alert(`Dispatch ID: ${dispatchId}`);
    } catch (error) {
        alert(`Signals dispatch error: ${error.message}`);
    }
  }}
/>

```

Then run the Expo application normally (in your application's directory):

```bash
npx expo run:ios
```

or

```bash
npx expo run:android
```

Once you get the dispatch identifier through the event, you can report it back to your own API to be forwarded in later network calls, for example, when starting the onboarding verification process for a user.

There are some arguments that you can use to fine-tune the behavior of the `dispatchSignals` function for your use case:

```typescript
...
await PreludeReactNativeSdk.dispatchSignals({
  sdk_key: "YOUR_SDK_KEY",
  timeout_milliseconds: 5000, // Optional timeout in milliseconds for each network request (default is 5000 ms)
  max_retries: 3,             // Optional maximum number of automatic retries with exponential backoff for each network request (default is 3)
});
...
```

#### Silent Verification

The Silent Verification feature allows you to verify a phone number without requiring the user to manually enter a verification code.

It is available for certain carriers and requires a server-side service to handle the verification process. For this verification method to work properly, you *must* collect the device signals mentioned before and report the dispatch identifier to your back-end (usually in your APIs verification endpoint).

Please refer to the [Silent Verification documentation](https://docs.prelude.so/verify/v2/documentation/silent-verification) for more information on how to implement this feature.

### Using the standalone (no-Expo) React Native SDK

For plain React Native apps that don't use Expo, install `@prelude.so/react-native-sdk-standalone` instead. It exposes the same `dispatchSignals` and `verifySilent` API shown above.

```
npm install @prelude.so/react-native-sdk-standalone
```

The React Native Community CLI autolinks the native module. Rebuild after installing (`pod install` for iOS, a Gradle sync for Android). The Android `minSdkVersion` is 26 (Android 8.0). The iOS Apple SDK download in `postinstall` only runs on macOS and retries transient GitHub failures. Set `PRELUDE_SKIP_APPLE_SDK=1` to skip it on Android-only or web-only installs.

On web, the standalone SDK runs through `react-native-web` and your web bundler, delegating to `@prelude.so/js-sdk`. Because js-sdk collects signals in a Web Worker and ships prebuilt, let your bundler consume it as-is and follow the js-sdk web setup guidance.


If you use `Transporter` it will not allow you to use the `--use-old-altool` flag. You will need to use the `xcrun` command instead.
