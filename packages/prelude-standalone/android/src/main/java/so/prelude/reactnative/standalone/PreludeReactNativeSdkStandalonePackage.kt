package so.prelude.reactnative.standalone

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class PreludeReactNativeSdkStandalonePackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
    if (name == PreludeReactNativeSdkStandaloneModule.NAME) {
      PreludeReactNativeSdkStandaloneModule(reactContext)
    } else {
      null
    }

  override fun getReactModuleInfoProvider() = ReactModuleInfoProvider {
    mapOf(
      PreludeReactNativeSdkStandaloneModule.NAME to ReactModuleInfo(
        PreludeReactNativeSdkStandaloneModule.NAME,
        PreludeReactNativeSdkStandaloneModule.NAME,
        false, // canOverrideExistingModule
        false, // needsEagerInit
        false, // isCxxModule
        BuildConfig.IS_NEW_ARCHITECTURE_ENABLED, // isTurboModule
      ),
    )
  }
}
