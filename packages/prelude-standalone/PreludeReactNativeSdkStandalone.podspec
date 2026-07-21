require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

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

  # ios/*.{swift,mm} plus the Apple SDK sources fetched into ios/sdk by the
  # postinstall script.
  s.source_files        = "ios/**/*.{swift,h,m,mm}"
  s.vendored_frameworks = "ios/sdk/core/PreludeCore.xcframework"

  s.pod_target_xcconfig = {
    "DEFINES_MODULE" => "YES",
    "SWIFT_COMPILATION_MODE" => "wholemodule"
  }

  # Pulls in React-Core and the New Architecture dependencies plus the
  # RCT_NEW_ARCH_ENABLED flag from the host app's React Native install.
  install_modules_dependencies(s)
end
