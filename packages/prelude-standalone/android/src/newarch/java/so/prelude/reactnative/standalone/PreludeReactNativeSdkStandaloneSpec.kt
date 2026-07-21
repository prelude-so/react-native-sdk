package so.prelude.reactnative.standalone

import com.facebook.react.bridge.ReactApplicationContext

// New Architecture: extend the codegen-generated spec.
abstract class PreludeReactNativeSdkStandaloneSpec(context: ReactApplicationContext) :
  NativePreludeReactNativeSdkStandaloneSpec(context)
