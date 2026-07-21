# Readme
## Using the Expo React Native SDK

The Expo React Native SDK allows you to gather device signals and perform silent verification of mobile devices.

### Gathering Device Signals
The SDK allows you to capture certain device signals (both in Android and iOS) that will be reported back to Prelude.

It is provided as an Expo module that you can integrate into your React Native Expo Application.

The Android `minSdkVersion` value in the SDK is set to 26 (Android 8.0). If you application has a lower value you may need to update it.

#### Configuring the project

First install the SDK dependency in your app:

```
npm install @prelude.so/react-native-sdk
```

Then, where ever in your application you want to report the device signals you can use code like this:

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
// Subscribe to the event
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

### Web (react-native-web) support

The SDK also runs on web through Expo's web target. Web calls are delegated to [`@prelude.so/js-sdk`](https://www.npmjs.com/package/@prelude.so/js-sdk), which is bundled as a regular dependency.

Caveats:
- `@prelude.so/js-sdk` ships a Web Worker + WASM. Your bundler (Metro, webpack, Vite) must support `new Worker(new URL(..., import.meta.url))`.
- `timeout_milliseconds` and `max_retries` are accepted for API parity but are no-ops on web — the JS SDK uses its own defaults.
- `verifySilent` on web injects a `<script>` tag into the page rather than using a webview.

### Silent Verification

The Silent Verification feature allows you to verify a phone number without requiring the user to enter a verification code. It is available for certain carriers and requires a server-side service to handle the verification process.

The SDK provides a simple API to initiate the verification process and handle the response.

We assume here that you have a server-side service that exposes the 2 endpoints, one to start the verification and another to check the final code. In this sample code we expose those endpoints via an `Api` module that will call each endpoint via a separate function.

When calling the verification API, you will need to provide the phone number to verify. The API will return a request URL that the SDK will navigate to in order to complete the verification process.

```typescript
// Import the SDK types and your API module
import * as PreludeReactNativeSdk from '@prelude.so/react-native-sdk';
import * as Api from './YourBackendApi';

// Call the verification endpoint with the phone number.
// If the phone number is compatible with the Silent Verification feature, 
// the API will return a request URL that the SDK will navigate to.
const request_url = await Api.verify(phone_number);

// Then call the verifySilent method with the SDK key and the request URL.
// If the verification is successful, the SDK will return a code that you 
// can use to check the verification status.
var code = await PreludeReactNativeSdk.verifySilent({
    sdk_key: sdk_key,
    request_url: request_url,
});

// Finally, call the checkSilent method with the phone number and the code
// Your API should handle the check and return the verification status.
const check_status = await Api.check(phone_number, code);

// Handle the verification status as needed in your application
```
