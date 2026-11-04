require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

# The Apple SDK is served through the app's distribution link, so it is fetched
# on `pod install` rather than packaged with the pod.
system("node", File.join(__dir__, "scripts", "fetch-apple-sdk.js"), Pod::Config.instance.installation_root.to_s) \
  or raise "Prelude: fetching the Apple SDK failed, see the message above."

Pod::Spec.new do |s|
  s.name           = "PreludeReactNativeSdkStandalone"
  s.version        = package["version"]
  s.summary        = package["description"]
  s.description    = "Prelude device-signal and silent-verification SDK for React Native (no Expo)."
  s.license        = package["license"]
  s.author         = package["author"]
  s.homepage       = package["homepage"]
  s.platforms      = { :ios => "15.1" }
  s.swift_version  = "5.4"
  s.source         = { :git => "https://github.com/prelude-so/react-native-sdk.git", :tag => "v#{s.version}" }
  s.static_framework = true

  # The xcframeworks are deliberately not globbed as sources: each carries one
  # copy of its headers per slice, and pulling those in makes them public
  # headers that collide ("Multiple commands produce") once the pod is built
  # as a framework.
  s.source_files        = "ios/*.{swift,h,m,mm}"
  s.vendored_frameworks = "ios/sdk/PreludeSignals.xcframework", "ios/sdk/PreludeCore.xcframework"

  s.pod_target_xcconfig = {
    "DEFINES_MODULE" => "YES",
    "SWIFT_COMPILATION_MODE" => "wholemodule"
  }

  # Pulls in React-Core and the New Architecture dependencies plus the
  # RCT_NEW_ARCH_ENABLED flag from the host app's React Native install.
  install_modules_dependencies(s)
end
