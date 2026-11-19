require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

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
  s.vendored_frameworks = 'sdk/core/PreludeCore.xcframework'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
  s.source_files = "**/*.swift", "../sdk/**/*.swift"
end
