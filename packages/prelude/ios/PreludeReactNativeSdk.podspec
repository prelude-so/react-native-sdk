require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

# The Apple SDK is served through the app's distribution link, so it is fetched
# on `pod install` rather than packaged with the pod.
system('node', File.join(__dir__, '..', 'scripts', 'fetch-apple-sdk.js'), Pod::Config.instance.installation_root.to_s) \
  or raise 'Prelude: fetching the Apple SDK failed, see the message above.'

Pod::Spec.new do |s|
  s.name           = 'PreludeReactNativeSdk'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms      = { :ios => '15.1', :tvos => '15.1' }
  s.swift_version  = '5.4'
  s.source         = { git: 'https://github.com/prelude-so/react-native-sdk' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.vendored_frameworks = 'sdk/PreludeSignals.xcframework', 'sdk/PreludeCore.xcframework'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
  s.source_files = "*.swift"
end
