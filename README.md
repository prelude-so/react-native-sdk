# Readme
### Using the Expo React Native SDK

The Expo React Native SDK allows you to capture certain device signals (both in Android and iOS) that will be reported back to Prelude and perform silent verification of mobile devices.

It is provided as an Expo module that you can integrate into your React Native Expo Application.

The Android `minSdkVersion` value in the SDK is set to 26 (Android 8.0). If your application has a lower value you may need to update it.

## Usage

The SDK is available in npmjs. You can install the SDK dependency directly from npm:

```
npm install @prelude.so/react-native-sdk
```

You will need to have the Prelude SDK key that you generate in the Prelude dashboard for your account.

***Important: When you generate the SDK key in the Prelude dashboard you will be able to copy it and you should store it somewhere secure, as the dashboard will not allow you to display the same key again.***

#### Gathering Device Signals

**Note**: Starting with v0.3.0 of the SDK, we have removed the status event and made the `dispatchSignals` function return a promise that resolves to the dispatch identifier, simplifying its usage.

To collect the device signals in your application you can use code like this:

```
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

```
npx expo run:ios
```

or

```
npx expo run:android
```

Once you get the dispatch identifier through the event, you can report it back to your own API to be forwarded in subsequent network calls.

There is no restriction on when to call this API, you just need to take this action before you need to report back the dispatch ID.

The recommended way of integrating it is to call the `dispatchSignals` function before displaying the phone number verification screen in your application. This way you can ensure that the device signals are captured and the `dispatchID` can be sent to your back-end with the phone number. Your back-end will then perform the verification call to Prelude with the phone number and the dispatch identifier.

#### Silent Verification

The Silent Verification feature allows you to verify a phone number without requiring the user to manually enter a verification code.

It is available for certain carriers and requires a server-side service to handle the verification process. For this verification method to work properly, you *must* collect the device signals mentioned before and report the dispatch identifier to your back-end (usually in your APIs verification endpoint).

Please refer to the [Silent Verification documentation](https://docs.prelude.so/verify/silent/overview) for more information on how to implement this feature.