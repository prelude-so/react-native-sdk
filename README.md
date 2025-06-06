# Readme
### Using the Expo React Native SDK

The Expo React Native SDK allows you to capture certain device signals (both in Android and iOS) that will be reported back to Prelude and perform silent verification of mobile devices.

It is provided as an Expo module that you can integrate into your React Native Expo Application.

The Android `minSdkVersion` value in the SDK is set to 26 (Android 8.0). If your application has a lower value you may need to update it.

## Configuring the project

First install the SDK dependency in your app:

```
npm install @prelude.so/react-native-sdk
```

Then, wherever in your application you want to report the device signals you can use code like this:

```
...
// Import the react state types
import { useEffect, useState } from "react";
// Import the SDK types
import * as PreludeReactNativeSdk from '@prelude.so/react-native-sdk';
...

// Define a state to receive status updates
const [dispatchStatus, setDispatchStatus] = useState({ dispatchID: "", status: "" });

...
// Subscribe to the event (it will report more than one success/failure event depending on your platform)
useEffect(() => {
    const subscription = PreludeReactNativeSdk.onDispatchingSignals((dispatchingSignalsStatus) => {
      console.log("Dispatch status: " + dispatchingSignalsStatus.status + ". Id: " + dispatchingSignalsStatus.dispatchID);
      setDispatchStatus(dispatchingSignalsStatus);
    });

    return () => {
      subscription.remove();
    }
  }, [dispatchStatus]);

...
// Submit the signals in any of your app event handlers (here is a button example)
<Button title={`Dispatch Signals`} onPress={() =>
  PreludeReactNativeSdk.dispatchSignals({
      sdk_key: "YOUR-SDK-KEY"
    })
    .catch((error) => {
        console.log("Dispatch error: " + error);
    })
} />

```

Then run the Expo application normally (in your application's directory):

```
npx expo run:ios
```

or

```
npx expo run:android
```

Once you get the dispatch ID through the event, you can report it back to your own API to be forwarded in subsequent network calls.

There is no restriction on when to call this API, you just need to take this action before you need to report back the dispatch ID. It is advisable to make the request early on during the user onboarding process to have the dispatch id available when required.

#### Silent Verification

The Silent Verification feature allows you to verify a phone number without requiring the user to manually enter a verification code.

It is available for certain carriers and requires a server-side service to handle the verification process. For this verification method to work properly, you must gather the device signals mentioned before and report the dispatch identifier to your backend (usually in your APIs verification endpoint).

Please refer to the [Silent Verification documentation](https://docs.prelude.so/verify/silent/overview) for more information on how to implement this feature.